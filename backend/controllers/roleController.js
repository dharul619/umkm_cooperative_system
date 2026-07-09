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
  try {
    const { id } = req.params;

    // Check referential integrity
    const refCount = await model.getReferenceCount(id);

    if (!refCount.canDelete) {
      return res.status(409).json({
        success: false,
        message: `Tidak dapat menghapus role. Sedang digunakan oleh ${refCount.referenceCount} user(s).`,
      });
    }

    await model.delete(id);
    res.json({ success: true, message: "Role deleted" });
  } catch (err) {
    console.error("delete role error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
