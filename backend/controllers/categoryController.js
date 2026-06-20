const model = require('../models/categoryModel');

exports.getAll = async (req, res) => {
  try {
    const [data] = await model.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    await model.create(req.body);
    res.json({ message: 'Category created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    await model.update(req.params.id, req.body);
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
