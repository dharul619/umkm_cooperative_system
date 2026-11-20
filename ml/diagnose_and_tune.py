"""Diagnostik error, feature importance, dan tuning Random Forest."""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

from data_loader import load_weekly_data
from features import FEATURE_COLUMNS, TARGET_COLUMN, create_features


def calculate_wape(y_true: pd.Series, y_pred: np.ndarray) -> float:
    total_actual = float(np.sum(np.abs(y_true)))
    if total_actual == 0:
        return 0.0
    return (float(np.sum(np.abs(y_true - y_pred))) / total_actual) * 100.0


def add_extra_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tambahkan fitur eksperimen (ewm_4, rolling_std_4, expanding_mean) tanpa ubah features.py."""
    out = df.copy()
    out = out.sort_values(["product_id", "week_start_date"]).reset_index(drop=True)
    grouped_qty = out.groupby("product_id")["qty"]

    out["ewm_4"] = grouped_qty.transform(
        lambda s: s.shift(1).ewm(span=4, adjust=False).mean()
    )
    out["rolling_std_4"] = grouped_qty.transform(
        lambda s: s.shift(1).rolling(window=4, min_periods=1).std().fillna(0.0)
    )
    out["expanding_mean"] = grouped_qty.transform(
        lambda s: s.shift(1).expanding(min_periods=1).mean()
    )
    return out.dropna(subset=["lag_1", "lag_2", "lag_3", "lag_4"]).reset_index(drop=True)


def run_experiment(
    df: pd.DataFrame,
    feature_cols: list[str],
    criterion: str,
    max_depth: int | None,
    min_samples_leaf: int,
    n_estimators: int = 300,
    test_weeks_count: int = 4,
) -> tuple[dict, RandomForestRegressor, pd.DataFrame]:
    unique_weeks = sorted(df["week_start_date"].unique())
    split_week = unique_weeks[-test_weeks_count]

    train_df = df[df["week_start_date"] < split_week]
    test_df = df[df["week_start_date"] >= split_week].copy()

    model = RandomForestRegressor(
        n_estimators=n_estimators,
        criterion=criterion,
        max_depth=max_depth,
        min_samples_leaf=min_samples_leaf,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(train_df[feature_cols], train_df[TARGET_COLUMN])

    preds = np.clip(model.predict(test_df[feature_cols]), a_min=0, a_max=None)
    test_df["pred"] = preds
    test_df["abs_err"] = np.abs(test_df[TARGET_COLUMN] - test_df["pred"])

    mae = mean_absolute_error(test_df[TARGET_COLUMN], preds)
    wape = calculate_wape(test_df[TARGET_COLUMN], preds)

    metrics = {
        "mae": mae,
        "wape": wape,
        "accuracy": max(0.0, 100.0 - wape),
    }
    return metrics, model, test_df


if __name__ == "__main__":
    _, weekly = load_weekly_data()
    base_df = create_features(weekly, drop_na=True)
    extra_df = add_extra_features(create_features(weekly, drop_na=False))

    extra_cols = FEATURE_COLUMNS + ["ewm_4", "rolling_std_4", "expanding_mean"]

    # Baseline check
    unique_weeks = sorted(base_df["week_start_date"].unique())
    split_week = unique_weeks[-4]
    test_base = base_df[base_df["week_start_date"] >= split_week]
    base_mae = mean_absolute_error(test_base[TARGET_COLUMN], test_base["rolling_mean_4"])
    base_wape = calculate_wape(test_base[TARGET_COLUMN], test_base["rolling_mean_4"].to_numpy())
    print(f"Baseline (rolling_mean_4) -> MAE: {base_mae:.3f} | WAPE: {base_wape:.2f}% | Ketepatan: {100 - base_wape:.2f}%\n")

    configs = [
        ("A. Current (squared_error, depth=12, leaf=3)", base_df, FEATURE_COLUMNS, "squared_error", 12, 3),
        ("B. Current + absolute_error", base_df, FEATURE_COLUMNS, "absolute_error", 12, 3),
        ("C. ExtraFeat + squared_error (depth=10, leaf=3)", extra_df, extra_cols, "squared_error", 10, 3),
        ("D. ExtraFeat + absolute_error (depth=8, leaf=5)", extra_df, extra_cols, "absolute_error", 8, 5),
        ("E. ExtraFeat + absolute_error (depth=10, leaf=2)", extra_df, extra_cols, "absolute_error", 10, 2),
        ("F. ExtraFeat + squared_error (depth=6, leaf=5)", extra_df, extra_cols, "squared_error", 6, 5),
    ]

    best_name = ""
    best_wape = float("inf")
    best_model = None
    best_cols = None
    best_test_df = None

    print("=== PERBANDINGAN TUNING MODEL ===")
    for name, df_exp, cols, crit, depth, leaf in configs:
        m, mdl, tdf = run_experiment(df_exp, cols, crit, depth, leaf)
        print(f"{name:50s} -> MAE: {m['mae']:.3f} | WAPE: {m['wape']:.2f}% | Ketepatan: {m['accuracy']:.2f}%")
        if m["wape"] < best_wape:
            best_wape = m["wape"]
            best_name = name
            best_model = mdl
            best_cols = cols
            best_test_df = tdf

    print(f"\nModel Terbaik: {best_name}")

    print("\n=== TOP 10 FEATURE IMPORTANCE ===")
    imp = pd.Series(best_model.feature_importances_, index=best_cols).sort_values(ascending=False)
    for feat, val in imp.head(10).items():
        print(f"  {feat:18s}: {val:.4f}")

    print("\n=== TOP 10 PRODUK DENGAN ERROR TERBESAR (4 MINGGU UJI) ===")
    prod_err = (
        best_test_df.groupby(["product_id", "product_name"], as_index=False)
        .agg(
            actual_4w=("qty", "sum"),
            pred_4w=("pred", "sum"),
            total_abs_err=("abs_err", "sum"),
        )
        .sort_values("total_abs_err", ascending=False)
    )
    prod_err["pred_4w"] = prod_err["pred_4w"].round(1)
    prod_err["total_abs_err"] = prod_err["total_abs_err"].round(1)
    print(prod_err.head(10).to_string(index=False))

    total_err_all = prod_err["total_abs_err"].sum()
    top10_share = (prod_err.head(10)["total_abs_err"].sum() / total_err_all * 100) if total_err_all else 0
    print(f"\nKontribusi error Top 10 produk terhadap total error: {top10_share:.1f}%")
