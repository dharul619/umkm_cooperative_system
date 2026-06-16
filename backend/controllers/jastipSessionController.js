const sessionModel = require("../models/jastipSessionModel");
const sessionMenuModel = require("../models/jastipSessionMenuModel");
const orderModel = require("../models/jastipOrderModel");

exports.getAll = async (req, res) => {
  try {
    const [data] = await sessionModel.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [data] = await sessionModel.getById(req.params.id);
    res.json(data[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOpenSession = async (req, res) => {
  try {
    const [data] = await sessionModel.getOpenSession();
    res.json(data[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMemberSessions = async (req, res) => {
  try {
    const [data] = await sessionModel.getMemberSessions(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.order_date) {
      return res.status(400).json({ message: "order_date harus diisi" });
    }

    const payload = {
      order_date: req.body.order_date,
      coordinator_id: req.user.id,
      total_amount: 0,
      total_profit: 0,
      coordinator_share: 0,
      koperasi_share: 0,
      payment_status: "UNPAID",
      status: "OPEN",
      created_at: new Date(),
    };

    const result = await sessionModel.create(payload);
    res.json({
      message: "Jastip session created",
      id: result[0].insertId,
    });
  } catch (err) {
    console.error("Error creating jastip session:", err);
    res.status(500).json({ message: err.message || "Gagal membuat sesi jastip" });
  }
};

exports.createWithMenus = async (req, res) => {
  try {
    const { order_date, menus = [] } = req.body;
    if (!order_date) {
      return res.status(400).json({ message: "order_date harus diisi" });
    }

    const sessionId = await sessionModel.createSessionWithMenus({
      order_date,
      coordinator_id: req.user.id,
      menus,
    });

    res.json({ message: "Sesi jastip berhasil dibuat", id: sessionId });
  } catch (err) {
    console.error("createWithMenus error:", err);
    res.status(500).json({ message: err.message || "Gagal membuat sesi jastip" });
  }
};

exports.closeSession = async (req, res) => {
  try {
    await sessionModel.closeSession(req.params.id);
    res.json({ message: "Jastip session closed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMemberSessionMenus = async (req, res) => {
  try {
    const [data] = await sessionMenuModel.getBySessionId(req.params.sessionId);
    res.json(data);
  } catch (err) {
    console.error("getMemberSessionMenus error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.createMemberOrder = async (req, res) => {
  try {
    const { session_id, items } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: "session_id harus diisi" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items harus berisi minimal satu menu" });
    }

    const result = await orderModel.createMemberOrder({
      session_id: Number(session_id),
      member_id: req.user.id,
      items,
    });

    res.json({
      message: "Order berhasil dibuat",
      session_id: Number(session_id),
      items: result,
    });
  } catch (err) {
    console.error("createMemberOrder error:", err);
    res.status(500).json({ message: err.message || "Gagal membuat order" });
  }
};
exports.getMyOrders = async (req, res) => {
  try {
    const [data] = await orderModel.getByMemberId(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ message: err.message });
  }
};



