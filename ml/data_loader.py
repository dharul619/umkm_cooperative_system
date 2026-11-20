"""Langkah 1: Ekstraksi dan agregasi data penjualan mingguan dari MySQL."""

from pathlib import Path
import os
import pandas as pd
import pymysql


def load_env(env_path: Path) -> None:
    """Muat variabel dari file .env jika belum ada di environment."""
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get_db_connection() -> pymysql.connections.Connection:
    """Buat koneksi ke database MySQL menggunakan konfigurasi .env."""
    root_dir = Path(__file__).resolve().parent.parent
    load_env(root_dir / ".env")

    return pymysql.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", 3306)),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "cooperative_system_db"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def fetch_products_and_sales(conn: pymysql.connections.Connection) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Ambil daftar produk aktif dan riwayat transaksi penjualan ritel."""
    products_sql = """
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            sc.category_id,
            p.unit,
            p.cost_price,
            p.selling_price,
            p.min_stock
        FROM products p
        LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
        WHERE p.is_active = 1
        ORDER BY p.id ASC
    """

    sales_sql = """
        SELECT
            sd.product_id,
            s.sale_date,
            sd.qty,
            sd.price
        FROM sales_details sd
        INNER JOIN sales s ON s.id = sd.sale_id
        INNER JOIN products p ON p.id = sd.product_id
        WHERE p.is_active = 1
        ORDER BY s.sale_date ASC
    """

    with conn.cursor() as cursor:
        cursor.execute(products_sql)
        products_df = pd.DataFrame(cursor.fetchall())

        cursor.execute(sales_sql)
        sales_df = pd.DataFrame(cursor.fetchall())

    return products_df, sales_df


def build_weekly_dataset(products_df: pd.DataFrame, sales_df: pd.DataFrame) -> pd.DataFrame:
    """
    Ubah transaksi harian menjadi tabel mingguan (Senin-Minggu) per produk.
    Minggu tanpa penjualan diisi 0 agar deret waktu setiap produk utuh.
    """
    if products_df.empty or sales_df.empty:
        return pd.DataFrame()

    df = sales_df.copy()
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    # Kelompokkan setiap tanggal ke hari Senin di minggu tersebut
    df["week_start"] = (df["sale_date"] - pd.to_timedelta(df["sale_date"].dt.weekday, unit="D")).dt.date

    weekly_agg = (
        df.groupby(["product_id", "week_start"], as_index=False)
        .agg(qty=("qty", "sum"), avg_price=("price", "mean"))
    )

    min_week = weekly_agg["week_start"].min()
    max_week = weekly_agg["week_start"].max()
    all_weeks = pd.date_range(start=min_week, end=max_week, freq="W-MON").date

    # Grid penuh: setiap produk memiliki semua minggu dari awal hingga akhir
    full_grid = pd.MultiIndex.from_product(
        [products_df["product_id"].tolist(), list(all_weeks)],
        names=["product_id", "week_start"],
    ).to_frame(index=False)

    weekly_df = full_grid.merge(weekly_agg, on=["product_id", "week_start"], how="left")
    weekly_df["qty"] = weekly_df["qty"].fillna(0).astype(int)

    # Gabungkan atribut produk dan isi harga yang kosong dengan harga jual produk
    weekly_df = weekly_df.merge(
        products_df[["product_id", "product_name", "category_id", "selling_price"]],
        on="product_id",
        how="left",
    )
    weekly_df["price"] = (
        weekly_df.groupby("product_id")["avg_price"]
        .transform(lambda s: s.ffill().bfill())
        .fillna(weekly_df["selling_price"])
        .astype(float)
    )
    weekly_df = weekly_df.drop(columns=["avg_price", "selling_price"])
    weekly_df = weekly_df.sort_values(["product_id", "week_start"]).reset_index(drop=True)
    return weekly_df


def load_weekly_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Fungsi utama untuk mengambil produk aktif dan dataset mingguan dari DB."""
    conn = get_db_connection()
    try:
        products_df, sales_df = fetch_products_and_sales(conn)
    finally:
        conn.close()

    weekly_df = build_weekly_dataset(products_df, sales_df)
    return products_df, weekly_df


if __name__ == "__main__":
    products, weekly = load_weekly_data()
    print(f"Produk aktif   : {len(products)}")
    print(f"Rentang minggu : {weekly['week_start'].min()} s/d {weekly['week_start'].max()} ({weekly['week_start'].nunique()} minggu)")
    print(f"Total baris    : {len(weekly)} ({len(products)} produk x {weekly['week_start'].nunique()} minggu)")
    print("\nContoh 6 minggu terakhir untuk Produk #1:")
    sample = weekly[weekly["product_id"] == products.iloc[0]["product_id"]].tail(6)
    print(sample[["product_id", "product_name", "week_start", "qty", "price"]].to_string(index=False))
