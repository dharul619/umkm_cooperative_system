from datetime import date, timedelta
import pandas as pd

from data_loader import load_weekly_data

# Daftar fitur (X) dan target (y) yang akan dipakai konsisten saat training & prediksi

FEATURE_COLUMNS = [
    "product_id",
    "category_id",
    "price",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_4",
    "rolling_mean_4",
    "rolling_mean_8",
    "month",
    "week_of_month",
    "is_payday_week",
    "is_ramadan",
    "is_lebaran",
]

TARGET_COLUMN = "qty"

ISLAMIC_EVENTS = {
   2022: (date(2022, 4, 3), date(2022, 5, 2)),
    2023: (date(2023, 3, 23), date(2023, 4, 22)),
    2024: (date(2024, 3, 12), date(2024, 4, 10)),
    2025: (date(2025, 3, 1), date(2025, 3, 31)),
    2026: (date(2026, 2, 18), date(2026, 3, 20)),
    2027: (date(2027, 2, 8), date(2027, 3, 9)),
}

def _week_overlaps_range(week_start: date, range_start: date, range_end: date) -> bool: 
    """Cek apakah rentang 1 minggu (senin-Minggu) bersinggungan dengan rentang tanggal tertentu."""
    week_end = week_start + timedelta(days=6)
    return week_start <= range_end and week_end >= range_start

def _check_payday_week(week_start: date)-> int:
    """Bernilai 1 jika dalam mminggun tersebut terdapat tanggal gajiak (tgl 25 - 31 atau 1-5)"""
    for offset in range(7):
        day = (week_start + timedelta(days=offset)).day
        if day >= 25 or day <= 5:
            return 1
    return 0

def _check_ramadan_lebaran(week_start: date) -> tuple[int, int]:
    """Kembalikan penanda (is_ramadhan, is_lebaran) untuk minggu tertentu."""
    is_ramadan = 0
    is_lebaran = 0

    for ramadan_start, eid_date in ISLAMIC_EVENTS.values():
        if _week_overlaps_range(week_start, ramadan_start, eid_date - timedelta(days=1)):
            is_ramadan = 1

        if _week_overlaps_range(week_start, eid_date - timedelta(days=7), eid_date + timedelta(days=7)):
            is_lebaran = 1

    return is_ramadan, is_lebaran

def create_features(weekly_df: pd.DataFrame, drop_na: bool = True) -> pd.DataFrame:
    if weekly_df.empty:
        return weekly_df.copy()

    df = weekly_df.copy()
    df["week_start_date"] = pd.to_datetime(df["week_start"]).dt.date
    df = df.sort_values(["product_id", "week_start_date"]).reset_index(drop=True)

    #1. Fitur Lag (penjualan 1-14 minggu lalu per produk)
    grouped_qty = df.groupby("product_id")["qty"]
    for lag in range(1,5):
        df[f"lag_{lag}"] = grouped_qty.shift(lag)

    #2. Fitur Rolling Mean (rata - rata bergerak 4 & 8 minggu)
    #Wajib .shift(1) sebelum . rolling() agar qty minggu berjalan tidak bocor ke fitur
    df["rolling_mean_4"] = grouped_qty.transform(
        lambda s: s.shift(1).rolling(window=4, min_periods=1).mean()
    )

    df["rolling_mean_8"] = grouped_qty.transform(
        lambda s: s.shift(1).rolling(window=8, min_periods=1).mean()
    )

    #3. Fitur Kalender & efek gajian
    week_dt = pd.to_datetime(df["week_start_date"])
    df["month"] = week_dt.dt.month
    df["week_of_month"] = ((week_dt.dt.day - 1)// 7) + 1
    df["is_payday_week"] = df["week_start_date"].apply(_check_payday_week)

    #4. Fitur Penanda Ramadan & lebaran
    event_flags = df["week_start_date"].apply(_check_ramadan_lebaran)
    df["is_ramadan"] = [flag[0] for flag in event_flags]
    df["is_lebaran"] = [flag[1] for flag in event_flags]

    #5. Rapikan tipe data atribut produk
    df["category_id"] = df["category_id"].fillna(0).astype(int)
    df["price"] = df["price"].astype(float)

    # Hapus baris awal yang belum memiliki riwayat lag lengkap

    if drop_na:
        df = df.dropna(subset=["lag_1", "lag_2", "lag_3", "lag_4"]).reset_index(drop=True)

    return df

if __name__ == "__main__":
    _, weekly = load_weekly_data()
    feature_df = create_features(weekly)

    print(f"Total baris siap latih  : {len(feature_df)}")
    print(f"Jumlah fitur (X)        : {len(FEATURE_COLUMNS)}")
    print("\nContoh 5 baris fitur untuk Produk #1: ")
    first_product = feature_df["product_id"].iloc[0]
    sample = feature_df[feature_df["product_id"] == first_product].tail(5)
    cols_to_show = ["week_start", "qty", "lag_1", "lag_2", "rolling_mean_4", "is_payday_week", "is_ramadan", "is_lebaran"]
    print(sample[cols_to_show].to_string(index=False))



