const db = require("../config/db");

/**
 * Build date filter conditions
 */
const buildDateFilter = (alias, dateField, from, to, params) => {
  let filter = "";
  if (from) {
    filter += ` AND ${alias}.${dateField} >= ?`;
    params.push(from);
  }
  if (to) {
    filter += ` AND ${alias}.${dateField} <= ?`;
    params.push(to);
  }
  return filter;
};

/**
 * Getkop / SHU Summary
 */
const getSHUSummary = async (from, to) => {
  let params = [];
  const retailDateFilter = buildDateFilter("s", "sale_date", from, to, params);
  const jastipDateFilter = buildDateFilter("jo", "order_date", from, to, params);

  // Retail SHU calculation
  const [retailSHU] = await db.promise().query(`
    SELECT
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE 1=1 ${retailDateFilter}
  `, params);

  // Jastip SHU calculation
  params = [];
  const [jastipSHU] = await db.promise().query(`
    SELECT
      COALESCE(SUM(jo.total_amount), 0) as total_penjualan,
      COALESCE(SUM(jo.total_profit), 0) as total_profit,
      COALESCE(SUM(jo.koperasi_share), 0) as kopi_share
    FROM jastip_orders jo
    WHERE jo.status = 'DONE' ${jastipDateFilter}
  `, params);

  return {
    retail: retailSHU[0] || {},
    jastip: jastipSHU[0] || {},
    gabungan: {
      total_penjualan: (retailSHU[0]?.total_penjualan || 0) + (jastipSHU[0]?.total_penjualan || 0),
      total_profit: (retailSHU[0]?.total_profit || 0) + (jastipSHU[0]?.total_profit || 0),
      kopi_share: (retailSHU[0]?.kopi_share || 0) + (jastipSHU[0]?.kopi_share || 0),
    }
  };
};

/**
 * Penjualan Retail - Summary Mode
 */
exports.getPenjualanRetailSummary = async (filters = {}) => {
  const { from, to, category_id, subcategory_id, brand_id } = filters;
  let params = [];
  let dateFilter = buildDateFilter("s", "sale_date", from, to, params);

  // Build additional filters
  let categoryFilter = "";
  let subcategoryFilter = "";
  let brandFilter = "";

  if (category_id) {
    categoryFilter = " AND c.id = ?";
    params.push(category_id);
  }
  if (subcategory_id) {
    subcategoryFilter = " AND sc.id = ?";
    params.push(subcategory_id);
  }
  if (brand_id) {
    brandFilter = " AND b.id = ?";
    params.push(brand_id);
  }

  // Summary by date
  const [dailySummary] = await db.promise().query(`
    SELECT
      s.sale_date as date,
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    LEFT JOIN sales_details sd ON s.id = sd.sale_id
    LEFT JOIN products p ON sd.product_id = p.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 1=1 ${dateFilter} ${categoryFilter} ${subcategoryFilter} ${brandFilter}
    GROUP BY s.sale_date
    ORDER BY s.sale_date DESC
    LIMIT 90
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    LEFT JOIN sales_details sd ON s.id = sd.sale_id
    LEFT JOIN products p ON sd.product_id = p.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 1=1 ${dateFilter} ${categoryFilter} ${subcategoryFilter} ${brandFilter}
  `, params);

  return {
    summary: totals[0] || {},
    dailySummary,
    filters: { from, to, category_id, subcategory_id, brand_id }
  };
};

/**
 * Penjualan Retail - Details Mode
 */
