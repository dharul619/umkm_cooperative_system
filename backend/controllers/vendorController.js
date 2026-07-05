const model = require("../models/vendorModel");

const normalizePhoneNumber = (phone) => {
  if (!phone) return phone;
  let clean = String(phone).replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
};

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
    const payload = { ...req.body };
    if (payload.phone) {
      payload.phone = normalizePhoneNumber(payload.phone);
    }
    await model.create(payload);
    res.json({ message: "Vendor created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.phone) {
      payload.phone = normalizePhoneNumber(payload.phone);
    }
    await model.update(req.params.id, payload);
    res.json({ message: "Vendor updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
