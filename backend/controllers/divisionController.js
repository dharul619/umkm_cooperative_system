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
  try {
    const { id } = req.params;

    // Check referential integrity
    const refCount = await model.getReferenceCount(id);

    if (!refCount.canDelete) {
      return res.status(409).json({
        success: false,
        message: `Tidak dapat menghapus divisi. Sedang digunakan oleh ${refCount.referenceCount} user(s).`,
      });
    }

    await model.delete(id);
    res.json({ success: true, message: "Division deleted" });
  } catch (err) {
    console.error("delete division error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
