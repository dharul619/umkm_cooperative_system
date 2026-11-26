"""Bangun ulang data produk mie, pola transaksi realistis koperasi karyawan, SQL dump, dan sinkronisasi MySQL."""

from datetime import date, datetime, time, timedelta
from pathlib import Path
import re
import numpy as np

from data_loader import get_db_connection
from features import _check_payday_week, _check_ramadan_lebaran


ROOT_DIR = Path(__file__).resolve().parent.parent
SQL_PATH = ROOT_DIR / "assets" / "cooperative_system_db.sql"

START_WEEK = date(2024, 7, 1)
NUM_WEEKS = 114
OPERATOR_IDS = [17, 20]
DAY_WEIGHTS = np.array([0.16, 0.16, 0.16, 0.16, 0.16, 0.13, 0.07], dtype=float)
BATCH_SIZE = 700
NOISE_STD = 0.122

REMOVED_CATEGORY_IDS = {3}
REMOVED_SUBCATEGORY_IDS = {14}
REMOVED_BRAND_IDS = {20}
REMOVED_PRODUCT_IDS = {43}

DRINK_SUBCATS = {1, 2, 3, 4, 5, 6, 15}
FOOD_SUBCATS = {7, 8, 9, 10, 11, 16, 17}

NEW_BRANDS = [
    (37, "Indomie"),
    (38, "Pop Mie"),
    (39, "Mie Sedaap"),
]

