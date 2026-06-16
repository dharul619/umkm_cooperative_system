const model = require("../models/jastipSessionMenuModel");
const sessionModel = require("../models/jastipSessionModel");

exports.getBySessionId = async (req, res) => {
  try {
    const [data] = await model.getBySessionId(req.params.sessionId);
    res.json(data);
  } catch (err) {
    console.error("getBySessionId error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.addMenu = async (req, res) => {
  try {
    const { session_id, menu_id, notes = null } = req.body;
    if (!session_id || !menu_id) {
      return res.status(400).json({ message: "session_id and menu_id are required" });
    }

    const [sessionRows] = await sessionModel.getAll();
    const session = sessionRows.find((row) => String(row.id) === String(session_id));
    if (!session) {
      return res.status(404).json({ message: "Session tidak ditemukan" });
    }

    const existing = await model.findExistingMenu(session_id, menu_id);
    if (existing) {
      return res.status(409).json({
        message: "Menu already exists in session",
        existing,
        requiresUpdate: true,
      });
    }

    await model.insertMenu({ session_id, menu_id, notes });
    res.json({ message: "Menu added to session" });
  } catch (err) {
    console.error("addMenu error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { notes = null } = req.body;
    await model.updateMenuNotes(req.params.id, notes);
    res.json({ message: "Menu updated" });
  } catch (err) {
    console.error("updateMenu error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.removeMenu = async (req, res) => {
  try {
    await model.removeMenu(req.params.id);
    res.json({ message: "Menu removed from session" });
  } catch (err) {
    console.error("removeMenu error:", err);
    res.status(500).json({ message: err.message });
  }
};
