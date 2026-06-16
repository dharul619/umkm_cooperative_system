const crypto = require("crypto");
const db = require("../config/db");

const buildPaymentSelect = `SELECT p.id,
       p.order_id,
       p.member_id,
       p.amount,
       p.currency,
       p.payment_method,
       p.state,
       p.external_reference,
       p.expires_at,
       p.paid_at,
       p.webhook_delivered,
       p.webhook_attempts,
       p.created_at,
       p.updated_at,
       jo.order_date,
       jo.status AS session_status,
       u.name AS member_name
FROM payments p
INNER JOIN jastip_orders jo ON p.order_id = jo.id
LEFT JOIN users u ON p.member_id = u.id`;

exports.getByMemberAndOrder = async (memberId, orderId) => {
  const [rows] = await db.promise().query(
    `${buildPaymentSelect}
     WHERE p.member_id = ? AND p.order_id = ?
     ORDER BY p.created_at DESC
     LIMIT 1`,
    [memberId, orderId],
  );
  return rows[0] || null;
};

exports.getByMember = async (memberId) => {
  const [rows] = await db.promise().query(
    `${buildPaymentSelect}
     WHERE p.member_id = ?
     ORDER BY p.created_at DESC`,
    [memberId],
  );
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await db.promise().query(
    `${buildPaymentSelect}
     WHERE p.id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

exports.create = async ({ order_id, member_id, amount, payment_method, state, external_reference, expires_at }) => {
  return db.promise().query("INSERT INTO payments SET ?", {
    id: crypto.randomUUID(),
    order_id,
    member_id,
    amount,
    currency: "IDR",
    payment_method,
    state,
    external_reference,
    expires_at,
    paid_at: null,
    webhook_delivered: 0,
    webhook_attempts: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });
};

exports.updateState = async (id, { state, paid_at = null, webhook_delivered = 0, webhook_attempts = 0 }) => {
  return db.promise().query(
    "UPDATE payments SET state = ?, paid_at = ?, webhook_delivered = ?, webhook_attempts = ?, updated_at = NOW() WHERE id = ?",
    [state, paid_at, webhook_delivered, webhook_attempts, id],
  );
};
