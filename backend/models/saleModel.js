const db = require('../config/db');

const getLocalDateCode = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const generateSequentialCode = async (conn, { table, column, prefix, date = new Date() }) => {
  const datePart = getLocalDateCode(date);
  const fullPrefix = `${prefix}-${datePart}-`;
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(${column}, '-', -1) AS UNSIGNED)), 0) AS max_seq
     FROM ${table}
     WHERE ${column} LIKE ?
     FOR UPDATE`,
    [`${fullPrefix}%`]
  );
  const nextSeq = Number(rows[0]?.max_seq || 0) + 1;
  return `${fullPrefix}${String(nextSeq).padStart(4, '0')}`;
};

const buildSalesWhereClause = (filters = {}) => {
  let whereSql = ' WHERE 1=1';
  const params = [];

  if (filters.search) {
    whereSql +=
      ' AND (s.invoice_number LIKE ? OR u.name LIKE ? OR m.name LIKE ? OR s.sale_date LIKE ? OR CAST(s.total_amount AS CHAR) LIKE ? OR CAST(s.id AS CHAR) LIKE ?)';
    const pattern = `%${filters.search}%`;
    params.push(pattern, pattern, pattern, pattern, pattern, pattern);
  }

  if (filters.from) {
    whereSql += ' AND s.sale_date >= ?';
    params.push(filters.from);
  }

  if (filters.to) {
    whereSql += ' AND s.sale_date <= ?';
    params.push(filters.to);
  }

  if (filters.status) {
    whereSql += ' AND s.status = ?';
    params.push(filters.status);
  }

  if (filters.payment_method) {
    whereSql += ' AND s.payment_method = ?';
    params.push(filters.payment_method);
  }

  if (filters.shift_id) {
    whereSql += ' AND s.shift_id = ?';
    params.push(Number(filters.shift_id));
  }

  return { whereSql, params };
};

exports.generateInvoiceNumber = (conn, date) =>
  generateSequentialCode(conn, { table: 'sales', column: 'invoice_number', prefix: 'POS', date });

exports.generateShiftCode = (conn, date) =>
  generateSequentialCode(conn, { table: 'pos_shifts', column: 'shift_code', prefix: 'SHF', date });

exports.generateReturnNumber = (conn, date) =>
  generateSequentialCode(conn, { table: 'sale_returns', column: 'return_number', prefix: 'RET', date });

exports.getAll = (filters = {}) => {
  const { whereSql, params } = buildSalesWhereClause(filters);
  let query = `
    SELECT
      s.*,
      u.name AS operator_name,
      m.name AS member_name,
      m.phone_number AS member_phone,
      v.name AS voided_by_name,
      va.name AS void_approved_by_name,
      sh.shift_code
    FROM sales s
    LEFT JOIN users u ON s.operator_id = u.id
    LEFT JOIN users m ON s.member_id = m.id
    LEFT JOIN users v ON s.voided_by = v.id
    LEFT JOIN users va ON s.void_approved_by = va.id
    LEFT JOIN pos_shifts sh ON s.shift_id = sh.id
    ${whereSql}
    ORDER BY s.sale_date DESC, s.created_at DESC, s.id DESC
  `;

  if (filters.limit !== undefined) {
    query += ' LIMIT ?';
    params.push(Number(filters.limit));
  }

  if (filters.offset !== undefined) {
    query += ' OFFSET ?';
    params.push(Number(filters.offset));
  }

  return db.promise().query(query, params);
};

exports.getTotalCount = (filters = {}) => {
  const { whereSql, params } = buildSalesWhereClause(filters);
  const query = `
    SELECT COUNT(*) AS total
    FROM sales s
    LEFT JOIN users u ON s.operator_id = u.id
    LEFT JOIN users m ON s.member_id = m.id
    ${whereSql}
  `;

  return db.promise().query(query, params);
};

exports.getById = (id) =>
  db.promise().query(
    `SELECT
      s.*,
      u.name AS operator_name,
      m.name AS member_name,
      m.phone_number AS member_phone,
      m.username AS member_username,
      v.name AS voided_by_name,
      va.name AS void_approved_by_name,
      sh.shift_code
     FROM sales s
     LEFT JOIN users u ON s.operator_id = u.id
     LEFT JOIN users m ON s.member_id = m.id
     LEFT JOIN users v ON s.voided_by = v.id
     LEFT JOIN users va ON s.void_approved_by = va.id
     LEFT JOIN pos_shifts sh ON s.shift_id = sh.id
     WHERE s.id = ?`,
    [id]
  );

exports.getByInvoiceNumber = (invoiceNumber) =>
  db.promise().query(
    `SELECT
      s.*,
      u.name AS operator_name,
      m.name AS member_name,
      m.phone_number AS member_phone,
      m.username AS member_username,
      v.name AS voided_by_name,
      va.name AS void_approved_by_name,
      sh.shift_code
     FROM sales s
     LEFT JOIN users u ON s.operator_id = u.id
     LEFT JOIN users m ON s.member_id = m.id
     LEFT JOIN users v ON s.voided_by = v.id
     LEFT JOIN users va ON s.void_approved_by = va.id
     LEFT JOIN pos_shifts sh ON s.shift_id = sh.id
     WHERE s.invoice_number = ?
     LIMIT 1`,
    [invoiceNumber]
  );

exports.getAdminByUsername = (username) =>
  db.promise().query(
    `SELECT u.id, u.name, u.username, u.password, u.status, r.role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.username = ?
       AND r.role_name = 'System Administrator'
       AND u.status = 'approved'
     LIMIT 1`,
    [username]
  );

exports.getDetailsBySaleId = (saleId) =>
  db.promise().query(
    `SELECT
      sd.*,
      COALESCE(sd.product_name, p.name) AS product_name,
      p.barcode AS product_barcode,
      p.unit AS product_unit
     FROM sales_details sd
     LEFT JOIN products p ON sd.product_id = p.id
     WHERE sd.sale_id = ?
     ORDER BY sd.id ASC`,
    [saleId]
  );

exports.getSalePaymentsBySaleId = (saleId) =>
  db.promise().query(
    `SELECT * FROM sale_payments WHERE sale_id = ? ORDER BY id ASC`,
    [saleId]
  );

exports.getSaleReturnsBySaleId = async (saleId) => {
  const [returns] = await db.promise().query(
    `SELECT sr.*, u.name AS operator_name, ap.name AS approved_by_name
     FROM sale_returns sr
     LEFT JOIN users u ON sr.operator_id = u.id
     LEFT JOIN users ap ON sr.approved_by = ap.id
     WHERE sr.sale_id = ?
     ORDER BY sr.created_at DESC, sr.id DESC`,
    [saleId]
  );
  if (!returns.length) return [];

  const returnIds = returns.map((r) => r.id);
  const [details] = await db.promise().query(
    `SELECT srd.*, p.name AS product_name, p.barcode AS product_barcode
     FROM sale_return_details srd
     LEFT JOIN products p ON srd.product_id = p.id
     WHERE srd.sale_return_id IN (?)
     ORDER BY srd.id ASC`,
    [returnIds]
  );

  const detailsMap = new Map();
  for (const row of details) {
    if (!detailsMap.has(row.sale_return_id)) detailsMap.set(row.sale_return_id, []);
    detailsMap.get(row.sale_return_id).push(row);
  }

  return returns.map((r) => ({
    ...r,
    details: detailsMap.get(r.id) || [],
  }));
};

exports.getPosProducts = () =>
  db.promise().query(`
    SELECT
      p.id,
      p.name,
      p.barcode,
      p.unit,
      p.selling_price,
      p.cost_price,
      p.min_stock,
      p.is_active,
      sc.id AS subcategory_id,
      sc.name AS subcategory_name,
      c.id AS category_id,
      c.name AS category_name,
      b.id AS brand_id,
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
    WHERE p.is_active = 1
    ORDER BY p.name ASC
  `);

exports.searchMembers = (search = '') => {
  const params = [];
  let searchFilter = '';
  if (search) {
    searchFilter = ' AND (u.name LIKE ? OR u.phone_number LIKE ? OR u.username LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  return db.promise().query(
    `SELECT
      u.id,
      u.name,
      u.phone_number,
      u.username,
      d.name AS division_name,
      dp.name AS department_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN divisions d ON u.division_id = d.id
     LEFT JOIN departments dp ON u.department_id = dp.id
     WHERE r.role_name = 'Cooperative Member'
       AND u.status = 'approved'
       ${searchFilter}
     ORDER BY u.name ASC
     LIMIT 30`,
    params
  );
};

exports.getApprovedMemberById = (conn, memberId) =>
  conn.execute(
    `SELECT u.id, u.name, u.phone_number
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ? AND r.role_name = 'Cooperative Member' AND u.status = 'approved'
     LIMIT 1`,
    [memberId]
  );

exports.resolveProductMeta = (conn, { product_id, barcode }) => {
  if (product_id) {
    return conn.execute(
      'SELECT id, name, barcode, is_active FROM products WHERE id = ? LIMIT 1',
      [product_id]
    );
  }
  return conn.execute(
    'SELECT id, name, barcode, is_active FROM products WHERE barcode = ? LIMIT 1',
    [barcode]
  );
};

exports.getProductForUpdate = (conn, productId) =>
  conn.execute(
    'SELECT id, name, barcode, unit, cost_price, selling_price, is_active FROM products WHERE id = ? AND is_active = 1 LIMIT 1 FOR UPDATE',
    [productId]
  );

exports.getStockByProductId = async (conn, productId) => {
  const [rows] = await conn.execute(
    "SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE -qty END), 0) AS stock FROM inventory_transactions WHERE product_id = ?",
    [productId]
  );
  return Number(rows[0]?.stock ?? 0);
};

exports.createSale = (conn, data) =>
  conn.execute(
    `INSERT INTO sales (
      invoice_number, sale_date, operator_id, shift_id, member_id, status,
      subtotal_amount, item_discount_amount, order_discount_type, order_discount_value,
      order_discount_amount, discount_amount, tax_amount,
      total_amount, total_profit, coordinator_share, koperasi_share,
      payment_method, paid_amount, change_amount, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.invoice_number,
      data.sale_date,
      data.operator_id,
      data.shift_id,
      data.member_id ?? null,
      data.status || 'COMPLETED',
      data.subtotal_amount,
      data.item_discount_amount,
      data.order_discount_type,
      data.order_discount_value,
      data.order_discount_amount,
      data.discount_amount,
      data.tax_amount ?? 0,
      data.total_amount,
      data.total_profit,
      data.coordinator_share,
      data.koperasi_share,
      data.payment_method,
      data.paid_amount,
      data.change_amount,
      data.notes ?? null,
    ]
  );

