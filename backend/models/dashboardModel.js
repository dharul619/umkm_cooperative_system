const db = require("../config/db");

const SALES_CUTOFF_SQL =
  "DATE_SUB((SELECT COALESCE(MAX(sale_date), CURDATE()) FROM sales), INTERVAL ? MONTH)";
const JASTIP_CUTOFF_SQL =
  "DATE_SUB((SELECT COALESCE(MAX(created_at), NOW()) FROM jastip_orders WHERE status = 'DONE'), INTERVAL ? MONTH)";
const JASTIP_ALL_CUTOFF_SQL =
  "DATE_SUB((SELECT COALESCE(MAX(created_at), NOW()) FROM jastip_orders), INTERVAL ? MONTH)";
const USER_CUTOFF_SQL =
  "DATE_SUB((SELECT COALESCE(MAX(created_at), NOW()) FROM users), INTERVAL ? MONTH)";

/**
 * Get dashboard statistics
 */
exports.getStats = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);

  // Total users by status
  const [userStats] = await db.promise().query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM users
  `);

  // Total users by role
  const [roleStats] = await db.promise().query(`
    SELECT
      r.id,
      r.role_name,
      COUNT(u.id) as count
    FROM roles r
    LEFT JOIN users u ON r.id = u.role_id AND u.status = 'approved'
    GROUP BY r.id, r.role_name
    ORDER BY r.id
  `);

  // Recent activity logs (last 10 logs with user info)
  const [recentActivity] = await db.promise().query(`
    SELECT
      al.id,
      al.activity,
      al.created_at,
      u.name as user_name,
      u.username
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 10
  `);

  // Active sessions (if jastip module exists)
  let activeSessions = 0;
  try {
    const [sessionStats] = await db.promise().query(`
      SELECT COUNT(*) as count
      FROM jastip_sessions
      WHERE status IN ('active', 'ordering', 'payment', 'done')
    `);
    activeSessions = sessionStats[0]?.count || 0;
  } catch (e) {
    // Table might not exist
    activeSessions = 0;
  }

  // Today's new registrations
  const [todayRegistrations] = await db.promise().query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE DATE(created_at) = CURDATE()
  `);

  // Recent registrations (last 7 days)
  const [recentRegistrations] = await db.promise().query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM users
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Period registrations based on latest user timestamp
  const [periodRegistrations] = await db.promise().query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE created_at >= ${USER_CUTOFF_SQL}
  `, [periodMonths]);

  return {
    users: {
      total: userStats[0]?.total || 0,
      approved: userStats[0]?.approved || 0,
      pending: userStats[0]?.pending || 0,
      rejected: userStats[0]?.rejected || 0,
    },
    byRole: roleStats.map((r) => ({
      id: r.id,
      role_name: r.role_name,
      count: r.count || 0,
    })),
    activeSessions: activeSessions,
    todayRegistrations: todayRegistrations[0]?.count || 0,
    periodRegistrations: Number(periodRegistrations[0]?.count || 0),
    recentActivity: recentActivity,
    recentRegistrations: recentRegistrations,
  };
};

/**
 * Get user growth statistics (monthly)
 */
exports.getUserGrowth = async (months = 6) => {
  const [data] = await db.promise().query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as new_users
    FROM users
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month ASC
  `, [months]);

  return data;
};

/**
 * Get activity summary by user
 */
exports.getActivityByUser = async (limit = 10) => {
  const [data] = await db.promise().query(`
    SELECT
      al.user_id,
      u.name as user_name,
      u.username,
      COUNT(*) as activity_count
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    GROUP BY al.user_id, u.name, u.username
    ORDER BY activity_count DESC
    LIMIT ?
  `, [limit]);

  return data;
};

// ===================== JASTIP VISUALIZATION DATA =====================

/**
 * Get jastip overview stats
 */
