const db = require("../config/db");

const OPERATION_FEE_PER_SESSION = 2000;

const paymentStatusExpr = `CASE
  WHEN COUNT(DISTINCT pay.id) = 0 THEN 'UNPAID'
  WHEN SUM(CASE WHEN pay.state = 'SETTLED' THEN 1 ELSE 0 END) = 0 THEN 'UNPAID'
  WHEN SUM(CASE WHEN pay.state = 'SETTLED' THEN 1 ELSE 0 END) >= COUNT(DISTINCT jod.user_id) THEN 'PAID'
  ELSE 'PARTIAL'
END`;

exports.getAll = () =>
  db.promise().query(
    `SELECT jod.id,
            jod.order_id,
            jod.user_id,
            jod.menu_id,
            jod.qty,
            jod.price,
            jod.subtotal,
            jod.profit,
            jod.created_at,
            jo.order_date AS session_date,
            jo.status AS session_status,
            u.name AS member_name,
            m.name AS menu_name,
            v.name AS vendor_name,
            ${paymentStatusExpr} AS payment_status,
            COALESCE(MAX(pay.payment_method), 'CASH') AS payment_method,
            jo.status AS status,
            jo.total_amount,
            jo.total_profit,
            jo.coordinator_share,
            jo.koperasi_share
     FROM jastip_order_details jod
     INNER JOIN jastip_orders jo ON jod.order_id = jo.id
     LEFT JOIN users u ON jod.user_id = u.id
     LEFT JOIN menus m ON jod.menu_id = m.id
     LEFT JOIN vendors v ON m.vendor_id = v.id
     LEFT JOIN payments pay ON pay.order_id = jo.id AND pay.member_id = jod.user_id
     GROUP BY jod.id,
              jod.order_id,
              jod.user_id,
              jod.menu_id,
              jod.qty,
              jod.price,
              jod.subtotal,
              jod.profit,
              jod.created_at,
              jo.order_date,
              jo.status,
              u.name,
              m.name,
              v.name,
              jo.total_amount,
              jo.total_profit,
              jo.coordinator_share,
              jo.koperasi_share
     ORDER BY jod.created_at DESC`,
  );

exports.getByMemberId = (memberId) =>
  db.promise().query(
    `SELECT jod.id,
            jod.order_id,
            jod.user_id,
            jod.menu_id,
            jod.qty,
            jod.price,
            jod.subtotal,
            jod.profit,
            jod.created_at,
            jo.order_date AS order_date,
            jo.status AS session_status,
            u.name AS member_name,
            m.name AS menu_name,
            v.name AS vendor_name,
            ${paymentStatusExpr} AS payment_status,
            COALESCE(MAX(pay.payment_method), 'CASH') AS payment_method,
            jo.status AS status,
            jo.total_amount,
            jo.total_profit,
            jo.coordinator_share,
            jo.koperasi_share
     FROM jastip_order_details jod
     INNER JOIN jastip_orders jo ON jod.order_id = jo.id
     LEFT JOIN users u ON jod.user_id = u.id
     LEFT JOIN menus m ON jod.menu_id = m.id
     LEFT JOIN vendors v ON m.vendor_id = v.id
     LEFT JOIN payments pay ON pay.order_id = jo.id AND pay.member_id = jod.user_id
     WHERE jod.user_id = ?
     GROUP BY jod.id,
              jod.order_id,
              jod.user_id,
              jod.menu_id,
              jod.qty,
              jod.price,
              jod.subtotal,
              jod.profit,
              jod.created_at,
              jo.order_date,
              jo.status,
              u.name,
              m.name,
              v.name,
              jo.total_amount,
              jo.total_profit,
              jo.coordinator_share,
              jo.koperasi_share
     ORDER BY jod.created_at DESC`,
    [memberId],
  );

