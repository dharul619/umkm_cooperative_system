const db = require('../config/db');

exports.getStockSummary = () =>
  db.promise().query(`
    SELECT
      p.id,
      p.name,
      p.barcode,
      p.unit,
      p.min_stock,
      p.cost_price,
      p.selling_price,
      p.is_active,
      COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.qty ELSE -it.qty END), 0) AS stock
    FROM products p
    LEFT JOIN inventory_transactions it ON it.product_id = p.id
    GROUP BY p.id, p.name, p.barcode, p.unit, p.min_stock, p.cost_price, p.selling_price, p.is_active
    ORDER BY p.name ASC
  `);

exports.getProductById = (id) =>
  db.promise().query(
    'SELECT id, name, barcode, unit, min_stock, cost_price, selling_price, is_active FROM products WHERE id = ?',
    [id],
  );

exports.getStockCard = (productId) =>
  db.promise().query(
    `SELECT
      it.*,
      p.name AS product_name,
      p.barcode AS product_barcode
    FROM inventory_transactions it
    LEFT JOIN products p ON it.product_id = p.id
    WHERE it.product_id = ?
    ORDER BY it.created_at ASC, it.id ASC`,
    [productId],
  );

exports.getCurrentStock = async (conn, productId) => {
  const [rows] = await conn.execute(
    "SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END), 0) AS stock FROM inventory_transactions WHERE product_id = ?",
    [productId],
  );
  return Number(rows[0]?.stock || 0);
};

exports.createInventoryTransaction = (conn, data) =>
  conn.execute(
    'INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, ?, ?, ?, ?, ?)',
    [data.product_id, data.type, data.qty, data.reference_id ?? null, data.reference_type, data.note ?? null],
  );

exports.getInventoryTransactionById = (id) =>
  db.promise().query('SELECT * FROM inventory_transactions WHERE id = ?', [id]);
