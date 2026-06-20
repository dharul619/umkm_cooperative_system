const db = require('../config/db');
const model = require('../models/purchaseModel');

const isValidId = (value) => Number.isInteger(value) && value > 0;

exports.getAll = async (req, res) => {
  try {
    const [rows] = await model.getAll();
    res.json({ success: true, data: rows, message: 'Purchases fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [purchaseRows] = await model.getById(req.params.id);
    if (!purchaseRows.length) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    const [detailRows] = await model.getDetailsByPurchaseId(req.params.id);
    res.json({ success: true, data: { purchase: purchaseRows[0], details: detailRows }, message: 'Purchase fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const [rows] = await model.getProducts();
    res.json({ success: true, data: rows, message: 'Purchase products fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const { supplier_id, purchase_date, items } = req.body;
    const normalizedSupplierId = supplier_id == null || supplier_id === '' ? null : Number(supplier_id);

    if (!isValidId(normalizedSupplierId)) {
      return res.status(400).json({ success: false, message: 'supplier_id is required' });
    }
    if (!purchase_date || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'purchase_date and items are required' });
    }

    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId = Number(item.product_id);
      const qty = Number(item.qty);
      const price = Number(item.price);

      if (!isValidId(productId) || !Number.isInteger(qty) || qty <= 0 || Number.isNaN(price) || price < 0) {
        return res.status(400).json({ success: false, message: 'Each item must have valid product_id, qty, and price' });
      }

      const subtotal = qty * price;
      totalAmount += subtotal;
      normalizedItems.push({ product_id: productId, qty, price, subtotal });
    }

    await conn.beginTransaction();

    const [purchaseResult] = await model.createPurchase(conn, { supplier_id: normalizedSupplierId, purchase_date, total_amount: totalAmount });
    const purchaseId = purchaseResult.insertId;

    for (const item of normalizedItems) {
      const [productRows] = await model.getProductById(conn, item.product_id);
      if (!productRows.length) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      await model.createDetail(conn, {
        purchase_id: purchaseId,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
      });

      await model.createInventoryTransaction(conn, {
        product_id: item.product_id,
        type: 'IN',
        qty: item.qty,
        reference_id: purchaseId,
        reference_type: 'PURCHASE',
        note: null,
      });

      await model.updateProductCostPrice(conn, item.product_id, item.price);
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: purchaseId, total_amount: totalAmount }, message: 'Purchase created' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