exports.getJastipOverview = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);

  // Sessions by status within period
  const [sessionStats] = await db.promise().query(`
    SELECT
      status,
      COUNT(*) as count
    FROM jastip_orders
    WHERE created_at >= ${JASTIP_ALL_CUTOFF_SQL}
    GROUP BY status
  `, [periodMonths]);

  // Done orders within period
  const [orderStats] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT jo.id) as total_orders,
      COUNT(DISTINCT jo.coordinator_id) as total_coordinators,
      COUNT(DISTINCT jod.user_id) as total_members
    FROM jastip_orders jo
    LEFT JOIN jastip_order_details jod ON jo.id = jod.order_id
    WHERE jo.status = 'DONE'
      AND jo.created_at >= ${JASTIP_CUTOFF_SQL}
  `, [periodMonths]);

  // Revenue stats within period
  const [revenueStats] = await db.promise().query(`
    SELECT
      COALESCE(SUM(jo.total_amount), 0) as total_revenue,
      COALESCE(SUM(jo.total_profit), 0) as total_profit,
      COALESCE(SUM(jo.koperasi_share), 0) as total_kopi_share
    FROM jastip_orders jo
    WHERE jo.status = 'DONE'
      AND jo.created_at >= ${JASTIP_CUTOFF_SQL}
  `, [periodMonths]);

  // This month stats (latest active month in DONE jastip orders)
  const [thisMonthStats] = await db.promise().query(`
    SELECT
      COUNT(*) as total_sessions,
      COALESCE(SUM(jo.total_amount), 0) as total_revenue,
      COALESCE(SUM(jo.total_profit), 0) as total_profit
    FROM jastip_orders jo
    WHERE jo.status = 'DONE'
      AND DATE_FORMAT(jo.created_at, '%Y-%m') = (
        SELECT DATE_FORMAT(MAX(created_at), '%Y-%m') FROM jastip_orders WHERE status = 'DONE'
      )
  `);

  return {
    sessionsByStatus: sessionStats,
    orderStats: orderStats[0] || {},
    revenueStats: revenueStats[0] || {},
    thisMonth: thisMonthStats[0] || {},
  };
};

/**
 * Get jastip revenue trend (daily for last 30 days)
 */
exports.getJastipRevenueTrend = async (days = 30) => {
  const [data] = await db.promise().query(`
    SELECT
      DATE(jo.created_at) as date,
      COUNT(DISTINCT jo.id) as sessions,
      COALESCE(SUM(jo.total_amount), 0) as revenue,
      COALESCE(SUM(jo.total_profit), 0) as profit,
      COALESCE(SUM(jo.koperasi_share), 0) as kopi_share
    FROM jastip_orders jo
    WHERE jo.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND jo.status = 'DONE'
    GROUP BY DATE(jo.created_at)
    ORDER BY date ASC
  `, [days]);

  return data;
};

/**
 * Get jastip revenue trend by month (daily when months=1, monthly otherwise)
 */
exports.getJastipRevenueTrendMonthly = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const bucketExpr =
    periodMonths === 1
      ? "DATE_FORMAT(jo.created_at, '%Y-%m-%d')"
      : "DATE_FORMAT(jo.created_at, '%Y-%m')";
  const labelExpr =
    periodMonths === 1
      ? "DATE_FORMAT(jo.created_at, '%d %b')"
      : "DATE_FORMAT(jo.created_at, '%b %Y')";

  const [data] = await db.promise().query(`
    SELECT
      ${bucketExpr} as month,
      ${labelExpr} as month_name,
      COUNT(DISTINCT jo.id) as sessions,
      COALESCE(SUM(jo.total_amount), 0) as revenue,
      COALESCE(SUM(jo.total_profit), 0) as profit,
      COALESCE(SUM(jo.koperasi_share), 0) as kopi_share
    FROM jastip_orders jo
    WHERE jo.created_at >= ${JASTIP_CUTOFF_SQL}
      AND jo.status = 'DONE'
    GROUP BY ${bucketExpr}, ${labelExpr}
    ORDER BY month ASC
  `, [periodMonths]);

  return data;
};

/**
 * Get top vendors by revenue
 */
exports.getJastipTopVendors = async (limit = 10, months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      v.id as vendor_id,
      v.name as vendor_name,
      COUNT(DISTINCT jo.id) as total_sessions,
      COUNT(DISTINCT jod.user_id) as total_members,
      COALESCE(SUM(jod.subtotal), 0) as total_revenue,
      COALESCE(SUM(jod.profit), 0) as total_profit
    FROM vendors v
    LEFT JOIN menus m ON v.id = m.vendor_id
    LEFT JOIN jastip_session_menus jsm ON m.id = jsm.menu_id
    LEFT JOIN jastip_orders jo ON jsm.session_id = jo.id AND jo.status = 'DONE' AND jo.created_at >= ${JASTIP_CUTOFF_SQL}
    LEFT JOIN jastip_order_details jod ON jo.id = jod.order_id AND jod.menu_id = m.id
    GROUP BY v.id, v.name
    HAVING total_revenue > 0
    ORDER BY total_revenue DESC
    LIMIT ?
  `, [periodMonths, limit]);

  return data;
};