exports.hasMemberOrderInSession = async (memberId, sessionId) => {
  const [rows] = await db.promise().query(
    `SELECT COUNT(*) AS total_items
     FROM jastip_order_details
     WHERE user_id = ? AND order_id = ?`,
    [memberId, sessionId],
  );
  return Number(rows?.[0]?.total_items || 0) > 0;
};

exports.createMemberOrder = async ({ session_id, member_id, items }) => {
  const connection = db.promise();
  try {
    const [sessionRows] = await connection.query(
      "SELECT id, status, order_date FROM jastip_orders WHERE id = ? LIMIT 1",
      [session_id],
    );

    if (sessionRows.length === 0) {
      throw new Error("Session tidak ditemukan");
    }

    if (sessionRows[0].status !== "OPEN") {
      throw new Error("Session sudah ditutup");
    }

    const alreadyOrdered = await exports.hasMemberOrderInSession(member_id, session_id);
    if (alreadyOrdered) {
      throw new Error("Member sudah memiliki order pada session ini");
    }

    const detailResults = [];
    let subtotalSum = 0;

    for (const item of items) {
      const qty = Number(item.qty || 0);
      if (qty <= 0) continue;

      const [menuRows] = await connection.query(
        `SELECT m.id, m.jastip_price, m.name, v.name AS vendor_name
         FROM jastip_session_menus jsm
         INNER JOIN menus m ON jsm.menu_id = m.id
         LEFT JOIN vendors v ON m.vendor_id = v.id
         WHERE jsm.session_id = ? AND m.id = ?
         LIMIT 1`,
        [session_id, item.menu_id],
      );

      if (menuRows.length === 0) {
        throw new Error(`Menu ${item.menu_id} tidak tersedia pada session ini`);
      }

      const menu = menuRows[0];
      const price = Number(menu.jastip_price || 0);
      const subtotal = price * qty;
      subtotalSum += subtotal;

      const [insertResult] = await connection.query(
        "INSERT INTO jastip_order_details SET ?",
        {
          order_id: session_id,
          user_id: member_id,
          menu_id: menu.id,
          qty,
          price,
          subtotal,
          profit: 0,
        },
      );

      detailResults.push({ id: insertResult.insertId, menu_name: menu.name, vendor_name: menu.vendor_name, subtotal, qty });
    }

    if (detailResults.length === 0) {
      throw new Error("Tidak ada menu valid untuk disimpan");
    }

    const [allRows] = await connection.query(
      `SELECT id, subtotal
       FROM jastip_order_details
       WHERE order_id = ? AND user_id = ?
       ORDER BY id ASC`,
      [session_id, member_id],
    );

    const totalItems = allRows.length;
    const operationFee = OPERATION_FEE_PER_SESSION;
    const baseShare = totalItems > 0 ? Math.floor(operationFee / totalItems) : 0;
    let remainder = operationFee - baseShare * totalItems;
    let totalProfit = 0;

    for (const row of allRows) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      const profit = baseShare + extra;
      totalProfit += profit;
      await connection.query(
        "UPDATE jastip_order_details SET profit = ? WHERE id = ?",
        [profit, row.id],
      );
    }

    const [aggregateRows] = await connection.query(
      `SELECT SUM(subtotal) AS total_amount
       FROM jastip_order_details
       WHERE order_id = ?`,
      [session_id],
    );

    const coordinatorShare = Math.floor(totalProfit / 2);
    const koperasiShare = totalProfit - coordinatorShare;

    await connection.query(
      `UPDATE jastip_orders
       SET total_amount = ?, total_profit = ?, coordinator_share = ?, koperasi_share = ?
       WHERE id = ?`,
      [
        Number(aggregateRows?.[0]?.total_amount || 0),
        totalProfit,
        coordinatorShare,
        koperasiShare,
        session_id,
      ],
    );

    return detailResults.map((item) => ({ ...item, operation_fee: operationFee, total_profit: totalProfit, subtotal_sum: subtotalSum }));
  } catch (err) {
    console.error("createMemberOrder failed:", err);
    throw err;
  }
};
