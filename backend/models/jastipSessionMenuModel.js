const db = require("../config/db");

exports.getBySessionId = (sessionId) =>
  db.promise().query(
    `SELECT jsm.id,
            jsm.session_id,
            jsm.menu_id,
            jsm.notes,
            m.name AS menu_name,
            m.base_price,
            m.jastip_price,
            m.is_active,
            v.name AS vendor_name
     FROM jastip_session_menus jsm
     INNER JOIN menus m ON jsm.menu_id = m.id
     LEFT JOIN vendors v ON m.vendor_id = v.id
     WHERE jsm.session_id = ?
     ORDER BY m.name ASC`,
    [sessionId],
  );

exports.findExistingMenu = async (sessionId, menuId) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT id, notes FROM jastip_session_menus WHERE session_id = ? AND menu_id = ? LIMIT 1",
      [sessionId, menuId],
    );
  return rows[0] || null;
};

exports.insertMenu = (data) =>
  db.promise().query("INSERT INTO jastip_session_menus SET ?", {
    session_id: data.session_id,
    menu_id: data.menu_id,
    notes: data.notes || null,
  });

exports.updateMenuNotes = (id, notes) =>
  db.promise().query("UPDATE jastip_session_menus SET notes = ? WHERE id = ?", [notes || null, id]);

exports.removeMenu = (id) =>
  db.promise().query("DELETE FROM jastip_session_menus WHERE id = ?", [id]);