exports.getPenjualanRetailDetails = async (filters = {}) => {
  const { from, to, category_id, subcategory_id, brand_id } = filters;
  let params = [];
  let dateFilter = buildDateFilter("s", "sale_date", from, to, params);

  let categoryFilter = "";
  let subcategoryFilter = "";
  let brandFilter = "";

  if (category_id) {
    categoryFilter = " AND c.id = ?";
    params.push(category_id);
  }
  if (subcategory_id) {
    subcategoryFilter = " AND sc.id = ?";
    params.push(subcategory_id);
  }
  if (brand_id) {
    brandFilter = " AND b.id = ?";
    params.push(brand_id);
  }

  // Product details
  const [productDetails] = await db.promise().query(`
    SELECT
      p.id,
      p.name as product_name,
      p.barcode,
      p.unit,
      c.name as category_name,
      sc.name as subcategory_name,
      b.name as brand_name,
      p.selling_price,
      p.cost_price,
      SUM(sd.qty) as total_qty,
      SUM(sd.subtotal) as total_penjualan,
      SUM(sd.subtotal - (sd.cost_price * sd.qty)) as total_profit
    FROM sales s
    JOIN sales_details sd ON s.id = sd.sale_id
    JOIN products p ON sd.product_id = p.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 1=1 ${dateFilter} ${categoryFilter} ${subcategoryFilter} ${brandFilter}
    GROUP BY p.id, p.name, p.barcode, p.unit, c.name, sc.name, b.name, p.selling_price, p.cost_price
    ORDER BY total_qty DESC
    LIMIT 100
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE 1=1 ${dateFilter}
  `, params);

  return {
    summary: totals[0] || {},
    productDetails,
    filters: { from, to, category_id, subcategory_id, brand_id }
  };
};

/**
 * Stok Retail
 */
exports.getStokRetail = async (filters = {}) => {
  const { category_id, subcategory_id, brand_id } = filters;
  let params = [];

  let categoryFilter = "";
  let subcategoryFilter = "";
  let brandFilter = "";

  if (category_id) {
    categoryFilter = " AND c.id = ?";
    params.push(category_id);
  }
  if (subcategory_id) {
    subcategoryFilter = " AND sc.id = ?";
    params.push(subcategory_id);
  }
  if (brand_id) {
    brandFilter = " AND b.id = ?";
    params.push(brand_id);
  }

  // Stock by category
  const [stockByCategory] = await db.promise().query(`
    SELECT
      c.id as category_id,
      c.name as category_name,
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
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN inventory_transactions it ON p.id = it.product_id
    WHERE p.is_active = 1 ${categoryFilter} ${subcategoryFilter} ${brandFilter}
    GROUP BY c.id, c.name
    ORDER BY c.name
  `, params);

  // Low stock products
  const [lowStock] = await db.promise().query(`
    SELECT
      p.id,
      p.name as product_name,
      p.barcode,
      p.unit,
      c.name as category_name,
      sc.name as subcategory_name,
      b.name as brand_name,
      p.min_stock,
      p.selling_price,
      p.cost_price,
      COALESCE(SUM(
        CASE
          WHEN it.type = 'IN' THEN it.qty
          WHEN it.type = 'OUT' THEN -it.qty
          ELSE 0
        END
      ), 0) as current_stock
    FROM products p
    JOIN subcategories sc ON p.subcategory_id = sc.id
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN inventory_transactions it ON p.id = it.product_id
    WHERE p.is_active = 1 ${categoryFilter} ${subcategoryFilter} ${brandFilter}
    GROUP BY p.id, p.name, p.barcode, p.unit, c.name, sc.name, b.name, p.min_stock, p.selling_price, p.cost_price
    HAVING current_stock <= p.min_stock
    ORDER BY current_stock ASC
    LIMIT 50
  `, params);

  // Stock movement summary
  const [movementSummary] = await db.promise().query(`
    SELECT
      it.type,
      COUNT(*) as total_transactions,
      SUM(it.qty) as total_qty
    FROM inventory_transactions it
    GROUP BY it.type
  `);

  return {
    stockByCategory,
    lowStock,
    movementSummary,
    filters
  };
};

/**
 * Pembelian Retail
 */
