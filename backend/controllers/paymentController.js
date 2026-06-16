const model = require("../models/paymentModel");
const orderModel = require("../models/jastipOrderModel");

const PAYMENT_METHODS = ["CASH", "QRIS"];

const normalizePaymentMethod = (value) => String(value || "").toUpperCase();

const loadMemberOrderItems = async (memberId, orderId) => {
  const [rows] = await orderModel.getByMemberId(memberId);
  return rows.filter((row) => String(row.order_id) === String(orderId));
};

exports.getMyPayments = async (req, res) => {
  try {
    const data = await model.getByMember(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("getMyPayments error:", err);
    res.status(500).json({ message: err.message || "Gagal mengambil payment" });
  }
};

exports.getPaymentByOrder = async (req, res) => {
  try {
    const data = await model.getByMemberAndOrder(req.user.id, req.params.orderId);
    res.json(data || null);
  } catch (err) {
    console.error("getPaymentByOrder error:", err);
    res.status(500).json({ message: err.message || "Gagal mengambil payment" });
  }
};

exports.createMockPayment = async (req, res) => {
  try {
    const { order_id, payment_method, amount } = req.body;
    const normalizedMethod = normalizePaymentMethod(payment_method);

    if (!order_id || !payment_method) {
      return res.status(400).json({ message: "order_id dan payment_method harus diisi" });
    }

    if (!PAYMENT_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({ message: "payment_method hanya boleh CASH atau QRIS" });
    }

    const existing = await model.getByMemberAndOrder(req.user.id, order_id);
    if (existing) {
      return res.status(409).json({ message: "Payment untuk order ini sudah ada" });
    }

    const targetRows = await loadMemberOrderItems(req.user.id, order_id);
    if (!targetRows.length) {
      return res.status(404).json({ message: "Order tidak ditemukan pada akun ini" });
    }

    const totalAmount = targetRows.reduce((sum, row) => sum + Number(row.subtotal || 0), 0);
    const safeAmount = Number(amount || totalAmount);
    const externalReference = `JASTIP-${order_id}-${req.user.id}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const result = await model.create({
      order_id: Number(order_id),
      member_id: req.user.id,
      amount: safeAmount,
      payment_method: normalizedMethod,
      state: normalizedMethod === "CASH" ? "PENDING" : "PROCESSING",
      external_reference: externalReference,
      expires_at: expiresAt,
    });

    res.json({
      message: "Mock payment created",
      id: result[0].insertId,
      payment_method: normalizedMethod,
      amount: safeAmount,
      external_reference: externalReference,
      expires_at: expiresAt,
      state: normalizedMethod === "CASH" ? "PENDING" : "PROCESSING",
    });
  } catch (err) {
    console.error("createMockPayment error:", err);
    res.status(500).json({ message: err.message || "Gagal membuat payment" });
  }
};

exports.settleMockPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await model.getById(id);

    if (!payment || String(payment.member_id) !== String(req.user.id)) {
      return res.status(404).json({ message: "Payment tidak ditemukan pada akun ini" });
    }

    if (payment.payment_method === "CASH") {
      return res.status(400).json({ message: "Payment tunai harus dikonfirmasi coordinator" });
    }

    await model.updateState(id, {
      state: "SETTLED",
      paid_at: new Date(),
      webhook_delivered: 1,
      webhook_attempts: 1,
    });
    res.json({ message: "Payment settled" });
  } catch (err) {
    console.error("settleMockPayment error:", err);
    res.status(500).json({ message: err.message || "Gagal menyelesaikan payment" });
  }
};

exports.failMockPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await model.getById(id);

    if (!payment || String(payment.member_id) !== String(req.user.id)) {
      return res.status(404).json({ message: "Payment tidak ditemukan pada akun ini" });
    }

    await model.updateState(id, {
      state: "FAILED",
      paid_at: null,
      webhook_delivered: 0,
      webhook_attempts: 1,
    });
    res.json({ message: "Payment failed" });
  } catch (err) {
    console.error("failMockPayment error:", err);
    res.status(500).json({ message: err.message || "Gagal mengubah payment" });
  }
};
