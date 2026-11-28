"""Generate pure black-and-white line-art methodology figures for the SIKOMU journal."""

from pathlib import Path
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyArrowPatch, FancyBboxPatch

ROOT_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT_DIR / "assets" / "journal_figures"

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.edgecolor"] = "#000000"
plt.rcParams["figure.facecolor"] = "#FFFFFF"
plt.rcParams["axes.facecolor"] = "#FFFFFF"

BLACK = "#000000"
WHITE = "#FFFFFF"


def _setup_canvas(figsize, xlim, ylim):
    """Create a pure white canvas with normalized data coordinates and no axes."""
    fig, ax = plt.subplots(figsize=figsize, dpi=300)
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.axis("off")
    return fig, ax


def _draw_box(
    ax,
    cx,
    cy,
    w,
    h,
    title,
    fontsize=10.5,
    bold=True,
    lw=1.3,
    ls="-",
    pad=0.02,
    rounding=0.02,
):
    """Draw a pure white rectangular box with black border and centered title."""
    box = FancyBboxPatch(
        (cx - w / 2, cy - h / 2),
        w,
        h,
        boxstyle=f"round,pad={pad},rounding_size={rounding}",
        linewidth=lw,
        linestyle=ls,
        edgecolor=BLACK,
        facecolor=WHITE,
        zorder=3,
    )
    ax.add_patch(box)
    ax.text(
        cx,
        cy,
        title,
        ha="center",
        va="center",
        fontsize=fontsize,
        fontweight="bold" if bold else "normal",
        color=BLACK,
        linespacing=1.3,
        zorder=4,
    )


def _draw_arrow(
    ax,
    start,
    end,
    label="",
    label_pos=None,
    bidirectional=False,
    lw=1.3,
    fontsize=8.5,
):
    """Draw a crisp black arrow with optional white-backed black text label."""
    style = "<|-|>" if bidirectional else "-|>"
    arrow = FancyArrowPatch(
        start,
        end,
        arrowstyle=style,
        mutation_scale=13,
        linewidth=lw,
        color=BLACK,
        zorder=2,
    )
    ax.add_patch(arrow)
    if label:
        lx, ly = label_pos if label_pos else ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
        ax.text(
            lx,
            ly,
            label,
            ha="center",
            va="center",
            fontsize=fontsize,
            color=BLACK,
            bbox=dict(boxstyle="square,pad=0.18", facecolor=WHITE, edgecolor="none"),
            zorder=5,
        )


def _draw_stepped_arrow(ax, points, lw=1.3):
    """Draw an orthogonal polyline with mitered corners ending with a black arrowhead."""
    last_start = points[-2]
    last_end = points[-1]
    mid_last = ((last_start[0] + last_end[0]) / 2, (last_start[1] + last_end[1]) / 2)
    poly = list(points[:-1]) + [mid_last]
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    ax.plot(xs, ys, color=BLACK, linewidth=lw, solid_joinstyle="miter", zorder=2)
    _draw_arrow(ax, mid_last, last_end, lw=lw)


def _draw_actor(ax, cx, cy, label, fontsize=9.0):
    """Draw a pure black stick-figure UML actor and label underneath."""
    head = plt.Circle((cx, cy + 0.045), 0.022, facecolor=WHITE, edgecolor=BLACK, linewidth=1.3, zorder=4)
    ax.add_patch(head)
    # Torso
    ax.plot([cx, cx], [cy + 0.023, cy - 0.028], color=BLACK, linewidth=1.3, zorder=4)
    # Arms
    ax.plot([cx - 0.032, cx + 0.032], [cy + 0.008, cy + 0.008], color=BLACK, linewidth=1.3, zorder=4)
    # Legs
    ax.plot([cx, cx - 0.024], [cy - 0.028, cy - 0.068], color=BLACK, linewidth=1.3, zorder=4)
    ax.plot([cx, cx + 0.024], [cy - 0.028, cy - 0.068], color=BLACK, linewidth=1.3, zorder=4)
    ax.text(
        cx,
        cy - 0.088,
        label,
        ha="center",
        va="top",
        fontsize=fontsize,
        fontweight="bold",
        color=BLACK,
        linespacing=1.15,
        zorder=4,
    )