exports.getPembelianRetail = async (filters = {}) => {
  const { from, to, supplier_id } = filters;
  let params = [];
  let dateFilter = buildDateFilter("p", "purchase_date", from, to, params);

  let supplierFilter = "";
  if (supplier_id) {
    supplierFilter = " AND p.supplier_id = ?";
    params.push(supplier_id);
  }

  // Daily summary
  const [dailySummary] = await db.promise().query(`
    SELECT
      p.purchase_date as date,
      COUNT(DISTINCT p.id) as total_purchases,
      COALESCE(SUM(p.total_amount), 0) as total_amount
    FROM purchases p
    WHERE 1=1 ${dateFilter} ${supplierFilter}
    GROUP BY p.purchase_date
    ORDER BY p.purchase_date DESC
    LIMIT 90
  `, params);

  // By supplier
  const [bySupplier] = await db.promise().query(`
    SELECT
      s.id as supplier_id,
      s.name as supplier_name,
      s.phone,
      s.address,
      COUNT(DISTINCT p.id) as total_purchases,
      COALESCE(SUM(p.total_amount), 0) as total_amount
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1 ${dateFilter} ${supplierFilter}
    GROUP BY s.id, s.name, s.phone, s.address
    ORDER BY total_amount DESC
    LIMIT 50
  `, params);

  // Top purchased products
  const [topProducts] = await db.promise().query(`
    SELECT
      pr.id as product_id,
      pr.name as product_name,
      pr.barcode,
      pr.unit,
      c.name as category_name,
      b.name as brand_name,
      SUM(pd.qty) as total_qty,
      SUM(pd.subtotal) as total_amount,
      AVG(pd.price) as avg_price
    FROM purchase_details pd
    JOIN products pr ON pd.product_id = pr.id
    JOIN purchases p ON pd.purchase_id = p.id
    LEFT JOIN subcategories sc ON pr.subcategory_id = sc.id
    LEFT JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON pr.brand_id = b.id
    WHERE 1=1 ${dateFilter} ${supplierFilter}
    GROUP BY pr.id, pr.name, pr.barcode, pr.unit, c.name, b.name
    ORDER BY total_qty DESC
    LIMIT 50
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT p.id) as total_purchases,
      COALESCE(SUM(p.total_amount), 0) as total_amount,
      COUNT(DISTINCT p.supplier_id) as total_suppliers
    FROM purchases p
    WHERE 1=1 ${dateFilter} ${supplierFilter}
  `, params);

  return {
    summary: totals[0] || {},
    dailySummary,
    bySupplier,
    topProducts,
    filters: { from, to, supplier_id }
  };
};

/**
 * Pesanan Jastip - Summary
 */
