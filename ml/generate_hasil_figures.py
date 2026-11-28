"""Generate pure black-and-white / grayscale evaluation and feature-importance figures for HASIL DAN PEMBAHASAN."""

from pathlib import Path
import sys
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

ML_DIR = Path(__file__).resolve().parent
ROOT_DIR = ML_DIR.parent
OUT_DIR = ROOT_DIR / "assets" / "journal_figures"

if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from data_loader import load_weekly_data
from features import FEATURE_COLUMNS, TARGET_COLUMN, create_features
from train_and_predict import calculate_wape, train_full_model

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["figure.facecolor"] = "#FFFFFF"
plt.rcParams["axes.facecolor"] = "#FFFFFF"
plt.rcParams["axes.edgecolor"] = "#000000"
plt.rcParams["text.color"] = "#000000"
plt.rcParams["axes.labelcolor"] = "#000000"
plt.rcParams["xtick.color"] = "#000000"
plt.rcParams["ytick.color"] = "#000000"

BLACK = "#000000"
DARK_GRAY = "#333333"
LIGHT_GRAY = "#D9D9D9"
WHITE = "#FFFFFF"

MONTH_ABBR = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "Mei",
    6: "Jun",
    7: "Jul",
    8: "Agt",
    9: "Sep",
    10: "Okt",
    11: "Nov",
    12: "Des",
}


def _fmt_id(val: float, decimals: int = 2) -> str:
    """Format number with Indonesian comma decimal separator."""
    if decimals == 0:
        return f"{int(round(val))}"
    return f"{val:.{decimals}f}".replace(".", ",")


def _clean_axes(ax) -> None:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(BLACK)
    ax.spines["bottom"].set_color(BLACK)
    ax.spines["left"].set_linewidth(1.0)
    ax.spines["bottom"].set_linewidth(1.0)
    ax.grid(axis="y", linestyle=":", linewidth=0.7, color="#BBBBBB", zorder=0)
    ax.set_axisbelow(True)


