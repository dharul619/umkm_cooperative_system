const model = require("../models/menuModel");

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
    // Auto-set base_price = jastip_price
    // Profit sekarang murni dari operational fee, bukan dari selisih harga
    const payload = { ...req.body };
    if (payload.jastip_price !== undefined) {
      payload.base_price = Number(payload.jastip_price);
    }

    await model.create(payload);
    res.json({ message: "Menu created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    // Auto-set base_price = jastip_price saat update
    const payload = { ...req.body };
    if (payload.jastip_price !== undefined) {
      payload.base_price = Number(payload.jastip_price);
    }

    await model.update(req.params.id, payload);
    res.json({ message: "Menu updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.json({ message: "Menu deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