exports.getPesananJastipSummary = async (filters = {}) => {
  const { from, to, vendor_id, session_id } = filters;
  let params = [];
  let dateFilter = buildDateFilter("jo", "order_date", from, to, params);

  let vendorFilter = "";
  if (vendor_id) {
    vendorFilter = " AND m.vendor_id = ?";
    params.push(vendor_id);
  }

  let sessionFilter = "";
  if (session_id) {
    sessionFilter = " AND jo.id = ?";
    params.push(session_id);
  }

  // Daily summary
  const [dailySummary] = await db.promise().query(`
    SELECT
      jo.order_date as date,
      COUNT(DISTINCT jo.id) as total_orders,
      COUNT(DISTINCT jod.user_id) as total_members,
      COALESCE(SUM(jod.subtotal), 0) as total_penjualan,
      COALESCE(SUM(jod.profit), 0) as total_profit,
      COALESCE(SUM(jod.profit) * 0.5, 0) as kopi_share,
      COALESCE(SUM(jod.profit) * 0.5, 0) as coor_share
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY jo.order_date
    ORDER BY jo.order_date DESC
    LIMIT 90
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT jo.id) as total_orders,
      COUNT(DISTINCT jo.coordinator_id) as total_coordinators,
      COALESCE(SUM(jod.subtotal), 0) as total_penjualan,
      COALESCE(SUM(jod.profit), 0) as total_profit,
      COALESCE(SUM(jod.profit) * 0.5, 0) as kopi_share,
      COALESCE(SUM(jod.profit) * 0.5, 0) as coor_share
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  // Get total unique members
  const [memberCount] = await db.promise().query(`
    SELECT COUNT(DISTINCT jod.user_id) as total_members
    FROM jastip_order_details jod
    JOIN jastip_orders jo ON jod.order_id = jo.id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  if (totals[0]) {
    totals[0].total_members = memberCount[0]?.total_members || 0;
  }

  // By status
  const [byStatus] = await db.promise().query(`
    SELECT
      jo.status,
      COUNT(DISTINCT jo.id) as total,
      COALESCE(SUM(jod.subtotal), 0) as total_amount
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY jo.status
  `, params);

  return {
    summary: totals[0] || {},
    dailySummary,
    byStatus,
    filters: { from, to, vendor_id, session_id }
  };
};

/**
 * Pesanan Jastip - Details
 */
exports.getPesananJastipDetails = async (filters = {}) => {
  const { from, to, vendor_id, session_id } = filters;
  let params = [];
  let dateFilter = buildDateFilter("jo", "order_date", from, to, params);

  let vendorFilter = "";
  if (vendor_id) {
    vendorFilter = " AND m.vendor_id = ?";
    params.push(vendor_id);
  }

  let sessionFilter = "";
  if (session_id) {
    sessionFilter = " AND jo.id = ?";
    params.push(session_id);
  }

  // Menu details
  const [menuDetails] = await db.promise().query(`
    SELECT
      m.id as menu_id,
      m.name as menu_name,
      v.name as vendor_name,
      v.phone as vendor_phone,
      v.address as vendor_address,
      SUM(jod.qty) as total_qty,
      SUM(jod.subtotal) as total_penjualan,
      SUM(jod.profit) as total_profit
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    JOIN vendors v ON m.vendor_id = v.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY m.id, m.name, v.name, v.phone, v.address
    ORDER BY total_qty DESC
    LIMIT 50
  `, params);

  // Member order summary
  const [memberOrders] = await db.promise().query(`
    SELECT
      u.id as member_id,
      u.name as member_name,
      u.phone_number,
      COUNT(DISTINCT jo.id) as total_orders,
      SUM(jod.qty) as total_items,
      SUM(jod.subtotal) as total_amount,
      SUM(jod.profit) as total_profit
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN users u ON jod.user_id = u.id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY u.id, u.name, u.phone_number
    ORDER BY total_amount DESC
    LIMIT 50
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT jo.id) as total_orders,
      COUNT(DISTINCT jo.coordinator_id) as total_coordinators,
      COALESCE(SUM(jod.subtotal), 0) as total_penjualan,
      COALESCE(SUM(jod.profit), 0) as total_profit,
      COALESCE(SUM(jod.profit) * 0.5, 0) as kopi_share
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  // Get total unique members
  const [memberCount] = await db.promise().query(`
    SELECT COUNT(DISTINCT jod.user_id) as total_members
    FROM jastip_order_details jod
    JOIN jastip_orders jo ON jod.order_id = jo.id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  if (totals[0]) {
    totals[0].total_members = memberCount[0]?.total_members || 0;
  }

  // Vendor summary
  const [vendorDetails] = await db.promise().query(`
    SELECT
      v.id as vendor_id,
      v.name as vendor_name,
      v.phone as vendor_phone,
      v.address as vendor_address,
      COUNT(DISTINCT jo.id) as total_orders,
      SUM(jod.qty) as total_items,
      SUM(jod.subtotal) as total_penjualan,
      SUM(jod.profit) as total_profit
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    JOIN vendors v ON m.vendor_id = v.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY v.id, v.name, v.phone, v.address
    ORDER BY total_penjualan DESC
  `, params);

  // Transaction details (line items)
  const [transactionDetails] = await db.promise().query(`
    SELECT
      jod.id as detail_id,
      jo.id as order_id,
      jo.order_date,
      u.name as member_name,
      m.name as menu_name,
      v.name as vendor_name,
      jod.qty,
      jod.price,
      jod.subtotal,
      jod.profit
    FROM jastip_order_details jod
    JOIN jastip_orders jo ON jod.order_id = jo.id
    JOIN users u ON jod.user_id = u.id
    JOIN menus m ON jod.menu_id = m.id
    JOIN vendors v ON m.vendor_id = v.id
    WHERE 1=1 ${dateFilter} ${vendorFilter} ${sessionFilter}
    ORDER BY jo.order_date DESC, jod.created_at DESC
    LIMIT 100
  `, params);

  return {
    summary: totals[0] || {},
    menuDetails,
    memberOrders,
    vendorDetails,
    transactionDetails,
    filters: { from, to, vendor_id, session_id }
  };
};

/**
 * Pembayaran Jastip
 */
exports.getPembayaranJastip = async (filters = {}) => {
  const { from, to } = filters;
  let params = [];
  let dateFilter = buildDateFilter("py", "paid_at", from, to, params);

  // By state
  const [byState] = await db.promise().query(`
    SELECT
      py.state,
      COUNT(*) as total_payments,
      COALESCE(SUM(py.amount), 0) as total_amount,
      COUNT(DISTINCT py.member_id) as unique_members
    FROM payments py
    WHERE 1=1 ${dateFilter}
    GROUP BY py.state
  `, params);

  // By payment method
  const [byMethod] = await db.promise().query(`
    SELECT
      py.payment_method,
      COUNT(*) as total_payments,
      COALESCE(SUM(py.amount), 0) as total_amount
    FROM payments py
    WHERE 1=1 ${dateFilter}
    GROUP BY py.payment_method
    ORDER BY total_amount DESC
  `, params);

  // Daily summary
  const [dailySummary] = await db.promise().query(`
    SELECT
      DATE(py.paid_at) as date,
      COUNT(*) as total_payments,
      COALESCE(SUM(py.amount), 0) as total_amount
    FROM payments py
    WHERE py.state = 'SETTLED' ${dateFilter}
    GROUP BY DATE(py.paid_at)
    ORDER BY date DESC
    LIMIT 90
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(*) as total_payments,
      COALESCE(SUM(py.amount), 0) as total_amount,
      COUNT(DISTINCT py.member_id) as unique_members,
      COUNT(DISTINCT py.order_id) as unique_orders
    FROM payments py
    WHERE 1=1 ${dateFilter}
  `, params);

  // Recent payments
  const [recentPayments] = await db.promise().query(`
    SELECT
      py.id,
      py.order_id,
      u.name as member_name,
      u.phone_number,
      dept.name as department_name,
      dv.name as division_name,
      py.member_id,
      jo.coordinator_id,
      u_coord.name as coordinator_name,
      py.amount,
      py.payment_method,
      py.state,
      py.paid_at,
      py.external_reference,
      py.created_at,
      (
        SELECT GROUP_CONCAT(DISTINCT v.name SEPARATOR ', ')
        FROM jastip_order_details jod
        INNER JOIN menus m ON jod.menu_id = m.id
        INNER JOIN vendors v ON m.vendor_id = v.id
        WHERE jod.order_id = py.order_id AND jod.user_id = py.member_id
      ) as vendor_names,
      (
        SELECT GROUP_CONCAT(CONCAT(m.name, ' (', jod.qty, ')') SEPARATOR ', ')
        FROM jastip_order_details jod
        INNER JOIN menus m ON jod.menu_id = m.id
        WHERE jod.order_id = py.order_id AND jod.user_id = py.member_id
      ) as items_summary
    FROM payments py
    LEFT JOIN users u ON py.member_id = u.id
    LEFT JOIN departments dept ON u.department_id = dept.id
    LEFT JOIN divisions dv ON u.division_id = dv.id
    LEFT JOIN jastip_orders jo ON py.order_id = jo.id
    LEFT JOIN users u_coord ON jo.coordinator_id = u_coord.id
    WHERE 1=1 ${dateFilter}
    ORDER BY py.created_at DESC
    LIMIT 100
  `, params);

  return {
    summary: totals[0] || {},
    byState,
    byMethod,
    dailySummary,
    recentPayments,
    filters: { from, to }
  };
};

/**
 * SHU Retail
 */
exports.getSHURetail = async (filters = {}) => {
  const { from, to } = filters;
  let params = [];
  let dateFilter = buildDateFilter("s", "sale_date", from, to, params);

  // Monthly summary
  const [monthlySummary] = await db.promise().query(`
    SELECT
      DATE_FORMAT(s.sale_date, '%Y-%m') as month,
      DATE_FORMAT(s.sale_date, '%M %Y') as month_name,
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE 1=1 ${dateFilter}
    GROUP BY DATE_FORMAT(s.sale_date, '%Y-%m'), DATE_FORMAT(s.sale_date, '%M %Y')
    ORDER BY month DESC
    LIMIT 24
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE 1=1 ${dateFilter}
  `, params);

  return {
    summary: totals[0] || {},
    monthlySummary,
    filters: { from, to }
  };
};

/**
 * SHU Jastip
 */
exports.getSHUJastip = async (filters = {}) => {
  const { from, to, vendor_id, session_id } = filters;
  let params = [];
  let dateFilter = buildDateFilter("jo", "order_date", from, to, params);

  let vendorFilter = "";
  if (vendor_id) {
    vendorFilter = " AND m.vendor_id = ?";
    params.push(vendor_id);
  }

  let sessionFilter = "";
  if (session_id) {
    sessionFilter = " AND jo.id = ?";
    params.push(session_id);
  }

  // Monthly summary
  const [monthlySummary] = await db.promise().query(`
    SELECT
      DATE_FORMAT(jo.order_date, '%Y-%m') as month,
      DATE_FORMAT(jo.order_date, '%M %Y') as month_name,
      COUNT(DISTINCT jo.id) as total_orders,
      COUNT(DISTINCT jo.coordinator_id) as total_coordinators,
      (
        SELECT COUNT(DISTINCT jod2.user_id)
        FROM jastip_order_details jod2
        JOIN jastip_orders jo2 ON jod2.order_id = jo2.id
        JOIN menus m2 ON jod2.menu_id = m2.id
        WHERE DATE_FORMAT(jo2.order_date, '%Y-%m') = DATE_FORMAT(jo.order_date, '%Y-%m')
          AND jo2.status = 'DONE'
          ${vendor_id ? " AND m2.vendor_id = ?" : ""}
          ${session_id ? " AND jo2.id = ?" : ""}
      ) as total_members,
      COALESCE(SUM(jod.subtotal), 0) as total_penjualan,
      COALESCE(SUM(jod.profit), 0) as total_profit,
      COALESCE(SUM(jod.profit) * 0.5, 0) as kopi_share,
      COALESCE(SUM(jod.profit) * 0.5, 0) as coor_share
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE jo.status = 'DONE' ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY DATE_FORMAT(jo.order_date, '%Y-%m'), DATE_FORMAT(jo.order_date, '%M %Y')
    ORDER BY month DESC
    LIMIT 24
  `, [...params, ...(vendor_id ? [vendor_id] : []), ...(session_id ? [session_id] : [])]);

  // Session level SHU details
  const [sessionSHUDetails] = await db.promise().query(`
    SELECT
      jo.id as session_id,
      jo.order_date as date,
      u.name as coordinator_name,
      COALESCE(SUM(jod.subtotal), 0) as total_penjualan,
      COALESCE(SUM(jod.profit), 0) as total_profit,
      COALESCE(SUM(jod.profit) * 0.5, 0) as kopi_share,
      COALESCE(SUM(jod.profit) * 0.5, 0) as coor_share
    FROM jastip_orders jo
    LEFT JOIN users u ON jo.coordinator_id = u.id
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE jo.status = 'DONE' ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY jo.id, jo.order_date, u.name
    ORDER BY jo.order_date DESC, jo.id DESC
  `, params);

  // Total summary
  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT jo.id) as total_orders,
      COUNT(DISTINCT jo.coordinator_id) as total_coordinators,
      COALESCE(SUM(jod.subtotal), 0) as total_penjualan,
      COALESCE(SUM(jod.profit), 0) as total_profit,
      COALESCE(SUM(jod.profit) * 0.5, 0) as kopi_share,
      COALESCE(SUM(jod.profit) * 0.5, 0) as coor_share
    FROM jastip_orders jo
    JOIN jastip_order_details jod ON jo.id = jod.order_id
    JOIN menus m ON jod.menu_id = m.id
    WHERE jo.status = 'DONE' ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  // Get total unique members
  const [memberCount] = await db.promise().query(`
    SELECT COUNT(DISTINCT jod.user_id) as total_members
    FROM jastip_order_details jod
    JOIN jastip_orders jo ON jod.order_id = jo.id
    JOIN menus m ON jod.menu_id = m.id
    WHERE jo.status = 'DONE' ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  if (totals[0]) {
    totals[0].total_members = memberCount[0]?.total_members || 0;
  }

  return {
    summary: totals[0] || {},
    monthlySummary,
    sessionSHUDetails,
    filters: { from, to, vendor_id, session_id }
  };
};

/**
 * Get Jastip Metadata (Vendors and Sessions)
 */
exports.getJastipMetadata = async () => {
  const [vendors] = await db.promise().query(`SELECT id, name FROM vendors ORDER BY name`);
  const [sessions] = await db.promise().query(`
    SELECT jo.id, jo.order_date, u.name as coordinator_name
    FROM jastip_orders jo
    LEFT JOIN users u ON jo.coordinator_id = u.id
    ORDER BY jo.order_date DESC
  `);
  return { vendors, sessions };
};
