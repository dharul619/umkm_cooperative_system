from datetime import timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

from data_loader import load_weekly_data
from features import (
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    _check_payday_week,
    _check_ramadan_lebaran,
    create_features,
)

def calculate_wape(y_true: pd.Series, y_pred: np.ndarray) -> float:
    """Hitung WAPE (%) = total error absolut / total penjualan aktual"""
    total_actual = float(np.sum(np.abs(y_true)))
    if total_actual == 0:
        return 0.0
    total_error = float(np.sum(np.abs(y_true - y_pred)))
    return (total_error / total_actual)*100.0

def evaluate_time_split(feature_df: pd.DataFrame, test_weeks_count: int = 4) -> dict:
    """Latih model pada data lama dan uji pada N minggu terakhir (Time based split). Bandingkan MAE & WAPE Random Forest terhadap baseline (rolling_mean_4)."""
    unique_weeks = sorted(feature_df["week_start_date"].unique())
    if len(unique_weeks) <= test_weeks_count:
        raise ValueError("Jumlah Minggu tidak cukup untuk melakukan time-based split")

    split_week = unique_weeks[-test_weeks_count]
    train_df = feature_df[feature_df["week_start_date"]<split_week]
    test_df = feature_df[feature_df["week_start_date"]>=split_week]

    X_train, y_train = train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN]
    X_test, y_test = test_df[FEATURE_COLUMNS], test_df[TARGET_COLUMN]

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    rf_preds = np.clip(model.predict(X_test), a_min=0, a_max=None)
    baseline_preds = test_df["rolling_mean_4"].to_numpy()

    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_wape = calculate_wape(y_test, rf_preds)

    base_mae = mean_absolute_error(y_test, baseline_preds)
    base_wape = calculate_wape(y_test, baseline_preds)

    return{
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "test_start": split_week,
        "test_end": unique_weeks[-1],
        "rf_mae": rf_mae,
        "rf_wape": rf_wape,
        "rf_accuracy" : max(0.0, 100.0 - rf_wape),
        "base_mae": base_mae,
        "base_wape": base_wape,
        "base_accuracy": max(0.0, 100.0 - base_wape),
    }

def train_full_model(feature_df: pd.DataFrame) -> RandomForestRegressor:
    """Latih ulang random forest menggunakan seluruh data historis untuk prediksi masa depan."""
    X_all = feature_df[FEATURE_COLUMNS]
    y_all = feature_df[TARGET_COLUMN]

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_all, y_all)
    return model

def recursive_forecast(
        model: RandomForestRegressor,
        weekly_df: pd.DataFrame,
        horizon_weeks: int = 4,
) -> pd.DataFrame:
    """perdiksi penjualan 'horizon weeks' minggu ke depan secara bertahap (recursive). hasil prediksi minggu ke-t dipakai sebagai lag untuk minggu ke-(t+1)."""

    df = weekly_df.copy()
    df["week_start_date"] = pd.to_datetime(df["week_start"]).dt.date
    df = df.sort_values(["product_id", "week_start_date"]).reset_index(drop=True)

    last_week = df["week_start_date"].max()

    # Simpan riwayat qty per produk (dalam bentuk list) agar mudah di append tiap iterasi

    history_qty: dict[int, list[float]] = {}
    product_meta: dict[int, dict] = {}

    for pid, group in df.groupby("product_id"):
        history_qty[pid] = group["qty"]. astype(float).tolist()
        last_row = group.iloc[-1]
        product_meta[pid] = {
            "product_name": last_row["product_name"],
            "category_id": 0 if pd.isna(last_row["category_id"]) else int(last_row["category_id"]),
            "price": float(last_row["price"]),
        }
    forecast_rows = []

    for step in range(1, horizon_weeks + 1):
        target_week = last_week + timedelta(days=7 * step)
        is_ramadan, is_lebaran = _check_ramadan_lebaran(target_week)
        is_payday = _check_payday_week(target_week)
        month = target_week.month
        week_of_month = ((target_week.day - 1) // 7) + 1

        step_features = []
        product_ids = list(history_qty.keys())

        for pid in product_ids:
            hist = history_qty[pid]
            meta = product_meta[pid]

            step_features.append({
                "product_id": pid,
                "category_id": meta["category_id"],
                "price": meta["price"],
                "lag_1": hist[-1],
                "lag_2": hist[-2] if len(hist) >= 2 else hist[-1],
                "lag_3": hist[-3] if len(hist) >= 3 else hist[-1],
                "lag_4": hist[-4] if len(hist) >= 4 else hist[-1],
                "rolling_mean_4": float(np.mean(hist[-4:])),
                "rolling_mean_8": float(np.mean(hist[-8:])),
                "month": month,
                "week_of_month": week_of_month,
                "is_payday_week": is_payday,
                "is_ramadan": is_ramadan,
                "is_lebaran": is_lebaran,
            })

        X_step = pd.DataFrame(step_features)[FEATURE_COLUMNS]
        preds = np.clip(model.predict(X_step), a_min=0, a_max=None )

        for pid, pred_val in zip (product_ids, preds):
            history_qty[pid]. append(float(pred_val))
            forecast_rows.append({
                "product_id": pid,
                "product_name": product_meta[pid]["product_name"],
                "forecast_week": target_week,
                "week_ahead": f"minggu +{step}",
                "predicted_qty": int(round(pred_val)),
            })

    return pd.DataFrame(forecast_rows)

if __name__ == "__main__":
    _, weekly = load_weekly_data()
    feature_df = create_features(weekly)

    #1. Evaluasi Time-based split (4 minggu terakhir)

    metrics = evaluate_time_split(feature_df, test_weeks_count=4)
    print("=== EVALUASI TIME-BASED SPLIT (4 MINGGU TERAKHIR) ===")
    print(f"Periode Uji   : {metrics['test_start']} s/d {metrics['test_end']}")
    print(f"Data Latih    : {metrics['train_rows']} baris | Data Uji: {metrics['test_rows']} baris")
    print(f"Baseline      -> MAE: {metrics['base_mae']:.2f} | WAPE: {metrics['base_wape']:.2f}% | Ketepatan: {metrics['base_accuracy']:.2f}%")
    print(f"Random Forest -> MAE: {metrics['rf_mae']:.2f} | WAPE: {metrics['rf_wape']:.2f}% | Ketepatan: {metrics['rf_accuracy']:.2f}%")
    # 2. Latih model final & prediksi 4 minggu kedepan
    final_model = train_full_model(feature_df)
    forecast_df = recursive_forecast(final_model, weekly, horizon_weeks=4)

    print("\n=== PREDIKSI 4 MINGGU KE DEPAN (CONTOH 3 PRODUK PERTAMA)===")
    sample_pids = forecast_df["product_id"].unique()[:3]
    sample_forecast = forecast_df[forecast_df["product_id"].isin(sample_pids)]
    print(sample_forecast.to_string(index=False))