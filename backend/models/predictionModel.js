const db = require('../config/db');

exports.getActiveProductsWithStock = () =>
  db.promise().query(`
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.barcode,
      p.unit,
      p.cost_price,
      p.selling_price,
      p.min_stock,
      sc.id AS subcategory_id,
      sc.name AS subcategory_name,
      c.id AS category_id,
      c.name AS category_name,
      b.id AS brand_id,
      b.name AS brand_name,
      COALESCE(inv.stock, 0) AS current_stock
    FROM products p
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN categories c ON c.id = sc.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN (
      SELECT product_id, SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END) AS stock
      FROM inventory_transactions
      GROUP BY product_id
    ) inv ON inv.product_id = p.id
    WHERE p.is_active = 1
    ORDER BY p.id ASC
  `);

exports.getPredictionsByModel = (modelVersion = 'rf_v1') =>
  db.promise().query(
    `SELECT
      id,
      product_id,
      predicted_demand,
      actual_demand,
      DATE_FORMAT(prediction_date, '%Y-%m-%d') AS prediction_date,
      model_version,
      created_at
    FROM sales_predictions
    WHERE model_version = ?
    ORDER BY product_id ASC, prediction_date ASC`,
    [modelVersion],
  );
