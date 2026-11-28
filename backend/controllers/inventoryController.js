const db = require('../config/db');
const model = require('../models/inventoryModel');
const activityLogModel = require('../models/activityLogModel');

const VALID_REFERENCE_TYPES = ['BEGINNING', 'PURCHASE', 'SALE', 'SALE_VOID', 'SALE_RETURN', 'ADJUSTMENT'];

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

    const rawReferenceType = String(req.query.reference_type || '').trim().toUpperCase();
    if (rawReferenceType && !VALID_REFERENCE_TYPES.includes(rawReferenceType)) {
      return res.status(400).json({ success: false, message: 'reference_type tidak valid' });
    }

    const [productRows] = await model.getProductById(productId);
    if (!productRows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [[rows], [countRows], currentStock] = await Promise.all([
      model.getStockCard(productId, { limit, offset, referenceType: rawReferenceType }),
      model.getStockCardCount(productId, { referenceType: rawReferenceType }),
      model.getCurrentStockByPool(productId),
    ]);
    const total = Number(countRows?.[0]?.total || 0);

    res.json({
      success: true,
      data: {
        product: {
          ...productRows[0],
          current_stock: currentStock,
        },
        transactions: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
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

    const [productRows] = await model.getProductById(productId);
    const product = productRows[0];
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    await conn.beginTransaction();
    const alreadyExists = await model.hasBeginningStock(conn, productId);
    if (alreadyExists) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Stok awal produk ini sudah pernah dicatat. Gunakan menu Adjustment.',
      });
    }

    const cleanNote = String(note || '').trim() || 'Stok awal';
    await model.createInventoryTransaction(conn, {
      product_id: productId,
      type: 'IN',
      qty: amount,
      reference_id: null,
      reference_type: 'BEGINNING',
      note: cleanNote,
    });
    await conn.commit();

    const unitSuffix = product.unit ? ` ${product.unit}` : '';
    await activityLogModel.log(
      req.user?.id,
      `Stok awal ${product.name}: +${amount}${unitSuffix} (${cleanNote})`,
    );

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
    const cleanNote = String(note || '').trim();
    if (!cleanNote) {
      return res.status(400).json({ success: false, message: 'note is required for adjustment' });
    }

    const [productRows] = await model.getProductById(productId);
    const product = productRows[0];
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
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
      note: cleanNote,
    });

    await conn.commit();

    const unitSuffix = product.unit ? ` ${product.unit}` : '';
    const sign = normalizedType === 'IN' ? '+' : '-';
    await activityLogModel.log(
      req.user?.id,
      `Adjustment stok ${product.name} (${sign}${amount}${unitSuffix}): ${cleanNote}`,
    );

    res.status(201).json({ success: true, data: { product_id: productId, type: normalizedType, qty: amount }, message: 'Adjustment created' });
  } catch (err) {
    await conn.rollback();
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
