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
      p.subcategory_id,
      p.brand_id,
      sc.category_id,
      c.name AS category_name,
      sc.name AS subcategory_name,
      b.name AS brand_name,
      COALESCE(inv.stock, 0) AS stock
    FROM products p
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN categories c ON c.id = sc.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN (
      SELECT product_id, SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END) AS stock
      FROM inventory_transactions
      GROUP BY product_id
    ) inv ON inv.product_id = p.id
    ORDER BY p.name ASC
  `);

exports.getProductById = (id) =>
  db.promise().query(
    'SELECT id, name, barcode, unit, min_stock, cost_price, selling_price, is_active FROM products WHERE id = ?',
    [id],
  );

exports.getCurrentStockByPool = async (productId) => {
  const [rows] = await db.promise().query(
    "SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END), 0) AS stock FROM inventory_transactions WHERE product_id = ?",
    [productId],
  );
  return Number(rows[0]?.stock || 0);
};

exports.getStockCard = (productId, { limit = 20, offset = 0, referenceType = '' } = {}) => {
  let query = `
    SELECT
      it.*,
      p.name AS product_name,
      p.barcode AS product_barcode
    FROM inventory_transactions it
    LEFT JOIN products p ON it.product_id = p.id
    WHERE it.product_id = ?
  `;
  const params = [productId];

  if (referenceType) {
    query += ' AND it.reference_type = ?';
    params.push(referenceType);
  }

  query += ' ORDER BY it.created_at DESC, it.id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  return db.promise().query(query, params);
};

exports.getStockCardCount = (productId, { referenceType = '' } = {}) => {
  let query = 'SELECT COUNT(*) AS total FROM inventory_transactions WHERE product_id = ?';
  const params = [productId];

  if (referenceType) {
    query += ' AND reference_type = ?';
    params.push(referenceType);
  }

  return db.promise().query(query, params);
};

exports.getCurrentStock = async (conn, productId) => {
  const [rows] = await conn.execute(
    "SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END), 0) AS stock FROM inventory_transactions WHERE product_id = ?",
    [productId],
  );
  return Number(rows[0]?.stock || 0);
};

exports.hasBeginningStock = async (conn, productId) => {
  const [rows] = await conn.execute(
    "SELECT id FROM inventory_transactions WHERE product_id = ? AND reference_type = 'BEGINNING' LIMIT 1",
    [productId],
  );
  return rows.length > 0;
};

exports.createInventoryTransaction = (conn, data) =>
  conn.execute(
    'INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, ?, ?, ?, ?, ?)',
    [data.product_id, data.type, data.qty, data.reference_id ?? null, data.reference_type, data.note ?? null],
  );

exports.getInventoryTransactionById = (id) =>
  db.promise().query('SELECT * FROM inventory_transactions WHERE id = ?', [id]);
