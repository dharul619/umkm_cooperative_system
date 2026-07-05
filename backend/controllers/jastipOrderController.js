const model = require("../models/jastipOrderModel");
const db = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const [data] = await model.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMemberOrders = async (req, res) => {
  try {
    const [data] = await model.getByMemberId(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMemberOrderDetail = async (req, res) => {
  const connection = db.promise();
  try {
    const { id } = req.params;
    const { qty } = req.body;
    const newQty = Number(qty);
    if (!newQty || newQty <= 0) {
      return res.status(400).json({ message: "Quantity harus lebih dari 0" });
    }

    const detail = await model.getOrderDetailById(id);
    if (!detail) {
      return res.status(404).json({ message: "Detail pesanan tidak ditemukan" });
    }

    if (String(detail.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Anda tidak berhak mengubah detail pesanan ini" });
    }

    if (detail.session_status !== "OPEN") {
      return res.status(400).json({ message: "Sesi sudah ditutup, tidak bisa mengubah pesanan" });
    }

    // Check payment status
    const payment = await model.getMemberOrderPayment(req.user.id, detail.order_id);
    if (payment && ["SETTLED", "PROCESSING"].includes(payment.state)) {
      return res.status(400).json({ message: "Pembayaran sedang diproses atau sudah lunas, tidak bisa mengubah pesanan" });
    }

    const newSubtotal = detail.price * newQty;
    await model.updateOrderDetail(id, newQty, newSubtotal);

    // Re-distribute profit & aggregates
    await model.redistributeMemberProfit(connection, detail.order_id, req.user.id);
    await model.updateSessionAggregates(connection, detail.order_id);
    await model.updateOrderPaymentStatus(detail.order_id);

    // Update payment amount if exists and is PENDING
    if (payment && payment.state === "PENDING") {
      const [sumRows] = await connection.query(
        "SELECT SUM(subtotal) AS total_amount FROM jastip_order_details WHERE order_id = ? AND user_id = ?",
        [detail.order_id, req.user.id]
      );
      const totalAmount = Number(sumRows?.[0]?.total_amount || 0) + 2000;
      await model.updatePaymentAmount(payment.id, totalAmount);
    }

    res.json({ message: "Pesanan berhasil diubah" });
  } catch (err) {
    console.error("updateMemberOrderDetail error:", err);
    res.status(500).json({ message: err.message || "Gagal mengubah pesanan" });
  }
};

exports.deleteMemberOrderDetail = async (req, res) => {
  const connection = db.promise();
  try {
    const { id } = req.params;

    const detail = await model.getOrderDetailById(id);
    if (!detail) {
      return res.status(404).json({ message: "Detail pesanan tidak ditemukan" });
    }

    if (String(detail.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Anda tidak berhak menghapus detail pesanan ini" });
    }

    if (detail.session_status !== "OPEN") {
      return res.status(400).json({ message: "Sesi sudah ditutup, tidak bisa menghapus pesanan" });
    }

    // Check payment status
    const payment = await model.getMemberOrderPayment(req.user.id, detail.order_id);
    if (payment && ["SETTLED", "PROCESSING"].includes(payment.state)) {
      return res.status(400).json({ message: "Pembayaran sedang diproses atau sudah lunas, tidak bisa menghapus pesanan" });
    }

    await model.deleteOrderDetail(id);

    // Re-distribute profit & aggregates
    await model.redistributeMemberProfit(connection, detail.order_id, req.user.id);
    await model.updateSessionAggregates(connection, detail.order_id);
    await model.updateOrderPaymentStatus(detail.order_id);

    // Update or delete payment if no items left
    const [sumRows] = await connection.query(
      "SELECT SUM(subtotal) AS total_amount FROM jastip_order_details WHERE order_id = ? AND user_id = ?",
      [detail.order_id, req.user.id]
    );
    const totalAmount = Number(sumRows?.[0]?.total_amount || 0);

    if (payment) {
      if (totalAmount === 0) {
        // No items left, delete payment
        await model.deletePayment(payment.id);
      } else if (payment.state === "PENDING") {
        await model.updatePaymentAmount(payment.id, totalAmount + 2000);
      }
    }

    res.json({ message: "Pesanan berhasil dihapus" });
  } catch (err) {
    console.error("deleteMemberOrderDetail error:", err);
    res.status(500).json({ message: err.message || "Gagal menghapus pesanan" });
  }
};
