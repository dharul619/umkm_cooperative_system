const db = require("../config/db");

exports.getBySessionId = (sessionId) => {
  return db.promise().query(
    `SELECT vo.*, v.name AS vendor_name, v.phone AS vendor_phone
     FROM vendor_orders vo
     LEFT JOIN vendors v ON vo.vendor_id = v.id
     WHERE vo.jastip_order_id = ?
     ORDER BY v.name ASC`,
    [sessionId]
  );
};

exports.getById = async (id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM vendor_orders WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

exports.upsert = async ({ jastip_order_id, vendor_id, order_summary }) => {
  const connection = db.promise();
  const [existing] = await connection.query(
    "SELECT id FROM vendor_orders WHERE jastip_order_id = ? AND vendor_id = ? LIMIT 1",
    [jastip_order_id, vendor_id]
  );
  
  if (existing.length > 0) {
    const id = existing[0].id;
    await connection.query(
      "UPDATE vendor_orders SET order_summary = ? WHERE id = ?",
      [order_summary, id]
    );
    return id;
  } else {
    const [result] = await connection.query(
      "INSERT INTO vendor_orders SET ?",
      {
        jastip_order_id,
        vendor_id,
        order_summary,
        whatsapp_status: "PENDING",
        created_at: new Date()
      }
    );
    return result.insertId;
  }
};

exports.markAsSent = (id) => {
  return db.promise().query(
    "UPDATE vendor_orders SET whatsapp_status = 'SENT', sent_at = NOW() WHERE id = ?",
    [id]
  );
};