NEW_SUBCATEGORIES = [
    (17, 2, "Mie Instan", "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
]

NEW_PRODUCTS = [
    (64, "Indomie Goreng Spesial 85g", 17, "8998866200011", "bungkus", 37, 2600, 3500, 40, 1, "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
    (65, "Indomie Soto Mie 70g", 17, "8998866200028", "bungkus", 37, 2500, 3500, 36, 1, "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
    (66, "Indomie Ayam Bawang 69g", 17, "8998866200035", "bungkus", 37, 2500, 3500, 36, 1, "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
    (67, "Pop Mie Ayam 75g", 17, "8998866200042", "cup", 38, 4200, 5500, 30, 1, "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
    (68, "Pop Mie Baso 75g", 17, "8998866200059", "cup", 38, 4200, 5500, 30, 1, "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
    (69, "Mie Sedaap Goreng 90g", 17, "8998866200066", "bungkus", 39, 2500, 3500, 36, 1, "2026-11-18 16:36:15", "2026-11-18 16:36:15"),
]

# Permintaan dasar mingguan produk mie yang populer di koperasi karyawan
NOODLE_BASE_WEEKLY = {
    64: 25.0,
    65: 21.0,
    66: 20.0,
    67: 22.0,
    68: 19.0,
    69: 18.5,
}

# Permintaan dasar mingguan deterministik untuk 46 produk aktif
BASE_WEEKLY_DEMAND = {
    1: 26.0, 2: 24.01, 3: 17.78, 4: 23.37, 5: 16.6, 6: 11.73,
    7: 9.9, 8: 10.31, 9: 10.61, 10: 13.83, 11: 10.01, 12: 11.83,
    13: 13.96, 14: 8.14, 15: 11.4, 16: 9.94, 17: 15.68, 18: 8.65,
    19: 20.42, 20: 8.44, 44: 8.57, 45: 13.85, 46: 9.96, 47: 9.5,
    48: 10.49, 49: 9.58, 50: 9.76, 51: 13.47, 52: 9.16, 53: 8.72,
    54: 10.12, 55: 8.91, 56: 9.71, 57: 9.79, 58: 8.42, 59: 12.9,
    60: 8.57, 61: 10.19, 62: 9.49, 63: 8.0, 64: 25.0, 65: 21.0,
    66: 20.0, 67: 22.0, 68: 19.0, 69: 18.5,
}


def _sql_val(val) -> str:
    if val is None:
        return "NULL"
    if isinstance(val, int):
        return str(val)
    escaped = str(val).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


def _format_insert_statements(table_name: str, columns: list[str], rows: list[tuple]) -> str:
    cols_sql = ", ".join(f"`{c}`" for c in columns)
    header = f"INSERT INTO `{table_name}` ({cols_sql}) VALUES"
    chunks = []
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start : start + BATCH_SIZE]
        lines = [f"({', '.join(_sql_val(v) for v in row)})" for row in batch]
        chunks.append(f"{header}\n" + ",\n".join(lines) + ";")
    return "\n\n".join(chunks)


def _extract_insert_block(sql_text: str, table_name: str) -> str:
    """Ambil seluruh teks blok Dumping data untuk sebuah tabel."""
    pattern = re.compile(
        rf"-- Dumping data untuk tabel `{re.escape(table_name)}`\s*--\s*(.*?)(?=-- -+\s*--\s*-- Struktur dari tabel|-- -+\s*--\s*-- Indexes for dumped tables)",
        re.DOTALL,
    )
    match = pattern.search(sql_text)
    if not match:
        raise ValueError(f"Blok Dumping data untuk tabel `{table_name}` tidak ditemukan.")
    return match.group(1)


def _replace_table_dump_block(sql_text: str, table_name: str, new_inserts: str, next_auto_inc: int) -> str:
    pattern = re.compile(
        rf"(-- Dumping data untuk tabel `{re.escape(table_name)}`\s*--\s*\n\n).*?(\n\n-- --------------------------------------------------------)",
        re.DOTALL,
    )
    match = pattern.search(sql_text)
    if not match:
        raise ValueError(f"Tidak bisa mengganti blok data untuk tabel `{table_name}`.")
    updated = sql_text[: match.start()] + match.group(1) + new_inserts + match.group(2) + sql_text[match.end() :]

    ai_pattern = re.compile(
        rf"(-- AUTO_INCREMENT untuk tabel `{re.escape(table_name)}`\s*--\s*\nALTER TABLE `{re.escape(table_name)}`\s*\n\s*MODIFY `id` int\(11\) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=)\d+(;)"
    )
    updated, count = ai_pattern.subn(rf"\g<1>{next_auto_inc}\g<2>", updated, count=1)
    if count != 1:
        raise ValueError(f"Gagal memperbarui AUTO_INCREMENT untuk tabel `{table_name}`.")
    return updated


def ensure_noodle_catalog_in_sql(sql_text: str) -> str:
    """Pastikan katalog mie ada dan entri kosmetik dihapus dari file SQL."""
    updated = sql_text

    # 0. Categories (hapus kategori Cosmetic)
    cat_block = _extract_insert_block(updated, "categories")
    cat_map: dict[int, tuple] = {}
    for m in re.finditer(r"\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*'([^']*)',\s*'([^']*)'\)", cat_block):
        cid = int(m.group(1))
        if cid in REMOVED_CATEGORY_IDS:
            continue
        cat_map[cid] = (cid, m.group(2).replace("\\'", "'"), m.group(3), m.group(4))
    cat_rows = [cat_map[k] for k in sorted(cat_map)]
    cat_sql = _format_insert_statements(
        "categories",
        ["id", "name", "created_at", "updated_at"],
        cat_rows,
    )
    updated = _replace_table_dump_block(updated, "categories", cat_sql, max(cat_map) + 1)

    # 1. Brands
    brands_block = _extract_insert_block(updated, "brands")
    existing_brands = [
        (int(m.group(1)), m.group(2).replace("\\'", "'"))
        for m in re.finditer(r"\((\d+),\s*'((?:[^'\\]|\\.)*)'\)", brands_block)
    ]
    brand_map = {bid: name for bid, name in existing_brands if bid not in REMOVED_BRAND_IDS}
    for bid, name in NEW_BRANDS:
        brand_map[bid] = name
    brands_rows = sorted(brand_map.items(), key=lambda x: x[0])
    brands_sql = _format_insert_statements("brands", ["id", "name"], brands_rows)
    updated = _replace_table_dump_block(updated, "brands", brands_sql, max(b[0] for b in brands_rows) + 1)

    # 2. Subcategories
    subcat_block = _extract_insert_block(updated, "subcategories")
    subcat_map: dict[int, tuple] = {}
    for m in re.finditer(r"\((\d+),\s*(\d+),\s*'((?:[^'\\]|\\.)*)',\s*'([^']*)',\s*'([^']*)'\)", subcat_block):
        sid = int(m.group(1))
        if sid in REMOVED_SUBCATEGORY_IDS:
            continue
        subcat_map[sid] = (sid, int(m.group(2)), m.group(3).replace("\\'", "'"), m.group(4), m.group(5))
    for row in NEW_SUBCATEGORIES:
        subcat_map[row[0]] = row
    subcat_rows = [subcat_map[k] for k in sorted(subcat_map)]
    subcat_sql = _format_insert_statements(
        "subcategories",
        ["id", "category_id", "name", "created_at", "updated_at"],
        subcat_rows,
    )
    updated = _replace_table_dump_block(updated, "subcategories", subcat_sql, max(subcat_map) + 1)

    # 3. Products
    prod_block = _extract_insert_block(updated, "products")
    prod_map: dict[int, tuple] = {}
    prod_pat = re.compile(
        r"\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)"
    )
    for m in prod_pat.finditer(prod_block):
        pid = int(m.group(1))
        if pid in REMOVED_PRODUCT_IDS:
            continue
        prod_map[pid] = (
            pid,
            m.group(2).replace("\\'", "'"),
            int(m.group(3)),
            m.group(4),
            m.group(5),
            int(m.group(6)),
            int(m.group(7)),
            int(m.group(8)),
            int(m.group(9)),
            int(m.group(10)),
            m.group(11),
            m.group(12),
        )
    for row in NEW_PRODUCTS:
        prod_map[row[0]] = row
    prod_rows = [prod_map[k] for k in sorted(prod_map)]
    prod_sql = _format_insert_statements(
        "products",
        [
            "id",
            "name",
            "subcategory_id",
            "barcode",
            "unit",
            "brand_id",
            "cost_price",
            "selling_price",
            "min_stock",
            "is_active",
            "created_at",
            "updated_at",
        ],
        prod_rows,
    )
    updated = _replace_table_dump_block(updated, "products", prod_sql, max(prod_map) + 1)
    return updated


def parse_products_from_sql(sql_text: str) -> list[dict]:
    """Parse seluruh produk aktif dari INSERT INTO `products`."""
    block = _extract_insert_block(sql_text, "products")
    row_pattern = re.compile(
        r"\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*'[^']*',\s*'[^']*'\)"
    )
    products = []
    for m in row_pattern.finditer(block):
        if int(m.group(10)) != 1:
            continue
        products.append({
            "id": int(m.group(1)),
            "name": m.group(2).replace("\\'", "'"),
            "subcategory_id": int(m.group(3)),
            "unit": m.group(5),
            "cost_price": int(m.group(7)),
            "selling_price": int(m.group(8)),
            "min_stock": int(m.group(9)),
        })
    if not products:
        raise ValueError("Tidak ada produk aktif yang berhasil diparse dari SQL.")
    return sorted(products, key=lambda p: p["id"])


def parse_original_sales_totals(sql_text: str) -> dict[int, int]:
    """Hitung total qty penjualan awal tiap produk dari INSERT INTO `sales_details`."""
    block = _extract_insert_block(sql_text, "sales_details")
    row_pattern = re.compile(r"\(\d+,\s*\d+,\s*(\d+),\s*(\d+),\s*\d+,\s*\d+,\s*\d+\)")
    totals: dict[int, int] = {}
    for m in row_pattern.finditer(block):
        pid = int(m.group(1))
        qty = int(m.group(2))
        totals[pid] = totals.get(pid, 0) + qty
    return totals


def _distribute_weekly_qty(weekly_qty: int, weights: np.ndarray, rng: np.random.Generator) -> list[int]:
    """Sebar total qty mingguan ke 7 hari (Senin-Minggu) sehingga jumlahnya persis sama."""
    noisy_w = weights * rng.uniform(0.90, 1.10, size=7)
    probs = noisy_w / noisy_w.sum()
    daily = rng.multinomial(weekly_qty, probs)
    return [int(x) for x in daily]


def _chunk_daily_qty(qty: int, rng: np.random.Generator) -> list[int]:
    """Pecah qty harian produk menjadi item keranjang kecil (1 atau maksimal 2 pcs)."""
    chunks = []
    rem = qty
    while rem > 0:
        c = 2 if (rem >= 2 and rng.random() < 0.25) else 1
        chunks.append(c)
        rem -= c
    return chunks


def _supplier_for_subcategory(subcat_id: int) -> int:
    """Petakan subkategori ke supplier (1=Minuman, 2=Snack/Mie, 3=Non-Pangan)."""
    if subcat_id in DRINK_SUBCATS:
        return 1
    if subcat_id in FOOD_SUBCATS:
        return 2
    return 3


def _build_realistic_day_baskets(
    daily_items: list[tuple[int, int]],
    prod_by_id: dict[int, dict],
    rng: np.random.Generator,
) -> list[list[tuple[int, int]]]:
    """
    Susun keranjang belanja karyawan yang realistis untuk 1 hari:
    - Maksimal 1 minuman per transaksi (tidak pernah campur merek minuman berbeda)
    - Tidak ada 2 produk dari subkategori yang sama dalam 1 struk
    - Total qty per transaksi antara 1 s/d 5 pcs
    - Mayoritas mengombinasikan 1 minuman + 1-2 makanan/mie
    """
    drink_chunks: list[tuple[int, int]] = []
    food_chunks: list[tuple[int, int]] = []

    for pid, qty in daily_items:
        subcat = prod_by_id[pid]["subcategory_id"]
        target_list = drink_chunks if subcat in DRINK_SUBCATS else food_chunks
        for c_qty in _chunk_daily_qty(qty, rng):
            target_list.append((pid, c_qty))

    rng.shuffle(drink_chunks)
    rng.shuffle(food_chunks)

    baskets: list[dict] = []
    for pid, c_qty in drink_chunks:
        subcat = prod_by_id[pid]["subcategory_id"]
        baskets.append({
            "items": [(pid, c_qty)],
            "subcats": {subcat},
            "pids": {pid},
            "has_drink": True,
            "total_qty": c_qty,
        })

    for pid, c_qty in food_chunks:
        subcat = prod_by_id[pid]["subcategory_id"]

        # Kumpulan kandidat keranjang yang memenuhi syarat ketat
        compatible_drink_solo = [
            b for b in baskets
            if b["has_drink"]
            and len(b["items"]) == 1
            and b["total_qty"] + c_qty <= 5
            and subcat not in b["subcats"]
            and pid not in b["pids"]
        ]
        compatible_pair = [
            b for b in baskets
            if len(b["items"]) < 3
            and b["total_qty"] + c_qty <= 5
            and subcat not in b["subcats"]
            and pid not in b["pids"]
        ]

        chosen = None
        if compatible_drink_solo and rng.random() < 0.80:
            chosen = compatible_drink_solo[int(rng.integers(0, len(compatible_drink_solo)))]
        elif compatible_pair and rng.random() < 0.72:
            chosen = compatible_pair[int(rng.integers(0, len(compatible_pair)))]

        if chosen is not None:
            chosen["items"].append((pid, c_qty))
            chosen["subcats"].add(subcat)
            chosen["pids"].add(pid)
            chosen["total_qty"] += c_qty
        else:
            baskets.append({
                "items": [(pid, c_qty)],
                "subcats": {subcat},
                "pids": {pid},
                "has_drink": False,
                "total_qty": c_qty,
            })

    # Acak urutan transaksi sebelum diberi jam, lalu validasi aturan keranjang
    rng.shuffle(baskets)
    result: list[list[tuple[int, int]]] = []
    for b in baskets:
        assert 1 <= b["total_qty"] <= 5, f"Qty transaksi melanggar batas: {b['total_qty']}"
        result.append(b["items"])
    return result


def generate_dataset(products: list[dict], orig_totals: dict[int, int]) -> dict[str, list[tuple]]:
    """Bangkitkan data mingguan terpola, lalu turunkan ke sales, purchases, dan inventory."""
    rng = np.random.default_rng(42)
    prod_by_id = {p["id"]: p for p in products}

    # Normalisasi base_weekly produk lama ke rentang [8.0, 26.0] agar aman jika skrip dijalankan ulang
    existing_means = {
        p["id"]: orig_totals[p["id"]] / float(NUM_WEEKS)
        for p in products
        if p["id"] not in NOODLE_BASE_WEEKLY and orig_totals.get(p["id"], 0) > 0
    }
    min_m = min(existing_means.values()) if existing_means else 4.0
    max_m = max(existing_means.values()) if existing_means else 12.0
    span_m = max(1e-6, max_m - min_m)

    base_weekly_map: dict[int, float] = {}
    for p in products:
        pid = p["id"]
        if pid in BASE_WEEKLY_DEMAND:
            base_weekly_map[pid] = BASE_WEEKLY_DEMAND[pid]
        elif pid in NOODLE_BASE_WEEKLY:
            base_weekly_map[pid] = NOODLE_BASE_WEEKLY[pid]
        elif pid in existing_means:
            norm = (existing_means[pid] - min_m) / span_m
            base_weekly_map[pid] = round(8.0 + norm * 18.0, 2)
        else:
            base_weekly_map[pid] = 10.0

    # 1. Bangkitkan target qty mingguan dan distribusikan ke harian
    weekly_product_qty: dict[tuple[int, int], int] = {}
    daily_product_qty: dict[tuple[date, int], int] = {}

    for w_idx in range(NUM_WEEKS):
        week_start = START_WEEK + timedelta(days=7 * w_idx)
        is_payday = _check_payday_week(week_start)
        is_ramadan, is_lebaran = _check_ramadan_lebaran(week_start)

        payday_mult = 1.32 if is_payday else 0.90
        event_mult = 1.45 if is_lebaran else (1.28 if is_ramadan else 1.00)

        for p in products:
            pid = p["id"]
            wave_mult = 1.0 + 0.12 * float(np.sin(2 * np.pi * w_idx / 8.0 + (pid % 4) * 0.4))
            noise = float(np.clip(rng.normal(1.0, NOISE_STD), 0.65, 1.38))
            w_qty = max(1, int(round(base_weekly_map[pid] * payday_mult * event_mult * wave_mult * noise)))

            weekly_product_qty[(w_idx, pid)] = w_qty
            daily_splits = _distribute_weekly_qty(w_qty, DAY_WEIGHTS, rng)
            for d_off, d_qty in enumerate(daily_splits):
                daily_product_qty[(week_start + timedelta(days=d_off), pid)] = d_qty

    # 2. Bangkitkan purchases & purchase_details sinkron sebelum penjualan tiap minggu
    purchases_rows: list[tuple] = []
    purchase_details_rows: list[tuple] = []
    inventory_events: list[tuple] = []

    stock_map: dict[int, int] = {p["id"]: 0 for p in products}
    purchase_id_seq = 1
    pd_id_seq = 1

    # Stok awal pada 2025-06-30 per supplier (1, 2, 3)
    init_groups: dict[int, list[tuple[int, int, int]]] = {1: [], 2: [], 3: []}
    for p in products:
        pid = p["id"]
        week0_need = weekly_product_qty[(0, pid)]
        init_qty = max(p["min_stock"] * 2, week0_need + 24, 48)
        stock_map[pid] += init_qty
        sup_id = _supplier_for_subcategory(p["subcategory_id"])
        init_groups[sup_id].append((pid, init_qty, p["cost_price"]))

    init_notes = {1: "Stok awal minuman", 2: "Stok awal makanan & mie", 3: "Stok awal produk non-pangan"}
    for sup_id in (1, 2, 3):
        items = init_groups[sup_id]
        if not items:
            continue
        pur_total = sum(qty * cost for _, qty, cost in items)
        ts_str = f"{START_WEEK.isoformat()} 01:30:00"
        purchases_rows.append((purchase_id_seq, sup_id, START_WEEK.isoformat(), pur_total, ts_str))
        for pid, qty, cost in items:
            purchase_details_rows.append((pd_id_seq, purchase_id_seq, pid, qty, cost, qty * cost))
            inventory_events.append((ts_str, 0, pid, "IN", qty, purchase_id_seq, "PURCHASE", init_notes[sup_id]))
            pd_id_seq += 1
        purchase_id_seq += 1

    # Restok mingguan setiap hari Senin (mulai minggu ke-1)
    for w_idx in range(1, NUM_WEEKS):
        for p in products:
            stock_map[p["id"]] -= weekly_product_qty[(w_idx - 1, p["id"])]

        week_start = START_WEEK + timedelta(days=7 * w_idx)
        restock_groups: dict[int, list[tuple[int, int, int]]] = {1: [], 2: [], 3: []}

        for p in products:
            pid = p["id"]
            w_qty = weekly_product_qty[(w_idx, pid)]
            projected_after = stock_map[pid] - w_qty
            threshold = p["min_stock"] + 12
            if projected_after < threshold:
                needed = (threshold + w_qty + 12) - stock_map[pid]
                batch_unit = 12 if p["unit"] in {"botol", "kotak", "kaleng", "pcs", "cup"} else 10
                restock_qty = max(batch_unit, int(np.ceil(needed / batch_unit) * batch_unit))
                stock_map[pid] += restock_qty
                sup_id = _supplier_for_subcategory(p["subcategory_id"])
                restock_groups[sup_id].append((pid, restock_qty, p["cost_price"]))

        note = "Kulakan awal bulan" if week_start.day <= 7 else "Kulakan mingguan rutin"
        for sup_id in (1, 2, 3):
            items = restock_groups[sup_id]
            if not items:
                continue
            pur_total = sum(qty * cost for _, qty, cost in items)
            ts_str = f"{week_start.isoformat()} 01:30:00"
            purchases_rows.append((purchase_id_seq, sup_id, week_start.isoformat(), pur_total, ts_str))
            for pid, qty, cost in items:
                purchase_details_rows.append((pd_id_seq, purchase_id_seq, pid, qty, cost, qty * cost))
                inventory_events.append((ts_str, 0, pid, "IN", qty, purchase_id_seq, "PURCHASE", note))
                pd_id_seq += 1
            purchase_id_seq += 1

    # 3. Bangkitkan transaksi sales & sales_details harian dengan pola keranjang realistis
    sales_rows: list[tuple] = []
    sales_details_rows: list[tuple] = []
    sale_id_seq = 1
    sd_id_seq = 1

    total_days = NUM_WEEKS * 7
    for day_off in range(total_days):
        cur_date = START_WEEK + timedelta(days=day_off)
        daily_items = [
            (p["id"], daily_product_qty[(cur_date, p["id"])])
            for p in products
            if daily_product_qty[(cur_date, p["id"])] > 0
        ]
        if not daily_items:
            continue

        baskets = _build_realistic_day_baskets(daily_items, prod_by_id, rng)
        seconds_offsets = sorted(int(x) for x in rng.integers(3600, 49500, size=len(baskets)))

        for idx_b, items in enumerate(baskets):
            dt_obj = datetime.combine(cur_date, time(0, 0, 0)) + timedelta(seconds=seconds_offsets[idx_b])
            ts_str = dt_obj.strftime("%Y-%m-%d %H:%M:%S")
            operator_id = OPERATOR_IDS[(sale_id_seq + idx_b) % len(OPERATOR_IDS)]

            total_amount = 0
            total_profit = 0
            for pid, qty in items:
                p = prod_by_id[pid]
                price = p["selling_price"]
                cost = p["cost_price"]
                subtotal = qty * price
                total_amount += subtotal
                total_profit += (price - cost) * qty

                sales_details_rows.append((sd_id_seq, sale_id_seq, pid, qty, price, cost, subtotal))
                inventory_events.append((ts_str, 1, pid, "OUT", qty, sale_id_seq, "SALE", None))
                sd_id_seq += 1

            coord_share = int(round(total_profit * 0.20))
            kop_share = total_profit - coord_share
            sales_rows.append((
                sale_id_seq,
                cur_date.isoformat(),
                operator_id,
                total_amount,
                total_profit,
                coord_share,
                kop_share,
                ts_str,
            ))
            sale_id_seq += 1

    inventory_events.sort(key=lambda ev: (ev[0], ev[1], ev[5], ev[2]))
    inventory_rows = [
        (idx + 1, ev[2], ev[3], ev[4], ev[5], ev[6], ev[7], ev[0])
        for idx, ev in enumerate(inventory_events)
    ]

    return {
        "inventory_transactions": inventory_rows,
        "purchases": purchases_rows,
        "purchase_details": purchase_details_rows,
        "sales": sales_rows,
        "sales_details": sales_details_rows,
    }


def update_sql_file(sql_text: str, data: dict[str, list[tuple]]) -> str:
    """Ganti blok INSERT dan AUTO_INCREMENT untuk 5 tabel transaksi/inventori di file SQL."""
    table_cols = {
        "inventory_transactions": ["id", "product_id", "type", "qty", "reference_id", "reference_type", "note", "created_at"],
        "purchases": ["id", "supplier_id", "purchase_date", "total_amount", "created_at"],
        "purchase_details": ["id", "purchase_id", "product_id", "qty", "price", "subtotal"],
        "sales": ["id", "sale_date", "operator_id", "total_amount", "total_profit", "coordinator_share", "koperasi_share", "created_at"],
        "sales_details": ["id", "sale_id", "product_id", "qty", "price", "cost_price", "subtotal"],
    }

    updated = sql_text
    for tbl, cols in table_cols.items():
        rows = data[tbl]
        new_inserts = _format_insert_statements(tbl, cols, rows)
        updated = _replace_table_dump_block(updated, tbl, new_inserts, len(rows) + 1)
    return updated


def sync_to_mysql(data: dict[str, list[tuple]]) -> None:
    """Sinkronkan penghapusan kosmetik, katalog mie, dan data transaksi baru ke MySQL lokal."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Kosongkan transaksi & prediksi terlebih dahulu agar FK penghapusan kosmetik aman
            for tbl in ("sales_predictions", "inventory_transactions", "purchase_details", "purchases", "sales_details", "sales"):
                cursor.execute(f"DELETE FROM `{tbl}`")
                cursor.execute(f"ALTER TABLE `{tbl}` AUTO_INCREMENT = 1")

            # Hapus produk kosmetik, subkategori, kategori, dan brand terkait dari MySQL
            for pid in sorted(REMOVED_PRODUCT_IDS):
                cursor.execute("DELETE FROM `products` WHERE `id` = %s", (pid,))
            for sid in sorted(REMOVED_SUBCATEGORY_IDS):
                cursor.execute("DELETE FROM `subcategories` WHERE `id` = %s", (sid,))
            for cid in sorted(REMOVED_CATEGORY_IDS):
                cursor.execute("DELETE FROM `categories` WHERE `id` = %s", (cid,))
            for bid in sorted(REMOVED_BRAND_IDS):
                cursor.execute("DELETE FROM `brands` WHERE `id` = %s", (bid,))

            # Pastikan master data mie tersedia di MySQL sebelum transaksi masuk
            cursor.executemany(
                "INSERT INTO `brands` (`id`, `name`) VALUES (%s, %s) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`)",
                NEW_BRANDS,
            )
            cursor.executemany(
                "INSERT INTO `subcategories` (`id`, `category_id`, `name`, `created_at`, `updated_at`) VALUES (%s, %s, %s, %s, %s) "
                "ON DUPLICATE KEY UPDATE `category_id` = VALUES(`category_id`), `name` = VALUES(`name`)",
                NEW_SUBCATEGORIES,
            )
            cursor.executemany(
                "INSERT INTO `products` (`id`, `name`, `subcategory_id`, `barcode`, `unit`, `brand_id`, `cost_price`, `selling_price`, `min_stock`, `is_active`, `created_at`, `updated_at`) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
                "ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `subcategory_id` = VALUES(`subcategory_id`), `unit` = VALUES(`unit`), "
                "`brand_id` = VALUES(`brand_id`), `cost_price` = VALUES(`cost_price`), `selling_price` = VALUES(`selling_price`), `min_stock` = VALUES(`min_stock`), `is_active` = VALUES(`is_active`)",
                NEW_PRODUCTS,
            )

            insert_specs = [
                (
                    "purchases",
                    "INSERT INTO `purchases` (`id`, `supplier_id`, `purchase_date`, `total_amount`, `created_at`) VALUES (%s, %s, %s, %s, %s)",
                ),
                (
                    "purchase_details",
                    "INSERT INTO `purchase_details` (`id`, `purchase_id`, `product_id`, `qty`, `price`, `subtotal`) VALUES (%s, %s, %s, %s, %s, %s)",
                ),
                (
                    "sales",
                    "INSERT INTO `sales` (`id`, `sale_date`, `operator_id`, `total_amount`, `total_profit`, `coordinator_share`, `koperasi_share`, `created_at`) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                ),
                (
                    "sales_details",
                    "INSERT INTO `sales_details` (`id`, `sale_id`, `product_id`, `qty`, `price`, `cost_price`, `subtotal`) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                ),
                (
                    "inventory_transactions",
                    "INSERT INTO `inventory_transactions` (`id`, `product_id`, `type`, `qty`, `reference_id`, `reference_type`, `note`, `created_at`) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                ),
            ]
            for tbl, sql in insert_specs:
                rows = data[tbl]
                for start in range(0, len(rows), 1000):
                    cursor.executemany(sql, rows[start : start + 1000])

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    raw_sql = SQL_PATH.read_text(encoding="utf-8")
    sql_with_noodles = ensure_noodle_catalog_in_sql(raw_sql)
    products = parse_products_from_sql(sql_with_noodles)
    orig_totals = parse_original_sales_totals(sql_with_noodles)

    print(f"Produk aktif ditemukan : {len(products)}")
    data = generate_dataset(products, orig_totals)

    for k, v in data.items():
        print(f"  {k:22s}: {len(v)} baris")

    updated_sql = update_sql_file(sql_with_noodles, data)
    SQL_PATH.write_text(updated_sql, encoding="utf-8")
    print(f"File SQL diperbarui    : {SQL_PATH}")

    sync_to_mysql(data)
    print("Sinkronisasi ke MySQL  : BERHASIL")
