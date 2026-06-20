const db = require('../config/db');
const model = require('../models/saleModel');

const isValidId = (value) => Number.isInteger(value) && value > 0;

exports.getAll = async (req, res) => {
  try {
    const [rows] = await model.getAll();
    res.json({ success: true, data: rows, message: 'Sales fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [saleRows] = await model.getById(req.params.id);
    if (!saleRows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    const [detailRows] = await model.getDetailsBySaleId(req.params.id);
    res.json({ success: true, data: { sale: saleRows[0], details: detailRows }, message: 'Sale fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const { sale_date, items } = req.body;
    const operatorId = req.user?.id;

    if (!sale_date || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'sale_date and items are required' });
    }
    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const normalizedItems = [];
    for (const item of items) {
      const barcode = String(item.barcode || '').trim();
      const qty = Number(item.qty);

      if (!barcode || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Each item must have valid barcode and qty' });
      }

      normalizedItems.push({ barcode, qty });
    }

    await conn.beginTransaction();

    let totalAmount = 0;
    let totalProfit = 0;
    const saleDetails = [];

    for (const item of normalizedItems) {
      const [productRows] = await model.getProductByBarcode(conn, item.barcode);
      if (!productRows.length) {
        const error = new Error(`Product with barcode ${item.barcode} not found`);
        error.statusCode = 404;
        throw error;
      }

      const product = productRows[0];
      const stock = await model.getStockByProductId(conn, product.id);
      if (Number(stock) < item.qty) {
        const error = new Error(`Stok produk ${product.name} tidak cukup`);
        error.statusCode = 409;
        throw error;
      }

      const sellingPrice = Number(product.selling_price || 0);
      const costPrice = Number(product.cost_price || 0);
      const subtotal = item.qty * sellingPrice;
      const profit = (sellingPrice - costPrice) * item.qty;

      totalAmount += subtotal;
      totalProfit += profit;
      saleDetails.push({
        product_id: product.id,
        qty: item.qty,
        price: sellingPrice,
        cost_price: costPrice,
        subtotal,
      });
    }

    const coordinatorShare = Math.floor(totalProfit * 0.2);
    const koperasiShare = totalProfit - coordinatorShare;

    const [saleResult] = await model.createSale(conn, {
      sale_date,
      operator_id: operatorId,
      total_amount: totalAmount,
      total_profit: totalProfit,
      coordinator_share: coordinatorShare,
      koperasi_share: koperasiShare,
    });
    const saleId = saleResult.insertId;

    for (const item of saleDetails) {
      await model.createDetail(conn, {
        sale_id: saleId,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        cost_price: item.cost_price,
        subtotal: item.subtotal,
      });

      await model.createInventoryTransaction(conn, {
        product_id: item.product_id,
        type: 'OUT',
        qty: item.qty,
        reference_id: saleId,
        reference_type: 'SALE',
        note: null,
      });
    }

    await conn.commit();

    const [saleRows] = await model.getById(saleId);
    const [detailRows] = await model.getDetailsBySaleId(saleId);

    res.status(201).json({
      success: true,
      data: {
        sale: saleRows[0] || null,
        details: detailRows,
      },
      message: 'Sale created',
    });
  } catch (err) {
    await conn.rollback();
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
