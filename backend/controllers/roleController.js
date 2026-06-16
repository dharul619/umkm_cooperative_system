const model = require("../models/roleModel");

exports.getAll = async (req, res) => {
  const [data] = await model.getAll();
  res.json(data);
};

exports.create = async (req, res) => {
  await model.create(req.body);
  res.json({ message: "Role created" });
};

exports.update = async (req, res) => {
  await model.update(req.params.id, req.body);
  res.json({ message: "Role updated" });
};

exports.delete = async (req, res) => {
  await model.delete(req.params.id);
  res.json({ message: "Role deleted" });
};
