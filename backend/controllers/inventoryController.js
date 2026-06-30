const db = require('../config/db');
const model = require('../models/inventoryModel');

const isValidId = (value) => Number.isInteger(value) && value > 0;

const normalizeAdjustmentType = (value) => {
  const type = String(value || '').toUpperCase();
  return type === 'IN' || type === 'OUT' ? type : null;
};

exports.getStockSummary = async (req, res) => {
  try {
    const [rows] = await model.getStockSummary();
    res.json({ success: true, data: rows, message: 'Inventory stock fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStockCard = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const [productRows] = await model.getProductById(productId);
    if (!productRows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const [rows] = await model.getStockCard(productId);
    res.json({
      success: true,
      data: { product: productRows[0], transactions: rows },
      message: 'Stock card fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBeginningStock = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const { product_id, qty, note } = req.body;
    const productId = Number(product_id);
    const amount = Number(qty);

    if (!isValidId(productId) || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'product_id and qty are required' });
    }

    await conn.beginTransaction();
    await model.createInventoryTransaction(conn, {
      product_id: productId,
      type: 'IN',
      qty: amount,
      reference_id: null,
      reference_type: 'BEGINNING',
      note: note || 'Stok awal',
    });
    await conn.commit();

    res.status(201).json({ success: true, data: { product_id: productId, qty: amount }, message: 'Beginning stock created' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.createAdjustment = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const { product_id, type, qty, note } = req.body;
    const productId = Number(product_id);
    const amount = Number(qty);
    const normalizedType = normalizeAdjustmentType(type);

    if (!isValidId(productId) || !normalizedType || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'product_id, type, and qty are required' });
    }
    if (!String(note || '').trim()) {
      return res.status(400).json({ success: false, message: 'note is required for adjustment' });
    }

    await conn.beginTransaction();
    const currentStock = await model.getCurrentStock(conn, productId);
    if (normalizedType === 'OUT' && currentStock < amount) {
      const error = new Error('Stok tidak cukup untuk adjustment keluar');
      error.statusCode = 409;
      throw error;
    }

    await model.createInventoryTransaction(conn, {
      product_id: productId,
      type: normalizedType,
      qty: amount,
      reference_id: null,
      reference_type: 'ADJUSTMENT',
      note: String(note).trim(),
    });

    await conn.commit();
    res.status(201).json({ success: true, data: { product_id: productId, type: normalizedType, qty: amount }, message: 'Adjustment created' });
  } catch (err) {
    await conn.rollback();
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
