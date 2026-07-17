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
            ) AS menu_count,
            (
              SELECT COUNT(*)
              FROM payments p
              WHERE p.order_id = jo.id AND p.state IN ('FAILED', 'EXPIRED')
            ) AS failed_payment_count
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

exports.updateStatus = (id, status) =>
  db.promise().query("UPDATE jastip_orders SET status = ? WHERE id = ?", [status, id]);

exports.getCoordinatorActiveSession = () =>
  db.promise().query(
    `SELECT jo.*, 
            u.name as coordinator_name,
            (SELECT COUNT(*) FROM jastip_order_details jod WHERE jod.order_id = jo.id) as total_items_ordered,
            (SELECT COUNT(DISTINCT jod.user_id) FROM jastip_order_details jod WHERE jod.order_id = jo.id) as total_members_ordered
     FROM jastip_orders jo
     LEFT JOIN users u ON jo.coordinator_id = u.id
     WHERE jo.status IN ('OPEN', 'CONFIRMED', 'ORDERED', 'DELIVERED')
     ORDER BY jo.created_at DESC
     LIMIT 1`
  );

exports.getCoordinatorStatsSummary = async (coordinatorId) => {
  const [sessionsCount] = await db.promise().query(
    "SELECT COUNT(*) as count FROM jastip_orders WHERE coordinator_id = ?",
    [coordinatorId]
  );
  
  const [earnings] = await db.promise().query(
    `SELECT SUM(coordinator_share) as sum 
     FROM jastip_orders 
     WHERE coordinator_id = ? 
       AND status = 'DONE'
       AND MONTH(order_date) = MONTH(CURDATE())
       AND YEAR(order_date) = YEAR(CURDATE())`,
    [coordinatorId]
  );
  
  const [pendingPayments] = await db.promise().query(
    `SELECT COUNT(*) as count 
     FROM payments p 
     INNER JOIN jastip_orders jo ON p.order_id = jo.id 
     WHERE jo.coordinator_id = ? AND p.state = 'PENDING'`,
    [coordinatorId]
  );

  const [membersServed] = await db.promise().query(
    `SELECT COUNT(DISTINCT jod.user_id) as count 
     FROM jastip_order_details jod 
     INNER JOIN jastip_orders jo ON jod.order_id = jo.id 
     WHERE jo.coordinator_id = ?`,
    [coordinatorId]
  );

  return {
    total_sessions: sessionsCount[0]?.count || 0,
    total_earnings: Number(earnings[0]?.sum || 0),
    pending_payments: pendingPayments[0]?.count || 0,
    total_members_served: membersServed[0]?.count || 0,
  };
};

exports.getCoordinatorRecentSessions = (coordinatorId) =>
  db.promise().query(
    `SELECT jo.*,
            (SELECT COUNT(*) FROM jastip_order_details jod WHERE jod.order_id = jo.id) as order_count
     FROM jastip_orders jo 
     WHERE jo.coordinator_id = ? 
     ORDER BY jo.created_at DESC 
     LIMIT 5`,
    [coordinatorId]
  );

exports.getCoordinatorPendingPayments = (coordinatorId) =>
  db.promise().query(
    `SELECT p.id as payment_id, p.amount, p.payment_method, p.state, p.created_at,
            u.name as member_name, u.username as member_username,
            jo.id as session_id, jo.order_date
     FROM payments p
     INNER JOIN users u ON p.member_id = u.id
     INNER JOIN jastip_orders jo ON p.order_id = jo.id
     WHERE jo.coordinator_id = ? AND p.state = 'PENDING'
     ORDER BY p.created_at DESC
     LIMIT 5`,
    [coordinatorId]
  );

exports.getCoordinatorActiveSessionOrdersByDivision = (sessionId) =>
  db.promise().query(
    `SELECT d.name as name, SUM(jod.qty) as value
     FROM jastip_order_details jod
     INNER JOIN users u ON jod.user_id = u.id
     LEFT JOIN divisions d ON u.division_id = d.id
     WHERE jod.order_id = ?
     GROUP BY d.name
     ORDER BY value DESC`,
    [sessionId]
  );

exports.getCoordinatorActiveSessionOrdersByVendor = (sessionId) =>
  db.promise().query(
    `SELECT v.name as name, SUM(jod.qty) as value
     FROM jastip_order_details jod
     INNER JOIN menus m ON jod.menu_id = m.id
     INNER JOIN vendors v ON m.vendor_id = v.id
     WHERE jod.order_id = ?
     GROUP BY v.name
     ORDER BY value DESC`,
    [sessionId]
  );

exports.getCoordinatorActiveSessionPaymentSummary = (sessionId) =>
  db.promise().query(
    `SELECT p.state as name, COUNT(*) as value
     FROM payments p
     WHERE p.order_id = ?
     GROUP BY p.state`,
    [sessionId]
  );

exports.getCoordinatorActiveSessionOrderDetails = (sessionId) =>
  db.promise().query(
    `SELECT jod.id, u.name as member_name, m.name as menu_name, v.name as vendor_name, 
            jod.qty, jod.price, jod.subtotal, jod.created_at,
            p.state as payment_state, p.payment_method
     FROM jastip_order_details jod
     INNER JOIN users u ON jod.user_id = u.id
     INNER JOIN menus m ON jod.menu_id = m.id
     INNER JOIN vendors v ON m.vendor_id = v.id
     LEFT JOIN payments p ON jod.order_id = p.order_id AND jod.user_id = p.member_id
     WHERE jod.order_id = ?
     ORDER BY jod.created_at DESC`,
    [sessionId]
  );

exports.getCoordinatorJastipSalesTrend = (days = 30) =>
  db.promise().query(
    `SELECT DATE_FORMAT(jo.order_date, '%Y-%m-%d') as date,
            COALESCE(SUM(jo.total_amount), 0) as sales
     FROM jastip_orders jo
     WHERE jo.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND jo.status != 'CANCELLED'
     GROUP BY DATE(jo.order_date)
     ORDER BY date ASC`,
    [days]
  );