/**
 * Get top members by orders
 */
exports.getJastipTopMembers = async (limit = 10, months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      u.id as member_id,
      u.name as member_name,
      u.phone_number,
      COUNT(DISTINCT jo.id) as total_orders,
      SUM(jod.qty) as total_items,
      COALESCE(SUM(jod.subtotal), 0) as total_spending,
      COALESCE(SUM(jod.profit), 0) as total_profit
    FROM users u
    JOIN jastip_order_details jod ON u.id = jod.user_id
    JOIN jastip_orders jo ON jod.order_id = jo.id AND jo.status = 'DONE' AND jo.created_at >= ${JASTIP_CUTOFF_SQL}
    GROUP BY u.id, u.name, u.phone_number
    ORDER BY total_spending DESC
    LIMIT ?
  `, [periodMonths, limit]);

  return data;
};

/**
 * Get top menus by orders
 */
exports.getJastipTopMenus = async (limit = 10, months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      m.id as menu_id,
      m.name as menu_name,
      v.name as vendor_name,
      SUM(jod.qty) as total_qty,
      COALESCE(SUM(jod.subtotal), 0) as total_revenue,
      COALESCE(SUM(jod.profit), 0) as total_profit
    FROM menus m
    JOIN vendors v ON m.vendor_id = v.id
    LEFT JOIN jastip_order_details jod ON m.id = jod.menu_id
    LEFT JOIN jastip_orders jo ON jod.order_id = jo.id AND jo.status = 'DONE' AND jo.created_at >= ${JASTIP_CUTOFF_SQL}
    GROUP BY m.id, m.name, v.name
    HAVING total_qty > 0
    ORDER BY total_qty DESC
    LIMIT ?
  `, [periodMonths, limit]);

  return data;
};

// ===================== RETAIL VISUALIZATION DATA =====================

/**
 * Get retail overview stats
 */
