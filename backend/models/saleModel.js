const db = require('../config/db');

exports.getAll = () =>
  db.promise().query(
    'SELECT s.*, u.name AS operator_name FROM sales s LEFT JOIN users u ON s.operator_id = u.id ORDER BY s.sale_date DESC, s.created_at DESC, s.id DESC'
  );

exports.getById = (id) =>
  db.promise().query(
    'SELECT s.*, u.name AS operator_name FROM sales s LEFT JOIN users u ON s.operator_id = u.id WHERE s.id = ?',
    [id]
  );

exports.getDetailsBySaleId = (saleId) =>
  db.promise().query(
    'SELECT sd.*, p.name AS product_name, p.barcode AS product_barcode FROM sales_details sd LEFT JOIN products p ON sd.product_id = p.id WHERE sd.sale_id = ? ORDER BY sd.id ASC',
    [saleId]
  );

exports.getProductByBarcode = (conn, barcode) =>
  conn.execute(
    'SELECT id, name, barcode, cost_price, selling_price FROM products WHERE barcode = ? LIMIT 1',
    [barcode]
  );

exports.getStockByProductId = async (conn, productId) => {
  const [rows] = await conn.execute(
    "SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END), 0) AS stock FROM inventory_transactions WHERE product_id = ?",
    [productId]
  );
  return rows[0]?.stock ?? 0;
};

exports.createSale = (conn, data) =>
  conn.execute(
    'INSERT INTO sales (sale_date, operator_id, total_amount, total_profit, coordinator_share, koperasi_share) VALUES (?, ?, ?, ?, ?, ?)',
    [data.sale_date, data.operator_id, data.total_amount, data.total_profit, data.coordinator_share, data.koperasi_share]
  );

exports.createDetail = (conn, data) =>
  conn.execute(
    'INSERT INTO sales_details (sale_id, product_id, qty, price, cost_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
    [data.sale_id, data.product_id, data.qty, data.price, data.cost_price, data.subtotal]
  );

exports.createInventoryTransaction = (conn, data) =>
  conn.execute(
    'INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, ?, ?, ?, ?, ?)',
    [data.product_id, data.type, data.qty, data.reference_id, data.reference_type, data.note ?? null]
  );
