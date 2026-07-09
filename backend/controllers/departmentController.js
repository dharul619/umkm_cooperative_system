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
  try {
    const { id } = req.params;

    // Check referential integrity
    const refCount = await model.getReferenceCount(id);

    if (!refCount.canDelete) {
      return res.status(409).json({
        success: false,
        message: `Tidak dapat menghapus departemen. Sedang digunakan oleh ${refCount.referenceCount} user(s).`,
      });
    }

    await model.delete(id);
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    console.error("delete department error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
