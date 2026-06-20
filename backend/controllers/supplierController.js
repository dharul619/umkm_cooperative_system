const model = require('../models/supplierModel');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await model.getAll();
    res.json({ success: true, data: rows, message: 'Suppliers fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await model.getById(req.params.id);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: rows[0], message: 'Supplier fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, address, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    const [result] = await model.create({ name, phone, address, is_active });
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Supplier created',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, address, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    const [result] = await model.update(req.params.id, { name, phone, address, is_active });
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await model.softDelete(req.params.id);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
