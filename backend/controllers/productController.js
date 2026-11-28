const db = require('../config/db');
const model = require('../models/productModel');
const inventoryModel = require('../models/inventoryModel');
const activityLogModel = require('../models/activityLogModel');

exports.getAll = async (req, res) => {
  try {
    const [data] = await model.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const { beginning_stock, beginning_note, ...productData } = req.body || {};
  const hasBeginningStock =
    beginning_stock !== undefined &&
    beginning_stock !== null &&
    String(beginning_stock).trim() !== '';
  const initialQty = hasBeginningStock ? Number(beginning_stock) : 0;

  if (hasBeginningStock && (!Number.isInteger(initialQty) || initialQty < 0)) {
    return res.status(400).json({ message: 'Stok awal harus bilangan bulat >= 0' });
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    const [insertResult] = await model.createWithConnection(conn, productData);
    const newProductId = insertResult.insertId;

    if (initialQty > 0) {
      await inventoryModel.createInventoryTransaction(conn, {
        product_id: newProductId,
        type: 'IN',
        qty: initialQty,
        reference_id: null,
        reference_type: 'BEGINNING',
        note: String(beginning_note || '').trim() || 'Stok awal',
      });
    }

    await conn.commit();

    if (initialQty > 0) {
      const unitSuffix = productData.unit ? ` ${productData.unit}` : '';
      await activityLogModel.log(
        req.user?.id,
        `Stok awal ${productData.name || `Produk #${newProductId}`}: +${initialQty}${unitSuffix}`,
      );
    }

    res.status(201).json({ id: newProductId, message: 'Product created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  try {
    const { beginning_stock: _bs, beginning_note: _bn, ...productData } = req.body || {};
    await model.update(req.params.id, productData);
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