exports.getRetailOverview = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);

  // Product counts
  const [productStats] = await db.promise().query(`
    SELECT
      COUNT(*) as total_products,
      SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_products
    FROM products p
  `);

  // Sales stats within period
  const [salesStats] = await db.promise().query(`
    SELECT
      COUNT(*) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_revenue,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as total_kopi_share
    FROM sales s
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
  `, [periodMonths]);

  const [soldProductStats] = await db.promise().query(`
    SELECT COUNT(DISTINCT sd.product_id) as sold_products
    FROM sales_details sd
    JOIN sales s ON s.id = sd.sale_id
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
  `, [periodMonths]);

  // Purchase stats within period
  const [purchaseStats] = await db.promise().query(`
    SELECT
      COUNT(*) as total_purchases,
      COALESCE(SUM(p.total_amount), 0) as total_spent
    FROM purchases p
    WHERE p.purchase_date >= ${SALES_CUTOFF_SQL}
  `, [periodMonths]);

  // Inventory value
  const [inventoryValue] = await db.promise().query(`
    SELECT
      COALESCE(SUM(
        CASE WHEN it.type = 'IN' THEN it.qty * p.cost_price
             WHEN it.type = 'OUT' THEN -it.qty * p.cost_price
             ELSE 0 END
      ), 0) as total_inventory_value
    FROM products p
    LEFT JOIN inventory_transactions it ON p.id = it.product_id
    WHERE p.is_active = 1
  `);

  // Low stock count
  const [lowStockCount] = await db.promise().query(`
    SELECT COUNT(*) as low_stock_count
    FROM (
      SELECT p.id, p.name,
        COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.qty ELSE -it.qty END), 0) as stock
      FROM products p
      LEFT JOIN inventory_transactions it ON p.id = it.product_id
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.min_stock
      HAVING stock <= p.min_stock AND stock >= 0
    ) as low_stock_products
  `);

  // This month stats (latest sales month)
  const [thisMonthStats] = await db.promise().query(`
    SELECT
      COUNT(*) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_revenue,
      COALESCE(SUM(s.total_profit), 0) as total_profit
    FROM sales s
    WHERE DATE_FORMAT(s.sale_date, '%Y-%m') = (
      SELECT DATE_FORMAT(MAX(sale_date), '%Y-%m') FROM sales
    )
  `);

  return {
    productStats: productStats[0] || {},
    salesStats: {
      ...(salesStats[0] || {}),
      sold_products: Number(soldProductStats[0]?.sold_products || 0),
    },
    purchaseStats: purchaseStats[0] || {},
    inventoryValue: inventoryValue[0] || {},
    lowStockCount: lowStockCount[0]?.low_stock_count || 0,
    thisMonth: thisMonthStats[0] || {},
  };
};

/**
 * Get retail sales trend (daily for last 30 days)
 */
exports.getRetailSalesTrend = async (days = 30) => {
  const [data] = await db.promise().query(`
    SELECT
      s.sale_date as date,
      COUNT(*) as transactions,
      COALESCE(SUM(s.total_amount), 0) as revenue,
      COALESCE(SUM(s.total_profit), 0) as profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE s.sale_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY s.sale_date
    ORDER BY date ASC
  `, [days]);

  return data;
};

/**
 * Get retail sales trend (weekly when months=1, monthly otherwise)
 */
exports.getRetailSalesTrendMonthly = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const bucketExpr =
    periodMonths === 1
      ? "DATE_FORMAT(DATE_SUB(s.sale_date, INTERVAL WEEKDAY(s.sale_date) DAY), '%Y-%m-%d')"
      : "DATE_FORMAT(s.sale_date, '%Y-%m')";
  const labelExpr =
    periodMonths === 1
      ? "DATE_FORMAT(DATE_SUB(s.sale_date, INTERVAL WEEKDAY(s.sale_date) DAY), '%d %b')"
      : "DATE_FORMAT(s.sale_date, '%b %Y')";

  const [data] = await db.promise().query(`
    SELECT
      ${bucketExpr} as month,
      ${labelExpr} as month_name,
      COUNT(*) as transactions,
      COALESCE(SUM(s.total_amount), 0) as revenue,
      COALESCE(SUM(s.total_profit), 0) as profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
    GROUP BY ${bucketExpr}, ${labelExpr}
    ORDER BY month ASC
  `, [periodMonths]);

  return data;
};

/**
 * Get sales by category
 */
