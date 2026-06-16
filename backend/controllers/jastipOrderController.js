const model = require("../models/jastipOrderModel");

exports.getAll = async (req, res) => {
  try {
    const [data] = await model.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMemberOrders = async (req, res) => {
  try {
    const [data] = await model.getByMemberId(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