exports.createDetail = (conn, data) =>
  conn.execute(
    `INSERT INTO sales_details (
      sale_id, product_id, product_name, qty, price, cost_price,
      discount_type, discount_value, discount_amount, subtotal, returned_qty
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      data.sale_id,
      data.product_id,
      data.product_name,
      data.qty,
      data.price,
      data.cost_price,
      data.discount_type || 'NONE',
      data.discount_value || 0,
      data.discount_amount || 0,
      data.subtotal,
    ]
  );

exports.createSalePayment = (conn, data) =>
  conn.execute(
    `INSERT INTO sale_payments (
      sale_id, payment_method, amount, received_amount, change_amount, reference_no, status, paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      data.sale_id,
      data.payment_method,
      data.amount,
      data.received_amount,
      data.change_amount || 0,
      data.reference_no ?? null,
      data.status || 'SETTLED',
    ]
  );

exports.createInventoryTransaction = (conn, data) =>
  conn.execute(
    'INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, ?, ?, ?, ?, ?)',
    [data.product_id, data.type, data.qty, data.reference_id, data.reference_type, data.note ?? null]
  );

// ===================== VOID & RETURN HELPERS =====================

exports.getSaleByIdForUpdate = (conn, saleId) =>
  conn.execute('SELECT * FROM sales WHERE id = ? LIMIT 1 FOR UPDATE', [saleId]);