exports.getSalesByCategory = async (limit = 10, months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      c.id as category_id,
      c.name as category_name,
      COUNT(DISTINCT sd.sale_id) as total_transactions,
      SUM(sd.qty) as total_qty,
      COALESCE(SUM(sd.subtotal), 0) as total_revenue,
      COALESCE(SUM(sd.subtotal - (sd.cost_price * sd.qty)), 0) as total_profit
    FROM categories c
    JOIN subcategories sc ON c.id = sc.category_id
    JOIN products p ON sc.id = p.subcategory_id
    JOIN sales_details sd ON p.id = sd.product_id
    JOIN sales s ON sd.sale_id = s.id
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
    LIMIT ?
  `, [periodMonths, limit]);

  return data;
};

/**
 * Get sales by subcategory
 */
exports.getSalesBySubcategory = async (limit = 10, months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      sc.id as subcategory_id,
      sc.name as subcategory_name,
      COUNT(DISTINCT sd.sale_id) as total_transactions,
      SUM(sd.qty) as total_qty,
      COALESCE(SUM(sd.subtotal), 0) as total_revenue,
      COALESCE(SUM(sd.subtotal - (sd.cost_price * sd.qty)), 0) as total_profit
    FROM subcategories sc
    JOIN products p ON sc.id = p.subcategory_id
    JOIN sales_details sd ON p.id = sd.product_id
    JOIN sales s ON sd.sale_id = s.id
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
    GROUP BY sc.id, sc.name
    ORDER BY total_revenue DESC
    LIMIT ?
  `, [periodMonths, limit]);

  return data;
};

/**
 * Get top selling products
 */
