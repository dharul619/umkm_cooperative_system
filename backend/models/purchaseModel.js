const db = require('../config/db');

exports.getAll = () =>
  db.promise().query(
    'SELECT p.*, s.name AS supplier_name FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.purchase_date DESC, p.id DESC'
  );

exports.getById = (id) =>
  db.promise().query(
    'SELECT p.*, s.name AS supplier_name FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE p.id = ?',
    [id]
  );

exports.getDetailsByPurchaseId = (purchaseId) =>
  db.promise().query(
    'SELECT pd.*, pr.name AS product_name FROM purchase_details pd LEFT JOIN products pr ON pd.product_id = pr.id WHERE pd.purchase_id = ? ORDER BY pd.id ASC',
    [purchaseId]
  );

exports.createPurchase = (conn, data) =>
  conn.execute(
    'INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES (?, ?, ?)',
    [data.supplier_id, data.purchase_date, data.total_amount]
  );

exports.createDetail = (conn, data) =>
  conn.execute(
    'INSERT INTO purchase_details (purchase_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)',
    [data.purchase_id, data.product_id, data.qty, data.price, data.subtotal]
  );

exports.createInventoryTransaction = (conn, data) =>
  conn.execute(
    'INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, ?, ?, ?, ?, ?)',
    [data.product_id, data.type, data.qty, data.reference_id, data.reference_type, data.note ?? null]
  );

exports.getProductById = (conn, id) =>
  conn.execute('SELECT id, name, cost_price FROM products WHERE id = ?', [id]);