def make_evaluasi_model(weekly_agg, metrics: dict) -> None:
    """Gambar 9: 3-panel B&W chart (weekly test trend + MAE bar + WAPE bar)."""
    fig, (ax1, ax2, ax3) = plt.subplots(
        1,
        3,
        figsize=(11.6, 4.3),
        dpi=300,
        gridspec_kw={"width_ratios": [2.35, 1.0, 1.0], "wspace": 0.30},
    )
    fig.patch.set_facecolor(WHITE)

    # Panel (a): Total penjualan mingguan pada 4 minggu uji
    week_labels = [
        f"{d.day} {MONTH_ABBR[d.month]}\n2026" for d in weekly_agg["week_start_date"]
    ]
    x = np.arange(len(week_labels))
    actual_vals = weekly_agg["actual"].to_numpy(dtype=float)
    rf_vals = weekly_agg["rf"].to_numpy(dtype=float)
    base_vals = weekly_agg["base"].to_numpy(dtype=float)

    ax1.plot(
        x,
        actual_vals,
        color=BLACK,
        linestyle="-",
        linewidth=2.0,
        marker="o",
        markersize=6.5,
        markerfacecolor=BLACK,
        markeredgecolor=BLACK,
        label="Aktual",
        zorder=4,
    )
    ax1.plot(
        x,
        rf_vals,
        color=BLACK,
        linestyle="--",
        linewidth=1.8,
        marker="s",
        markersize=6.0,
        markerfacecolor=WHITE,
        markeredgecolor=BLACK,
        markeredgewidth=1.4,
        label="Random Forest (rf_v1)",
        zorder=4,
    )
    ax1.plot(
        x,
        base_vals,
        color="#444444",
        linestyle=":",
        linewidth=1.8,
        marker="^",
        markersize=6.5,
        markerfacecolor="#CCCCCC",
        markeredgecolor=BLACK,
        markeredgewidth=1.1,
        label="Baseline (rolling_mean_4)",
        zorder=3,
    )

    # Pembatas minggu non-gajian vs minggu gajian
    ax1.axvline(1.5, color="#666666", linestyle="-.", linewidth=1.0, zorder=1)
    ax1.text(0.55, 1020, "Non-gajian", ha="center", va="top", fontsize=8.5, style="italic", color=BLACK)
    ax1.text(2.45, 1020, "Minggu gajian", ha="center", va="top", fontsize=8.5, style="italic", color=BLACK)

    # Label nilai per titik dengan offset agar tidak bertabrakan
    ax1.annotate(_fmt_id(base_vals[0], 1), (x[0], base_vals[0]), xytext=(0, 8), textcoords="offset points", ha="center", fontsize=8.0, color=BLACK)
    ax1.annotate(_fmt_id(rf_vals[0], 0), (x[0], rf_vals[0]), xytext=(0, 8), textcoords="offset points", ha="center", fontsize=8.2, color=BLACK)
    ax1.annotate(_fmt_id(actual_vals[0], 0), (x[0], actual_vals[0]), xytext=(0, -14), textcoords="offset points", ha="center", fontsize=8.2, fontweight="bold", color=BLACK)

    ax1.annotate(_fmt_id(base_vals[1], 1), (x[1], base_vals[1]), xytext=(0, 8), textcoords="offset points", ha="center", fontsize=8.0, color=BLACK)
    ax1.annotate(_fmt_id(actual_vals[1], 0), (x[1], actual_vals[1]), xytext=(-16, 8), textcoords="offset points", ha="center", fontsize=8.2, fontweight="bold", color=BLACK)
    ax1.annotate(_fmt_id(rf_vals[1], 0), (x[1], rf_vals[1]), xytext=(10, -15), textcoords="offset points", ha="center", fontsize=8.2, color=BLACK)

    for i in (2, 3):
        ax1.annotate(_fmt_id(actual_vals[i], 0), (x[i], actual_vals[i]), xytext=(0, 9), textcoords="offset points", ha="center", fontsize=8.2, fontweight="bold", color=BLACK)
        ax1.annotate(_fmt_id(rf_vals[i], 0), (x[i], rf_vals[i]), xytext=(0, -14), textcoords="offset points", ha="center", fontsize=8.2, color=BLACK)
        ax1.annotate(_fmt_id(base_vals[i], 1), (x[i], base_vals[i]), xytext=(0, -14), textcoords="offset points", ha="center", fontsize=8.0, color=BLACK)

    ax1.set_xticks(x)
    ax1.set_xticklabels(week_labels, fontsize=8.5)
    ax1.set_ylabel("Total Penjualan Mingguan (pcs)", fontsize=9.2)
    ax1.set_xlim(-0.35, 3.35)
    ax1.set_ylim(370, 1055)
    ax1.set_title("(a) Penjualan Mingguan Uji", fontsize=10.0, fontweight="bold", pad=8)
    ax1.legend(
        loc="lower right",
        frameon=True,
        facecolor=WHITE,
        edgecolor="#999999",
        fontsize=7.8,
    )
    _clean_axes(ax1)

    # Panel (b): Perbandingan MAE
    methods = ["Baseline", "Random\nForest"]
    mae_vals = [metrics["base_mae"], metrics["rf_mae"]]
    bx = np.arange(len(methods))
    bars_mae = ax2.bar(
        bx,
        mae_vals,
        width=0.52,
        color=[WHITE, DARK_GRAY],
        edgecolor=BLACK,
        linewidth=1.2,
        zorder=3,
    )
    bars_mae[0].set_hatch("///")
    for idx, bar in enumerate(bars_mae):
        ax2.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.14,
            _fmt_id(mae_vals[idx], 2),
            ha="center",
            va="bottom",
            fontsize=8.8,
            fontweight="bold",
            color=BLACK,
        )
    ax2.set_xticks(bx)
    ax2.set_xticklabels(methods, fontsize=8.5)
    ax2.set_ylabel("MAE (pcs/minggu)", fontsize=9.2)
    ax2.set_ylim(0, max(mae_vals) * 1.24)
    ax2.set_title("(b) Nilai MAE", fontsize=10.0, fontweight="bold", pad=8)
    _clean_axes(ax2)

    # Panel (c): Perbandingan WAPE
    wape_vals = [metrics["base_wape"], metrics["rf_wape"]]
    bars_wape = ax3.bar(
        bx,
        wape_vals,
        width=0.52,
        color=[WHITE, DARK_GRAY],
        edgecolor=BLACK,
        linewidth=1.2,
        zorder=3,
    )
    bars_wape[0].set_hatch("///")
    for idx, bar in enumerate(bars_wape):
        ax3.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.9,
            f"{_fmt_id(wape_vals[idx], 2)}%",
            ha="center",
            va="bottom",
            fontsize=8.8,
            fontweight="bold",
            color=BLACK,
        )
    ax3.set_xticks(bx)
    ax3.set_xticklabels(methods, fontsize=8.5)
    ax3.set_ylabel("WAPE (%)", fontsize=9.2)
    ax3.set_ylim(0, max(wape_vals) * 1.24)
    ax3.set_title("(c) Nilai WAPE (%)", fontsize=10.0, fontweight="bold", pad=8)
    _clean_axes(ax3)

    fig.savefig(OUT_DIR / "gambar_9_evaluasi_model.png", bbox_inches="tight", dpi=300, facecolor=WHITE)
    plt.close(fig)


