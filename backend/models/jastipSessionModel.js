const db = require("../config/db");

const sessionSelect = `SELECT jo.id,
            jo.order_date,
            jo.coordinator_id,
            jo.total_amount,
            jo.total_profit,
            jo.coordinator_share,
            jo.koperasi_share,
            jo.payment_status,
            jo.status,
            jo.created_at,
            u.name AS coordinator_name,
            (
              SELECT COUNT(*)
              FROM jastip_order_details jod
              WHERE jod.order_id = jo.id
            ) AS order_count,
            (
              SELECT COUNT(DISTINCT m.vendor_id)
              FROM jastip_session_menus jsm
              INNER JOIN menus m ON jsm.menu_id = m.id
              WHERE jsm.session_id = jo.id
            ) AS vendor_count,
            (
              SELECT COUNT(*)
              FROM jastip_session_menus jsm
              WHERE jsm.session_id = jo.id
            ) AS menu_count
     FROM jastip_orders jo
     LEFT JOIN users u ON jo.coordinator_id = u.id`;

exports.getAll = () =>
  db.promise().query(
    `${sessionSelect}
     ORDER BY jo.created_at DESC`,
  );

exports.getById = (id) =>
  db.promise().query(
    `${sessionSelect}
     WHERE jo.id = ?
     LIMIT 1`,
    [id],
  );

exports.getOpenSession = () =>
  db.promise().query(
    `${sessionSelect}
     WHERE jo.status = 'OPEN'
     ORDER BY jo.created_at DESC
     LIMIT 1`,
  );

exports.getMemberSessions = () =>
  db.promise().query(
    `${sessionSelect}
     WHERE jo.status IN ('OPEN', 'CONFIRMED', 'ORDERED', 'DELIVERED', 'DONE')
       AND EXISTS (
         SELECT 1
         FROM jastip_session_menus jsm
         WHERE jsm.session_id = jo.id
       )
     ORDER BY jo.created_at DESC`,
  );

exports.create = (data) =>
  db.promise().query("INSERT INTO jastip_orders SET ?", data);

exports.closeSession = (id) =>
  db.promise().query("UPDATE jastip_orders SET status = 'CONFIRMED' WHERE id = ? AND status = 'OPEN'", [id]);

exports.createSessionWithMenus = async ({ order_date, coordinator_id, menus }) => {
  if (!Array.isArray(menus) || menus.length === 0) {
    throw new Error("Minimal satu menu harus ditambahkan ke session");
  }

  const [sessionResult] = await db.promise().query(
    "INSERT INTO jastip_orders SET ?",
    {
      order_date,
      coordinator_id,
      total_amount: 0,
      total_profit: 0,
      coordinator_share: 0,
      koperasi_share: 0,
      payment_status: "UNPAID",
      status: "OPEN",
      created_at: new Date(),
    },
  );

  const sessionId = sessionResult.insertId;

  for (const menu of menus) {
    const menuId = Number(menu?.menu_id);
    if (!menuId) {
      throw new Error("menu_id tidak valid");
    }

    const [menuRows] = await db.promise().query(
      "SELECT id FROM menus WHERE id = ? LIMIT 1",
      [menuId],
    );

    if (menuRows.length === 0) {
      throw new Error(`Menu ${menuId} tidak ditemukan`);
    }

    await db.promise().query("INSERT INTO jastip_session_menus SET ?", {
      session_id: sessionId,
      menu_id: menuId,
      notes: menu.notes || null,
    });
  }

  return sessionId;
};
