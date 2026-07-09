const sessionModel = require("../models/jastipSessionModel");
const sessionMenuModel = require("../models/jastipSessionMenuModel");
const orderModel = require("../models/jastipOrderModel");
const paymentModel = require("../models/paymentModel");
const vendorOrderController = require("./vendorOrderController");

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
    const sessionId = req.params.id;
    const [rows] = await sessionModel.getById(sessionId);
    const session = rows[0];
    if (!session) {
      return res.status(404).json({ message: "Sesi tidak ditemukan" });
    }

    if (session.status !== "OPEN") {
      return res.status(400).json({ message: "Sesi sudah tidak OPEN" });
    }

    if (Number(session.order_count || 0) === 0) {
      return res.status(400).json({ message: "Tidak bisa menutup sesi karena belum ada pesanan member" });
    }

    // Check for failed/expired payments
    const failedPayments = await paymentModel.getFailedPaymentsBySessionId(sessionId);
    if (failedPayments.length > 0) {
      const memberNames = failedPayments.map(p => p.member_name || `Member #${p.member_id}`).join(", ");
      return res.status(400).json({
        message: `Tidak bisa menutup sesi. Ada ${failedPayments.length} pembayaran yang gagal/expired: ${memberNames}. Harap selesaikan pembayaran terlebih dahulu.`,
        failedPayments: failedPayments.length,
      });
    }

    await sessionModel.updateStatus(sessionId, "CONFIRMED");
    // Generate vendor orders
    await vendorOrderController.generateVendorOrdersInternal(sessionId);

    res.json({ message: "Sesi jastip berhasil ditutup dan rekap vendor telah digenerate" });
  } catch (err) {
    console.error("closeSession error:", err);
    res.status(500).json({ message: err.message || "Gagal menutup sesi jastip" });
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

exports.updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["OPEN", "CONFIRMED", "ORDERED", "DELIVERED", "DONE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    const [rows] = await sessionModel.getById(id);
    const session = rows[0];
    if (!session) {
      return res.status(404).json({ message: "Sesi tidak ditemukan" });
    }

    const currentStatus = session.status;
    let allowed = false;

    if (currentStatus === "OPEN" && (status === "CONFIRMED" || status === "CANCELLED")) allowed = true;
    else if (currentStatus === "CONFIRMED" && (status === "ORDERED" || status === "CANCELLED")) allowed = true;
    else if (currentStatus === "ORDERED" && (status === "DELIVERED" || status === "CANCELLED")) allowed = true;
    else if (currentStatus === "DELIVERED" && (status === "DONE")) allowed = true;

    if (!allowed) {
      return res.status(400).json({ message: `Transisi status tidak sah dari ${currentStatus} ke ${status}` });
    }

    if (status === "CONFIRMED") {
      if (Number(session.order_count || 0) === 0) {
        return res.status(400).json({ message: "Tidak bisa menutup sesi karena belum ada pesanan member" });
      }
      // Check for failed/expired payments before confirming
      const failedPayments = await paymentModel.getFailedPaymentsBySessionId(id);
      if (failedPayments.length > 0) {
        const memberNames = failedPayments.map(p => p.member_name || `Member #${p.member_id}`).join(", ");
        return res.status(400).json({
          message: `Tidak bisa menutup sesi. Ada ${failedPayments.length} pembayaran yang gagal/expired: ${memberNames}. Harap selesaikan pembayaran terlebih dahulu.`,
          failedPayments: failedPayments.length,
        });
      }
      await sessionModel.updateStatus(id, "CONFIRMED");
      await vendorOrderController.generateVendorOrdersInternal(id);
    } else {
      await sessionModel.updateStatus(id, status);
    }

    res.json({ message: `Status sesi berhasil diubah menjadi ${status}` });
  } catch (err) {
    console.error("updateSessionStatus error:", err);
    res.status(500).json({ message: err.message || "Gagal mengubah status sesi" });
  }
};