exports.getDetailsBySaleIdForUpdate = (conn, saleId) =>
  conn.execute('SELECT * FROM sales_details WHERE sale_id = ? ORDER BY id ASC FOR UPDATE', [saleId]);

exports.markSaleVoided = (conn, saleId, { voided_by, void_approved_by = null, void_reason }) =>
  conn.execute(
    `UPDATE sales
     SET status = 'VOIDED', voided_by = ?, void_approved_by = ?, voided_at = NOW(), void_reason = ?
     WHERE id = ?`,
    [voided_by, void_approved_by, void_reason, saleId]
  );

exports.markPaymentsVoided = (conn, saleId) =>
  conn.execute(`UPDATE sale_payments SET status = 'VOIDED' WHERE sale_id = ?`, [saleId]);

exports.createSaleReturn = (conn, data) =>
  conn.execute(
    `INSERT INTO sale_returns (
      return_number, sale_id, shift_id, operator_id, approved_by, return_date,
      total_refund, total_profit_reversal, refund_method, reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.return_number,
      data.sale_id,
      data.shift_id ?? null,
      data.operator_id,
      data.approved_by ?? null,
      data.return_date,
      data.total_refund,
      data.total_profit_reversal,
      data.refund_method,
      data.reason,
    ]
  );

exports.createSaleReturnDetail = (conn, data) =>
  conn.execute(
    `INSERT INTO sale_return_details (
      sale_return_id, sale_detail_id, product_id, qty, unit_price, cost_price, subtotal, restock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.sale_return_id,
      data.sale_detail_id,
      data.product_id,
      data.qty,
      data.unit_price,
      data.cost_price,
      data.subtotal,
      data.restock ? 1 : 0,
    ]
  );

