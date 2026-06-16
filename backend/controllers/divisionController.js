const model = require("../models/divisionModel");

exports.getAll = async (req, res) => {
  const [data] = await model.getAll();
  res.json(data);
};

exports.create = async (req, res) => {
  await model.create(req.body);
  res.json({ message: "Division Created" });
};

exports.update = async (req, res) => {
  await model.update(req.params.id, req.body);
  res.json({ message: "Division Updated" });
};

exports.delete = async (req, res) => {
  await model.delete(req.params.id);
  res.json({ message: "Division deleted" });
};