exports.getTopSellingProducts = async (limit = 10, months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      p.id as product_id,
      p.name as product_name,
      p.barcode,
      c.name as category_name,
      p.selling_price,
      p.cost_price,
      SUM(sd.qty) as total_qty,
      COALESCE(SUM(sd.subtotal), 0) as total_revenue,
      COALESCE(SUM(sd.subtotal - (sd.cost_price * sd.qty)), 0) as total_profit
    FROM products p
    JOIN subcategories sc ON p.subcategory_id = sc.id
    JOIN categories c ON sc.category_id = c.id
    JOIN sales_details sd ON p.id = sd.product_id
    JOIN sales s ON sd.sale_id = s.id
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
    GROUP BY p.id, p.name, p.barcode, c.name, p.selling_price, p.cost_price
    ORDER BY total_qty DESC
    LIMIT ?
  `, [periodMonths, limit]);

  return data;
};

/**
 * Get purchase trend (monthly)
 */
exports.getPurchaseTrend = async (months = 12) => {
  const [data] = await db.promise().query(`
    SELECT
      DATE_FORMAT(p.purchase_date, '%Y-%m') as month,
      DATE_FORMAT(p.purchase_date, '%b %Y') as month_name,
      COUNT(*) as total_purchases,
      COALESCE(SUM(p.total_amount), 0) as total_amount
    FROM purchases p
    WHERE p.purchase_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(p.purchase_date, '%Y-%m'), DATE_FORMAT(p.purchase_date, '%b %Y')
    ORDER BY month ASC
  `, [months]);

  return data;
};

/**
 * Get low stock products
 */
exports.getLowStockProducts = async (limit = 20) => {
  const [data] = await db.promise().query(`
    SELECT
      p.id,
      p.name as product_name,
      p.barcode,
      p.unit,
      p.min_stock,
      p.selling_price,
      p.cost_price,
      c.name as category_name,
      COALESCE(SUM(
        CASE WHEN it.type = 'IN' THEN it.qty ELSE -it.qty END
      ), 0) as current_stock
    FROM products p
    JOIN subcategories sc ON p.subcategory_id = sc.id
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN inventory_transactions it ON p.id = it.product_id
    WHERE p.is_active = 1
    GROUP BY p.id, p.name, p.barcode, p.unit, p.min_stock, p.selling_price, p.cost_price, c.name
    HAVING current_stock <= p.min_stock AND current_stock >= 0
    ORDER BY current_stock ASC
    LIMIT ?
  `, [limit]);

  return data;
};

// ===================== COMBINED / SHU DATA =====================

/**
 * Get SHU (Surplus/Defisit) combined overview
 */
exports.getSHUOverview = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);

  // Retail SHU within period
  const [retailSHU] = await db.promise().query(`
    SELECT
      COUNT(*) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
  `, [periodMonths]);

  // Jastip SHU within period
  const [jastipSHU] = await db.promise().query(`
    SELECT
      COUNT(*) as total_sessions,
      COALESCE(SUM(jo.total_amount), 0) as total_penjualan,
      COALESCE(SUM(jo.total_profit), 0) as total_profit,
      COALESCE(SUM(jo.koperasi_share), 0) as kopi_share
    FROM jastip_orders jo
    WHERE jo.status = 'DONE'
      AND jo.created_at >= ${JASTIP_CUTOFF_SQL}
  `, [periodMonths]);

  // This month SHU (latest sales month)
  const [thisMonthRetail] = await db.promise().query(`
    SELECT
      COALESCE(SUM(s.total_profit), 0) as profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE DATE_FORMAT(s.sale_date, '%Y-%m') = (
      SELECT DATE_FORMAT(MAX(sale_date), '%Y-%m') FROM sales
    )
  `);

  const [thisMonthJastip] = await db.promise().query(`
    SELECT
      COALESCE(SUM(jo.total_profit), 0) as profit,
      COALESCE(SUM(jo.koperasi_share), 0) as kopi_share
    FROM jastip_orders jo
    WHERE jo.status = 'DONE'
      AND DATE_FORMAT(jo.created_at, '%Y-%m') = (
        SELECT DATE_FORMAT(MAX(sale_date), '%Y-%m') FROM sales
      )
  `);

  const thisMonthTotal = {
    profit: Number(thisMonthRetail[0]?.profit || 0) + Number(thisMonthJastip[0]?.profit || 0),
    kopi_share: Number(thisMonthRetail[0]?.kopi_share || 0) + Number(thisMonthJastip[0]?.kopi_share || 0),
  };

  return {
    retail: {
      total_transactions: Number(retailSHU[0]?.total_transactions || 0),
      total_penjualan: Number(retailSHU[0]?.total_penjualan || 0),
      total_profit: Number(retailSHU[0]?.total_profit || 0),
      kopi_share: Number(retailSHU[0]?.kopi_share || 0),
    },
    jastip: {
      total_sessions: Number(jastipSHU[0]?.total_sessions || 0),
      total_penjualan: Number(jastipSHU[0]?.total_penjualan || 0),
      total_profit: Number(jastipSHU[0]?.total_profit || 0),
      kopi_share: Number(jastipSHU[0]?.kopi_share || 0),
    },
    combined: {
      total_penjualan: Number(retailSHU[0]?.total_penjualan || 0) + Number(jastipSHU[0]?.total_penjualan || 0),
      total_profit: Number(retailSHU[0]?.total_profit || 0) + Number(jastipSHU[0]?.total_profit || 0),
      kopi_share: Number(retailSHU[0]?.kopi_share || 0) + Number(jastipSHU[0]?.kopi_share || 0),
    },
    thisMonth: thisMonthTotal,
  };
};

/**
 * Get SHU comparison (weekly when months=1, monthly otherwise)
 */
exports.getMonthlySHUComparison = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const retailBucketExpr =
    periodMonths === 1
      ? "DATE_FORMAT(DATE_SUB(s.sale_date, INTERVAL WEEKDAY(s.sale_date) DAY), '%Y-%m-%d')"
      : "DATE_FORMAT(s.sale_date, '%Y-%m')";
  const jastipBucketExpr =
    periodMonths === 1
      ? "DATE_FORMAT(DATE_SUB(DATE(jo.created_at), INTERVAL WEEKDAY(DATE(jo.created_at)) DAY), '%Y-%m-%d')"
      : "DATE_FORMAT(jo.created_at, '%Y-%m')";

  // Retail
  const [retailMonthly] = await db.promise().query(`
    SELECT
      ${retailBucketExpr} as month,
      COALESCE(SUM(s.total_profit), 0) as retail_profit,
      COALESCE(SUM(s.koperasi_share), 0) as retail_kopi_share
    FROM sales s
    WHERE s.sale_date >= ${SALES_CUTOFF_SQL}
    GROUP BY ${retailBucketExpr}
  `, [periodMonths]);

  // Jastip
  const [jastipMonthly] = await db.promise().query(`
    SELECT
      ${jastipBucketExpr} as month,
      COALESCE(SUM(jo.total_profit), 0) as jastip_profit,
      COALESCE(SUM(jo.koperasi_share), 0) as jastip_kopi_share
    FROM jastip_orders jo
    WHERE jo.status = 'DONE'
      AND jo.created_at >= ${SALES_CUTOFF_SQL}
    GROUP BY ${jastipBucketExpr}
  `, [periodMonths]);

  // Merge the two with explicit numeric defaults
  const merged = {};
  const ensureMonth = (month) => {
    if (!merged[month]) {
      merged[month] = {
        month,
        retail_profit: 0,
        retail_kopi_share: 0,
        jastip_profit: 0,
        jastip_kopi_share: 0,
      };
    }
    return merged[month];
  };

  retailMonthly.forEach((r) => {
    const item = ensureMonth(r.month);
    item.retail_profit = Number(r.retail_profit || 0);
    item.retail_kopi_share = Number(r.retail_kopi_share || 0);
  });

  jastipMonthly.forEach((j) => {
    const item = ensureMonth(j.month);
    item.jastip_profit = Number(j.jastip_profit || 0);
    item.jastip_kopi_share = Number(j.jastip_kopi_share || 0);
  });

  return Object.values(merged).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Get retail inventory breakdown by subcategory
 */
exports.getInventoryBySubcategory = async () => {
  const [data] = await db.promise().query(`
    SELECT
      sc.id as subcategory_id,
      sc.name as subcategory_name,
      COUNT(DISTINCT p.id) as total_products,
      COALESCE(SUM(
        CASE
          WHEN it.type = 'IN' THEN it.qty
          WHEN it.type = 'OUT' THEN -it.qty
          ELSE 0
        END
      ), 0) as total_stock,
      COALESCE(SUM(
        CASE
          WHEN it.type = 'IN' THEN it.qty * p.cost_price
          WHEN it.type = 'OUT' THEN -it.qty * p.cost_price
          ELSE 0
        END
      ), 0) as total_value
    FROM products p
    JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN inventory_transactions it ON p.id = it.product_id
    WHERE p.is_active = 1
    GROUP BY sc.id, sc.name
    ORDER BY total_value DESC
  `);
  return data;
};

/**
 * Get jastip orders breakdown by division
 */
exports.getJastipOrdersByDivision = async (months = 1) => {
  const periodMonths = Math.max(1, Number(months) || 1);
  const [data] = await db.promise().query(`
    SELECT
      d.id as division_id,
      d.name as division_name,
      COUNT(jod.id) as total_orders,
      COALESCE(SUM(jod.subtotal), 0) as total_amount,
      COALESCE(SUM(jod.profit), 0) as total_profit
    FROM divisions d
    JOIN users u ON d.id = u.division_id
    JOIN jastip_order_details jod ON u.id = jod.user_id
    JOIN jastip_orders jo ON jod.order_id = jo.id
    WHERE jo.status != 'CANCELLED'
      AND jo.created_at >= ${JASTIP_ALL_CUTOFF_SQL}
    GROUP BY d.id, d.name
    ORDER BY total_amount DESC
  `, [periodMonths]);
  return data;
};

/**
 * Get payment method distribution
 */
exports.getPaymentMethodStats = async () => {
  const [data] = await db.promise().query(`
    SELECT
      COALESCE(payment_method, 'CASH') as payment_method,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM payments
    GROUP BY payment_method
  `);
  return data;
};

/**
 * Get user count by division
 */
exports.getUserCountByDivision = async () => {
  const [data] = await db.promise().query(`
    SELECT
      d.id as division_id,
      d.name as division_name,
      COUNT(u.id) as user_count
    FROM divisions d
    LEFT JOIN users u ON d.id = u.division_id AND u.status = 'approved'
    GROUP BY d.id, d.name
    ORDER BY user_count DESC
  `);
  return data;
};
