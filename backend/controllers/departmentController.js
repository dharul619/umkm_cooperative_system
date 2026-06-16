const model = require("../models/departmentModel");

exports.getAll = async (req, res) => {
  const { division_id } = req.query;

  if (division_id) {
    const [data] = await model.getByDivisionId(division_id);
    res.json(data);
  } else {
    const [data] = await model.getAll();
    res.json(data);
  }
};

exports.create = async (req, res) => {
  await model.create(req.body);
  res.json({ message: "Department created" });
};

exports.update = async (req, res) => {
  await model.update(req.params.id, req.body);
  res.json({ message: "Department updated" });
};

exports.delete = async (req, res) => {
  await model.delete(req.params.id);
  res.json({ message: "Department deleted" });
};