def make_feature_importance(top10: list[tuple[str, float]]) -> None:
    """Gambar 10: Horizontal B&W bar chart of Top 10 feature importances."""
    fig, ax = plt.subplots(figsize=(9.5, 4.7), dpi=300)
    fig.patch.set_facecolor(WHITE)

    names = [item[0] for item in reversed(top10)]
    pcts = [item[1] * 100.0 for item in reversed(top10)]
    y = np.arange(len(names))

    # Top 2 features (rolling_mean_8 & is_payday_week) are at indices len-1, len-2 after reverse
    colors = [DARK_GRAY if i >= len(names) - 2 else WHITE for i in range(len(names))]
    bars = ax.barh(
        y,
        pcts,
        height=0.62,
        color=colors,
        edgecolor=BLACK,
        linewidth=1.1,
        zorder=3,
    )
    for i, bar in enumerate(bars):
        if i < len(names) - 2:
            bar.set_hatch("///")
        ax.text(
            bar.get_width() + 1.0,
            bar.get_y() + bar.get_height() / 2,
            f"{_fmt_id(pcts[i], 2)}%",
            ha="left",
            va="center",
            fontsize=8.8,
            fontweight="bold" if i >= len(names) - 2 else "normal",
            color=BLACK,
        )

    ax.set_yticks(y)
    ax.set_yticklabels(names, fontsize=9.2)
    ax.set_xlabel("Bobot Kontribusi Fitur (%)", fontsize=9.5)
    ax.set_xlim(0, max(pcts) + 12.0)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(BLACK)
    ax.spines["bottom"].set_color(BLACK)
    ax.spines["left"].set_linewidth(1.0)
    ax.spines["bottom"].set_linewidth(1.0)
    ax.grid(axis="x", linestyle=":", linewidth=0.7, color="#BBBBBB", zorder=0)
    ax.set_axisbelow(True)

    fig.savefig(OUT_DIR / "gambar_10_feature_importance.png", bbox_inches="tight", dpi=300, facecolor=WHITE)
    plt.close(fig)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    _, weekly = load_weekly_data()
    feat = create_features(weekly)

    unique_weeks = sorted(feat["week_start_date"].unique())
    split_week = unique_weeks[-4]
    train_df = feat[feat["week_start_date"] < split_week]
    test_df = feat[feat["week_start_date"] >= split_week].copy()

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN])

    rf_raw = np.clip(model.predict(test_df[FEATURE_COLUMNS]), a_min=0, a_max=None)
    test_df["rf_int"] = np.round(rf_raw).astype(int)
    base_preds = test_df["rolling_mean_4"].to_numpy()

    metrics = {
        "rf_mae": float(mean_absolute_error(test_df[TARGET_COLUMN], rf_raw)),
        "rf_wape": float(calculate_wape(test_df[TARGET_COLUMN], rf_raw)),
        "base_mae": float(mean_absolute_error(test_df[TARGET_COLUMN], base_preds)),
        "base_wape": float(calculate_wape(test_df[TARGET_COLUMN], base_preds)),
    }

    weekly_agg = (
        test_df.groupby("week_start_date", as_index=False)
        .agg(actual=("qty", "sum"), rf=("rf_int", "sum"), base=("rolling_mean_4", "sum"))
        .sort_values("week_start_date")
        .reset_index(drop=True)
    )

    make_evaluasi_model(weekly_agg, metrics)

    full_model = train_full_model(feat)
    fi_sorted = sorted(zip(FEATURE_COLUMNS, full_model.feature_importances_), key=lambda x: -x[1])
    make_feature_importance(fi_sorted[:10])

    print(f"Generated B&W HASIL figures in {OUT_DIR}")
    print(f"Metrics: RF MAE={metrics['rf_mae']:.2f}, RF WAPE={metrics['rf_wape']:.2f}%, Base MAE={metrics['base_mae']:.2f}, Base WAPE={metrics['base_wape']:.2f}%")


if __name__ == "__main__":
    main()
