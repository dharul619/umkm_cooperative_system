const path = require('path');
const { execFile } = require('child_process');
const model = require('../models/predictionModel');

const MODEL_VERSION = 'rf_v1';

const buildSummaryPayload = async () => {
  const [[products], [predictions]] = await Promise.all([
    model.getActiveProductsWithStock(),
    model.getPredictionsByModel(MODEL_VERSION),
  ]);

  const byProduct = new Map();
  const availableWeeksSet = new Set();
  let lastUpdated = null;

  predictions.forEach((row) => {
    const pid = Number(row.product_id);
    if (!byProduct.has(pid)) {
      byProduct.set(pid, { backtest: [], forecast: [] });
    }

    if (row.created_at && (!lastUpdated || new Date(row.created_at) > new Date(lastUpdated))) {
      lastUpdated = row.created_at;
    }

    const predicted = Number(row.predicted_demand || 0);
    if (row.actual_demand !== null && row.actual_demand !== undefined) {
      const actual = Number(row.actual_demand);
      if (row.prediction_date) {
        availableWeeksSet.add(row.prediction_date);
      }
      byProduct.get(pid).backtest.push({
        week: row.prediction_date,
        actual_qty: actual,
        predicted_qty: predicted,
      });
    } else {
      byProduct.get(pid).forecast.push({
        week: row.prediction_date,
        predicted_qty: predicted,
      });
    }
  });

  const availableWeeks = Array.from(availableWeeksSet).sort();

  let totalAbsError = 0;
  let totalActual = 0;
  let backtestCount = 0;

  byProduct.forEach((group) => {
    const defaultSlice = group.backtest.slice(-4);
    defaultSlice.forEach((row) => {
      totalAbsError += Math.abs(row.actual_qty - row.predicted_qty);
      totalActual += Math.abs(row.actual_qty);
      backtestCount += 1;
    });
  });

  const mae = backtestCount > 0 ? totalAbsError / backtestCount : 0;
  const wape = totalActual > 0 ? (totalAbsError / totalActual) * 100 : 0;
  const accuracy = Math.max(0, 100 - wape);

  const items = products.map((prod) => {
    const pid = Number(prod.product_id);
    const group = byProduct.get(pid) || { backtest: [], forecast: [] };
    const forecastList = group.forecast;

    const sumHorizon = (n) =>
      forecastList.slice(0, n).reduce((sum, entry) => sum + Number(entry.predicted_qty || 0), 0);

    const predWeek1 = forecastList[0]?.predicted_qty || 0;
    const predWeek2 = forecastList[1]?.predicted_qty || 0;
    const predWeek3 = forecastList[2]?.predicted_qty || 0;
    const predWeek4 = forecastList[3]?.predicted_qty || 0;
    const predWeek5 = forecastList[4]?.predicted_qty || 0;
    const predWeek6 = forecastList[5]?.predicted_qty || 0;
    const predWeek7 = forecastList[6]?.predicted_qty || 0;
    const predWeek8 = forecastList[7]?.predicted_qty || 0;

    const pred2Weeks = sumHorizon(2);
    const pred4Weeks = sumHorizon(4);
    const pred8Weeks = sumHorizon(8);

    const currentStock = Number(prod.current_stock || 0);
    const minStock = Number(prod.min_stock || 0);

    const restock1Week = Math.max(0, predWeek1 + minStock - currentStock);
    const restock2Weeks = Math.max(0, pred2Weeks + minStock - currentStock);
    const restock4Weeks = Math.max(0, pred4Weeks + minStock - currentStock);
    const restock8Weeks = Math.max(0, pred8Weeks + minStock - currentStock);

    let stockStatus = 'AMAN';
    if (currentStock <= minStock) {
      stockStatus = 'KRITIS';
    } else if (restock1Week > 0) {
      stockStatus = 'PERLU RESTOK';
    }

    return {
      product_id: pid,
      product_name: prod.product_name,
      barcode: prod.barcode,
      unit: prod.unit,
      category_id: prod.category_id,
      category_name: prod.category_name || '-',
      subcategory_id: prod.subcategory_id,
      subcategory_name: prod.subcategory_name || '-',
      brand_name: prod.brand_name || '-',
      cost_price: Number(prod.cost_price || 0),
      selling_price: Number(prod.selling_price || 0),
      current_stock: currentStock,
      min_stock: minStock,
      pred_week_1: predWeek1,
      pred_week_2: predWeek2,
      pred_week_3: predWeek3,
      pred_week_4: predWeek4,
      pred_week_5: predWeek5,
      pred_week_6: predWeek6,
      pred_week_7: predWeek7,
      pred_week_8: predWeek8,
      pred_4_weeks: pred4Weeks,
      pred_8_weeks: pred8Weeks,
      restock_1_week: restock1Week,
      restock_2_weeks: restock2Weeks,
      restock_4_weeks: restock4Weeks,
      restock_8_weeks: restock8Weeks,
      stock_status: stockStatus,
      backtest: group.backtest,
      forecast: forecastList,
    };
  });

  items.sort((a, b) => b.restock_1_week - a.restock_1_week || b.restock_4_weeks - a.restock_4_weeks);

  return {
    model_version: MODEL_VERSION,
    last_updated: lastUpdated,
    available_weeks: availableWeeks,
    max_horizon: 8,
    metrics: {
      mae: Number(mae.toFixed(2)),
      wape: Number(wape.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      test_rows: backtestCount,
    },
    summary: {
      total_products: items.length,
      kritis_count: items.filter((i) => i.stock_status === 'KRITIS').length,
      perlu_restok_count: items.filter((i) => i.stock_status === 'PERLU RESTOK').length,
      aman_count: items.filter((i) => i.stock_status === 'AMAN').length,
    },
    items,
  };
};

exports.getPredictionSummary = async (req, res) => {
  try {
    const data = await buildSummaryPayload();
    res.json({
      success: true,
      data,
      message: 'Prediction summary fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.runPredictionPipeline = (req, res) => {
  const rootDir = path.resolve(__dirname, '../..');
  const scriptPath = path.resolve(rootDir, 'ml/save_predictions.py');

  execFile('python', [scriptPath], { cwd: rootDir, timeout: 120000 }, async (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: stderr || error.message || 'Gagal menjalankan pipeline prediksi Python',
      });
    }

    try {
      const data = await buildSummaryPayload();
      res.json({
        success: true,
        data,
        log: stdout,
        message: 'Prediksi Random Forest berhasil diperbarui',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
};
