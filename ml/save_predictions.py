import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import KFold

from data_loader import get_db_connection, load_weekly_data
from features import FEATURE_COLUMNS, TARGET_COLUMN, create_features
from train_and_predict import evaluate_time_split, recursive_forecast, train_full_model

MODEL_VERSION = "rf_v1"

def fetch_curent_stock()-> pd.DataFrame:
    """Ambil saldi stok saat ini per produk dari tabel inventory_transactions."""
    sql = """
        SELECT
            p.id AS product_id,
            COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.qty ELSE -it.qty END), 0) AS current_stock
        FROM products p
        LEFT JOIN inventory_transactions it ON it.product_id = p.id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.id ASC
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            stock_df = pd.DataFrame(cursor.fetchall())
    finally:
        conn.close()

    stock_df["current_stock"] = stock_df["current_stock"].astype(int)
    return stock_df

def build_bactest_predictions(feature_df: pd.DataFrame, test_weeks_count: int = 4) -> pd.DataFrame:
    """
    Hasilkan prediksi vs aktual untuk seluruh minggu historis:
    - 4 minggu terakhir menggunakan time-based split dari seluruh data latih sebelumnya
    - Minggu historis sebelumnya menggunakan out-of-fold KFold berbasis minggu (tanpa kebocoran data)
    """
    unique_weeks = sorted(feature_df["week_start_date"].unique())
    split_week = unique_weeks[-test_weeks_count]

    train_df = feature_df[feature_df["week_start_date"] < split_week].copy()
    test_df = feature_df[feature_df["week_start_date"] >= split_week].copy()

    rf_params = {
        "n_estimators": 200,
        "max_depth": 12,
        "min_samples_leaf": 3,
        "random_state": 42,
        "n_jobs": -1,
    }

    model = RandomForestRegressor(**rf_params)
    model.fit(train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN])

    preds = np.clip(model.predict(test_df[FEATURE_COLUMNS]), a_min=0, a_max=None)
    test_df["predicted_demand"] = np.round(preds).astype(int)

    train_weeks = np.array(sorted(train_df["week_start_date"].unique()))
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    oof_parts = []

    for _, val_idx in kf.split(train_weeks):
        val_weeks = set(train_weeks[val_idx])
        fold_train = train_df[~train_df["week_start_date"].isin(val_weeks)]
        fold_val = train_df[train_df["week_start_date"].isin(val_weeks)].copy()

        fold_model = RandomForestRegressor(**rf_params)
        fold_model.fit(fold_train[FEATURE_COLUMNS], fold_train[TARGET_COLUMN])
        fold_preds = np.clip(fold_model.predict(fold_val[FEATURE_COLUMNS]), a_min=0, a_max=None)
        fold_val["predicted_demand"] = np.round(fold_preds).astype(int)
        oof_parts.append(fold_val)

    full_backtest = (
        pd.concat([*oof_parts, test_df], ignore_index=True)
        .sort_values(["product_id", "week_start_date"])
        .reset_index(drop=True)
    )
    full_backtest["actual_demand"] = full_backtest[TARGET_COLUMN].astype(int)
    full_backtest["prediction_date"] = full_backtest["week_start_date"]

    return full_backtest[["product_id", "predicted_demand", "actual_demand", "prediction_date"]]

def save_to_sales_predictions(backtest_df: pd.DataFrame, forecast_df: pd.DataFrame) -> int:
    """Simpan hasil backtest (4 minggu terakhir) dan forecast (4 minggu kedepan) ke mysql"""
    rows_to_insert = []

    # 1. Baris evaluasi/backtest (punya actual_demand)
    for _, row in backtest_df.iterrows():
        rows_to_insert.append((
            int(row["product_id"]),
            int(row["predicted_demand"]),
            int(row["actual_demand"]),
            str(row["prediction_date"]),
            MODEL_VERSION,
        ))
    
    # 2. Baris prediksi masa depan (actual_demand = None / NULL)
    for _, row in forecast_df.iterrows():
        rows_to_insert.append((
            int(row["product_id"]),
            int(row["predicted_qty"]),
            None,
            str(row["forecast_week"]),
            MODEL_VERSION
        ))

    insert_sql = """INSERT INTO sales_predictions(product_id, predicted_demand, actual_demand, prediction_date, model_version)VALUES (%s, %s, %s, %s, %s)
    """

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM sales_predictions WHERE model_version = %s", (MODEL_VERSION,))
            cursor.executemany(insert_sql, rows_to_insert)
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return len(rows_to_insert)

def build_restock_recomendations(
        products_df: pd.DataFrame,
        stock_df: pd.DataFrame,
        forecast_df: pd.DataFrame,
) -> pd.DataFrame:
    """Hitung rekomendasi jumlah restok produk berdasarkan prediksi 1 & 4 minggu ke depan."""
    #ambil prediksi minggu +1 dan total 4 minggu per produk
    week1_df = (
        forecast_df[forecast_df["week_ahead"].str.lower() == "minggu +1"].rename(columns={"predicted_qty": "pred_week_1"})[["product_id", "pred_week_1"]]
    )
    total4w_df = (
        forecast_df.groupby("product_id", as_index=False).agg(pred_4_weeks = ("predicted_qty", "sum"))
    )

    rec_df = products_df[["product_id", "product_name", "unit", "min_stock"]].merge(
        stock_df, on="product_id", how="left"
    )
    rec_df = rec_df.merge(week1_df, on="product_id", how="left")
    rec_df = rec_df.merge(total4w_df, on="product_id", how="left")
    rec_df["current_stock"] = rec_df["current_stock"].fillna(0).astype(int)
    rec_df["min_stock"] = rec_df["min_stock"].fillna(0).astype(int)
    rec_df["pred_week_1"] = rec_df["pred_week_1"].fillna(0).astype(int)
    rec_df["pred_4_weeks"] = rec_df["pred_4_weeks"].fillna(0).astype(int)

    # Rekomendasi restok = kebutuhan (prediksi + min_stock) dikurangi stok saat ini
    rec_df["restock_1_week"] = (
        rec_df["pred_week_1"] + rec_df["min_stock"] - rec_df["current_stock"]
    ).clip(lower=0)
    rec_df["restock_4_weeks"] = (
        rec_df["pred_4_weeks"] + rec_df["min_stock"] - rec_df["current_stock"]
    ).clip(lower=0)

    # Tentukan status stok
    conditions = [
        rec_df["current_stock"] <= rec_df["min_stock"],
        rec_df["restock_1_week"] > 0,
    ]
    choices = ["KRITIS", "PERLU RESTOK"]
    rec_df["stock_status"] = np.select(conditions, choices, default="AMAN")

    return rec_df.sort_values(["restock_1_week", "restock_4_weeks"], ascending=False).reset_index(drop=True)

if __name__ == "__main__":
    products_df, weekly_df = load_weekly_data()
    feature_df = create_features(weekly_df)

    #1. Evaluasi & buat data backtest 4 minggu terakhir
    metrics = evaluate_time_split(feature_df, test_weeks_count=4)
    backtest_df = build_bactest_predictions(feature_df,test_weeks_count=4)

    #2. Latih model penuh & prediksi hingga 8 minggu ke depan
    final_model = train_full_model(feature_df)
    forecast_df = recursive_forecast(final_model, weekly_df, horizon_weeks=8)

    #3. simpanke tabel sales_predictions di mysql
    saved_count = save_to_sales_predictions(backtest_df, forecast_df)

    #4. Hitung rekomendasi restok inventori
    stock_df = fetch_curent_stock()
    rec_df = build_restock_recomendations(products_df, stock_df, forecast_df)

    print(f"Berhasil menyimpan {saved_count} baris ke tabel 'sales_predictions' (model:{MODEL_VERSION}).")
    print(f"Akurasi Model : {metrics['rf_accuracy']:.2f}% (WAPE:{metrics['rf_wape']:.2f}%, MAE: {metrics['rf_mae']:.2f})")

    print("\n=== TOP 10 PRODUK PRIORITAS RESTOK ===")
    cols = [
        "product_id",
        "product_name",
        "current_stock",
        "min_stock",
        "pred_week_1",
        "pred_4_weeks",
        "restock_1_week",
        "restock_4_weeks",
        "stock_status",
    ]
    print(rec_df[cols].head(10).to_string(index=False))