def make_kerangka_penelitian():
    """Figure 1: Kerangka Penelitian (6 sequential stages, 2 rows x 3 cols)."""
    fig, ax = _setup_canvas((10.5, 4.6), (0, 1), (0, 1))

    cols = [0.18, 0.50, 0.82]
    rows = [0.73, 0.27]
    bw, bh = 0.24, 0.22

    titles = [
        "1. Identifikasi Masalah &\nPengumpulan Data",
        "2. Analisis Kebutuhan &\nPerancangan Sistem",
        "3. Implementasi Aplikasi\nWeb SIKOMU",
        "4. Pra-pemrosesan &\nRekayasa Fitur",
        "5. Pelatihan & Peramalan\nRandom Forest",
        "6. Pengujian Sistem &\nEvaluasi Model",
    ]

    coords = [
        (cols[0], rows[0]),
        (cols[1], rows[0]),
        (cols[2], rows[0]),
        (cols[0], rows[1]),
        (cols[1], rows[1]),
        (cols[2], rows[1]),
    ]

    for (cx, cy), title in zip(coords, titles):
        _draw_box(ax, cx, cy, bw, bh, title, fontsize=9.8, pad=0.015, rounding=0.015)

    pad_x = bw / 2 + 0.015
    pad_y = bh / 2 + 0.015

    # Top row: 1 -> 2 -> 3
    _draw_arrow(ax, (cols[0] + pad_x, rows[0]), (cols[1] - pad_x, rows[0]))
    _draw_arrow(ax, (cols[1] + pad_x, rows[0]), (cols[2] - pad_x, rows[0]))

    # Transition: 3 -> 4 (orthogonal stepped connector through mid-height gap)
    mid_y = (rows[0] + rows[1]) / 2
    _draw_stepped_arrow(
        ax,
        [
            (cols[2], rows[0] - pad_y),
            (cols[2], mid_y),
            (cols[0], mid_y),
            (cols[0], rows[1] + pad_y),
        ],
    )

    # Bottom row: 4 -> 5 -> 6
    _draw_arrow(ax, (cols[0] + pad_x, rows[1]), (cols[1] - pad_x, rows[1]))
    _draw_arrow(ax, (cols[1] + pad_x, rows[1]), (cols[2] - pad_x, rows[1]))

    fig.savefig(OUT_DIR / "gambar_1_kerangka_penelitian.png", bbox_inches="tight", dpi=300, facecolor=WHITE)
    plt.close(fig)


def make_arsitektur_sistem():
    """Figure 2: Arsitektur Sistem SIKOMU (3-tier stack + ML module)."""
    fig, ax = _setup_canvas((9.8, 5.6), (0, 1), (0, 1))

    lx = 0.23
    rx = 0.77
    bw, bh = 0.32, 0.14

    y_fe = 0.84
    y_be = 0.50
    y_db = 0.16

    _draw_box(ax, lx, y_fe, bw, bh, "Frontend Web\n(React, Vite, Material UI)", fontsize=10.0)
    _draw_box(ax, lx, y_be, bw, bh, "Backend REST API\n(Node.js, Express, JWT)", fontsize=10.0)
    _draw_box(ax, lx, y_db, bw, bh, "Basis Data\n(MySQL)", fontsize=10.0)
    _draw_box(ax, rx, y_be, bw, bh, "Modul Prediksi\n(Python, scikit-learn)", fontsize=10.0, ls="--")

    pad_x = bw / 2 + 0.02
    pad_y = bh / 2 + 0.02

    # Frontend <-> Backend
    _draw_arrow(
        ax,
        (lx, y_fe - pad_y),
        (lx, y_be + pad_y),
        label="HTTP/JSON",
        label_pos=(lx, (y_fe + y_be) / 2),
        bidirectional=True,
    )
    # Backend <-> Basis Data
    _draw_arrow(
        ax,
        (lx, y_be - pad_y),
        (lx, y_db + pad_y),
        label="SQL",
        label_pos=(lx, (y_be + y_db) / 2),
        bidirectional=True,
    )
    # Backend <-> Modul Prediksi
    _draw_arrow(
        ax,
        (lx + pad_x, y_be),
        (rx - pad_x, y_be),
        label="API /run",
        label_pos=((lx + rx) / 2, y_be + 0.045),
        bidirectional=True,
    )
    # Modul Prediksi -> Basis Data (orthogonal elbow)
    _draw_stepped_arrow(
        ax,
        [
            (rx, y_be - pad_y),
            (rx, y_db),
            (lx + pad_x, y_db),
        ],
    )
    ax.text(
        (rx + lx + pad_x) / 2,
        y_db + 0.038,
        "Baca / Tulis DB",
        ha="center",
        va="center",
        fontsize=8.5,
        color=BLACK,
        bbox=dict(boxstyle="square,pad=0.12", facecolor=WHITE, edgecolor="none"),
        zorder=5,
    )

    fig.savefig(OUT_DIR / "gambar_2_arsitektur_sistem.png", bbox_inches="tight", dpi=300, facecolor=WHITE)
    plt.close(fig)