exports.incrementReturnedQty = (conn, saleDetailId, addQty) =>
  conn.execute(
    'UPDATE sales_details SET returned_qty = returned_qty + ? WHERE id = ?',
    [addQty, saleDetailId]
  );

exports.updateSaleReturnSummary = (conn, saleId, { status, returned_amount, returned_profit }) =>
  conn.execute(
    `UPDATE sales
     SET status = ?, returned_amount = ?, returned_profit = ?
     WHERE id = ?`,
    [status, returned_amount, returned_profit, saleId]
  );

// ===================== SHIFT & CASH DRAWER HELPERS =====================

exports.getActiveShiftByOperator = async (operatorId, conn = null) => {
  const executor = conn || db.promise();
  const [rows] = await executor.query(
    `SELECT sh.*, u.name AS operator_name
     FROM pos_shifts sh
     LEFT JOIN users u ON sh.operator_id = u.id
     WHERE sh.operator_id = ? AND sh.status = 'OPEN'
     ORDER BY sh.opened_at DESC, sh.id DESC
     LIMIT 1`,
    [operatorId]
  );
  return rows[0] || null;
};

exports.getDayClosingByDate = async (businessDate, conn = null) => {
  const executor = conn || db.promise();
  const [rows] = await executor.query(
    `SELECT id, closing_code, business_date, closed_by, closed_at
     FROM pos_day_closings
     WHERE business_date = ?
     LIMIT 1`,
    [businessDate]
  );
  return rows[0] || null;
};

exports.getShiftById = async (shiftId, conn = null, forUpdate = false) => {
  const executor = conn || db.promise();
  const lockSql = forUpdate ? ' FOR UPDATE' : '';
  const [rows] = await executor.query(
    `SELECT
      sh.*,
      u.name AS operator_name,
      vu.name AS verified_by_name,
      dc.closing_code AS day_closing_code
     FROM pos_shifts sh
     LEFT JOIN users u ON sh.operator_id = u.id
     LEFT JOIN users vu ON sh.verified_by = vu.id
     LEFT JOIN pos_day_closings dc ON sh.day_closing_id = dc.id
     WHERE sh.id = ?
     LIMIT 1${lockSql}`,
    [shiftId]
  );
  return rows[0] || null;
};

