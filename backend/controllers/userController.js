const model = require("../models/userModel");
const bcrypt = require("bcrypt");

exports.getAll = async (req, res) => {
  try {
    const [data] = await model.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await model.create({ ...rest, password: hashed });

    res.json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    await model.update(req.params.id, payload);
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approve = async (req, res) => {
  try {
    await model.update(req.params.id, { status: "approved" });
    res.json({ message: "User approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reject = async (req, res) => {
  try {
    await model.update(req.params.id, { status: "rejected" });
    res.json({ message: "User rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