def make_use_case_sikomu():
    """Figure 3: Diagram Use Case SIKOMU in pure black-and-white."""
    fig, ax = _setup_canvas((11.2, 7.6), (0, 1), (0, 1))

    # System boundary box
    boundary = FancyBboxPatch(
        (0.20, 0.05),
        0.60,
        0.90,
        boxstyle="square,pad=0.0",
        linewidth=1.5,
        edgecolor=BLACK,
        facecolor=WHITE,
        zorder=1,
    )
    ax.add_patch(boundary)
    ax.text(
        0.50,
        0.92,
        "Sistem Informasi Koperasi Multi-Unit (SIKOMU)",
        ha="center",
        va="center",
        fontsize=10.5,
        fontweight="bold",
        color=BLACK,
        zorder=3,
    )

    # Actors
    actors = {
        "admin": (0.09, 0.77, "System\nAdministrator"),
        "biscoord": (0.09, 0.34, "Business\nCoordinator"),
        "jastip": (0.91, 0.70, "Jastip\nCoordinator"),
        "member": (0.91, 0.25, "Cooperative\nMember"),
    }
    for cx, cy, lbl in actors.values():
        _draw_actor(ax, cx, cy, lbl, fontsize=8.8)

    left_cases = [
        ("Kelola Pengguna & Role", 0.83, "admin"),
        ("Kelola Unit Koperasi", 0.73, "admin"),
        ("Kelola Anggota", 0.63, "admin"),
        ("Kelola Produk & Stok", 0.51, "biscoord"),
        ("Proses Kasir (POS)", 0.41, "biscoord"),
        ("Catat Simpan Pinjam", 0.31, "biscoord"),
        ("Lihat Laporan Penjualan", 0.21, "biscoord"),
        ("Lihat Prediksi & Restok", 0.11, "biscoord"),
    ]

    right_cases = [
        ("Kelola Trip Jastip", 0.79, "jastip"),
        ("Kelola Order Jastip", 0.67, "jastip"),
        ("Terima Pembayaran Jastip", 0.55, "jastip"),
        ("Lihat Tagihan & Order", 0.36, "member"),
        ("Ajukan Pinjaman", 0.24, "member"),
        ("Lihat Riwayat Simpanan", 0.12, "member"),
    ]

    ew, eh = 0.25, 0.072

    for title, y, actor_key in left_cases:
        ex = 0.35
        ell = Ellipse((ex, y), ew, eh, facecolor=WHITE, edgecolor=BLACK, linewidth=1.2, zorder=3)
        ax.add_patch(ell)
        ax.text(ex, y, title, ha="center", va="center", fontsize=8.3, color=BLACK, zorder=4)
        ax_x, ax_y, _ = actors[actor_key]
        ax.plot([ax_x + 0.036, ex - ew / 2], [ax_y, y], color=BLACK, linewidth=1.0, zorder=2)

    for title, y, actor_key in right_cases:
        ex = 0.65
        ell = Ellipse((ex, y), ew, eh, facecolor=WHITE, edgecolor=BLACK, linewidth=1.2, zorder=3)
        ax.add_patch(ell)
        ax.text(ex, y, title, ha="center", va="center", fontsize=8.3, color=BLACK, zorder=4)
        ax_x, ax_y, _ = actors[actor_key]
        ax.plot([ax_x - 0.036, ex + ew / 2], [ax_y, y], color=BLACK, linewidth=1.0, zorder=2)

    fig.savefig(OUT_DIR / "gambar_3_use_case_sikomu.png", bbox_inches="tight", dpi=300, facecolor=WHITE)
    plt.close(fig)


def make_alur_random_forest():
    """Figure 4: Alur Model Random Forest (8 stages, 2 rows x 4 cols)."""
    fig, ax = _setup_canvas((11.4, 4.6), (0, 1), (0, 1))

    cols = [0.135, 0.378, 0.622, 0.865]
    rows = [0.73, 0.27]
    bw, bh = 0.185, 0.22

    titles_row1 = [
        "1. Ekstraksi Data\nMySQL",
        "2. Agregasi Data\nMingguan",
        "3. Rekayasa Fitur",
        "4. Pembagian Data\nBerbasis Waktu",
    ]
    titles_row2 = [
        "5. Pelatihan Model\nRandom Forest",
        "6. Evaluasi Model",
        "7. Peramalan Rekursif\n8 Minggu",
        "8. Penyimpanan Prediksi\n& Hitung Restok",
    ]

    for c, title in zip(cols, titles_row1):
        _draw_box(ax, c, rows[0], bw, bh, title, fontsize=9.0, pad=0.012, rounding=0.015)

    for c, title in zip(cols, titles_row2):
        _draw_box(ax, c, rows[1], bw, bh, title, fontsize=9.0, pad=0.012, rounding=0.015)

    pad_x = bw / 2 + 0.012
    pad_y = bh / 2 + 0.012

    # Row 1 arrows: 1 -> 2 -> 3 -> 4
    for i in range(3):
        _draw_arrow(ax, (cols[i] + pad_x, rows[0]), (cols[i + 1] - pad_x, rows[0]))

    # Orthogonal transition: 4 -> 5
    mid_y = (rows[0] + rows[1]) / 2
    _draw_stepped_arrow(
        ax,
        [
            (cols[3], rows[0] - pad_y),
            (cols[3], mid_y),
            (cols[0], mid_y),
            (cols[0], rows[1] + pad_y),
        ],
    )

    # Row 2 arrows: 5 -> 6 -> 7 -> 8
    for i in range(3):
        _draw_arrow(ax, (cols[i] + pad_x, rows[1]), (cols[i + 1] - pad_x, rows[1]))

    fig.savefig(OUT_DIR / "gambar_4_alur_random_forest.png", bbox_inches="tight", dpi=300, facecolor=WHITE)
    plt.close(fig)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    make_kerangka_penelitian()
    make_arsitektur_sistem()
    make_use_case_sikomu()
    make_alur_random_forest()
    print(f"Generated 4 pure B&W figures in {OUT_DIR}")


if __name__ == "__main__":
    main()