exports.getShiftHistory = ({ operatorId = null, limit = 20, offset = 0 } = {}) => {
  const params = [];
  let whereSql = ' WHERE 1=1';
  if (operatorId) {
    whereSql += ' AND sh.operator_id = ?';
    params.push(operatorId);
  }
  return db.promise().query(
    `SELECT sh.*, u.name AS operator_name
     FROM pos_shifts sh
     LEFT JOIN users u ON sh.operator_id = u.id
     ${whereSql}
     ORDER BY sh.opened_at DESC, sh.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
};

exports.getShiftHistoryCount = ({ operatorId = null } = {}) => {
  const params = [];
  let whereSql = ' WHERE 1=1';
  if (operatorId) {
    whereSql += ' AND operator_id = ?';
    params.push(operatorId);
  }
  return db.promise().query(`SELECT COUNT(*) AS total FROM pos_shifts${whereSql}`, params);
};

exports.parseDenominationsJson = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

exports.createShift = (conn, data) =>
  conn.execute(
    `INSERT INTO pos_shifts (shift_code, operator_id, opened_at, opening_cash, status, notes)
     VALUES (?, ?, NOW(), ?, 'OPEN', ?)`,
    [data.shift_code, data.operator_id, data.opening_cash, data.notes ?? null]
  );

exports.getShiftLiveSummary = async (shiftId, conn = null) => {
  const executor = conn || db.promise();
  const shift = await exports.getShiftById(shiftId, executor);
  if (!shift) return null;

  const [[salesAggRows], [paymentAggRows], [refundAggRows]] =
    await Promise.all([
      executor.query(
        `SELECT
          COUNT(CASE WHEN status != 'VOIDED' THEN 1 END) AS total_sales_count,
          COUNT(CASE WHEN status = 'VOIDED' THEN 1 END) AS voided_sales_count,
          COALESCE(SUM(CASE WHEN status != 'VOIDED' THEN total_amount ELSE 0 END), 0) AS gross_sales_amount,
          COALESCE(SUM(CASE WHEN status != 'VOIDED' THEN discount_amount ELSE 0 END), 0) AS total_discount_amount
         FROM sales
         WHERE shift_id = ?`,
        [shiftId]
      ),
      executor.query(
        `SELECT
          COALESCE(SUM(CASE WHEN sp.payment_method = 'CASH' THEN sp.amount ELSE 0 END), 0) AS total_cash_sales,
          COALESCE(SUM(CASE WHEN sp.payment_method = 'QRIS' THEN sp.amount ELSE 0 END), 0) AS total_qris_sales,
          COALESCE(SUM(CASE WHEN sp.payment_method = 'TRANSFER' THEN sp.amount ELSE 0 END), 0) AS total_transfer_sales
         FROM sale_payments sp
         JOIN sales s ON s.id = sp.sale_id
         WHERE s.shift_id = ? AND s.status != 'VOIDED' AND sp.status = 'SETTLED'`,
        [shiftId]
      ),
      executor.query(
        `SELECT
          COALESCE(SUM(CASE WHEN refund_method = 'CASH' THEN total_refund ELSE 0 END), 0) AS total_refund_cash,
          COALESCE(SUM(CASE WHEN refund_method != 'CASH' THEN total_refund ELSE 0 END), 0) AS total_refund_non_cash
         FROM sale_returns
         WHERE shift_id = ?`,
        [shiftId]
      ),
    ]);

  const salesAgg = salesAggRows[0] || {};
  const paymentAgg = paymentAggRows[0] || {};
  const refundAgg = refundAggRows[0] || {};

  const openingCash = Number(shift.opening_cash || 0);
  const totalCashSales = Number(paymentAgg.total_cash_sales || 0);
  const totalQrisSales = Number(paymentAgg.total_qris_sales || 0);
  const totalTransferSales = Number(paymentAgg.total_transfer_sales || 0);
  const totalRefundCash = Number(refundAgg.total_refund_cash || 0);
  const totalRefundNonCash = Number(refundAgg.total_refund_non_cash || 0);

  const expectedCash = openingCash + totalCashSales - totalRefundCash;
  const denominations = exports.parseDenominationsJson(shift.denominations_json);

  return {
    shift: {
      ...shift,
      denominations,
    },
    summary: {
      opening_cash: openingCash,
      total_sales_count: Number(salesAgg.total_sales_count || 0),
      voided_sales_count: Number(salesAgg.voided_sales_count || 0),
      gross_sales_amount: Number(salesAgg.gross_sales_amount || 0),
      total_discount_amount: Number(salesAgg.total_discount_amount || 0),
      total_cash_sales: totalCashSales,
      total_qris_sales: totalQrisSales,
      total_transfer_sales: totalTransferSales,
      total_refund_cash: totalRefundCash,
      total_refund_non_cash: totalRefundNonCash,
      expected_cash: expectedCash,
    },
    denominations,
  };
};

exports.closeShift = (conn, shiftId, data) =>
  conn.execute(
    `UPDATE pos_shifts
     SET
       closed_at = NOW(),
       expected_cash = ?,
       actual_cash = ?,
       denominations_json = ?,
       cash_difference = ?,
       actual_qris = ?,
       actual_transfer = ?,
       qris_difference = ?,
       transfer_difference = ?,
       total_sales_count = ?,
       total_cash_sales = ?,
       total_qris_sales = ?,
       total_transfer_sales = ?,
       total_refund_cash = ?,
       total_refund_non_cash = ?,
       status = 'CLOSED',
       notes = COALESCE(?, notes)
     WHERE id = ?`,
    [
      data.expected_cash,
      data.actual_cash,
      data.denominations_json,
      data.cash_difference,
      data.actual_qris,
      data.actual_transfer,
      data.qris_difference,
      data.transfer_difference,
      data.total_sales_count,
      data.total_cash_sales,
      data.total_qris_sales,
      data.total_transfer_sales,
      data.total_refund_cash,
      data.total_refund_non_cash ?? 0,
      data.notes ?? null,
      shiftId,
    ]
  );

// ===================== HELD CARTS HELPERS =====================

exports.countHeldCartsByOperator = async (operatorId, conn = null) => {
  const executor = conn || db.promise();
  const [rows] = await executor.query(
    'SELECT COUNT(*) AS total FROM pos_held_carts WHERE operator_id = ?',
    [operatorId]
  );
  return Number(rows[0]?.total || 0);
};

exports.getHeldCartsByOperator = (operatorId) =>
  db.promise().query(
    `SELECT hc.*, m.name AS member_name, m.phone_number AS member_phone
     FROM pos_held_carts hc
     LEFT JOIN users m ON hc.member_id = m.id
     WHERE hc.operator_id = ?
     ORDER BY hc.created_at DESC, hc.id DESC`,
    [operatorId]
  );

exports.getHeldCartById = async (id, conn = null) => {
  const executor = conn || db.promise();
  const [rows] = await executor.query(
    'SELECT * FROM pos_held_carts WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

exports.createHeldCart = (data) =>
  db.promise().query(
    `INSERT INTO pos_held_carts (shift_id, operator_id, label, member_id, items_json, discount_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.shift_id ?? null,
      data.operator_id,
      data.label,
      data.member_id ?? null,
      data.items_json,
      data.discount_json ?? null,
      data.notes ?? null,
    ]
  );

exports.deleteHeldCart = (id, operatorId, conn = null) => {
  const executor = conn || db.promise();
  if (operatorId) {
    return executor.query('DELETE FROM pos_held_carts WHERE id = ? AND operator_id = ?', [
      id,
      operatorId,
    ]);
  }
  return executor.query('DELETE FROM pos_held_carts WHERE id = ?', [id]);
};
