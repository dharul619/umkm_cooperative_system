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
 * Helper to build retail product/date filters and compute totals accurately
 */
const buildRetailQueryFilters = (filters = {}) => {
  const { from, to, category_id, subcategory_id, brand_id } = filters;
  const dateParams = [];
  const dateFilter = buildDateFilter("s", "sale_date", from, to, dateParams);

  const productParams = [...dateParams];
  let categoryFilter = "";
  let subcategoryFilter = "";
  let brandFilter = "";

  if (category_id) {
    categoryFilter = " AND c.id = ?";
    productParams.push(category_id);
  }
  if (subcategory_id) {
    subcategoryFilter = " AND sc.id = ?";
    productParams.push(subcategory_id);
  }
  if (brand_id) {
    brandFilter = " AND b.id = ?";
    productParams.push(brand_id);
  }

  return {
    hasProductFilter: Boolean(category_id || subcategory_id || brand_id),
    dateFilter,
    dateParams,
    productFilterClause: `${dateFilter} ${categoryFilter} ${subcategoryFilter} ${brandFilter}`,
    productParams,
  };
};

const queryRetailTotals = async (filterCtx) => {
  if (!filterCtx.hasProductFilter) {
    const [totals] = await db.promise().query(`
      SELECT
        COUNT(DISTINCT s.id) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_penjualan,
        COALESCE(SUM(s.total_profit), 0) as total_profit,
        COALESCE(SUM(s.koperasi_share), 0) as kopi_share
      FROM sales s
      WHERE 1=1 ${filterCtx.dateFilter}
    `, filterCtx.dateParams);
    return totals[0] || {};
  }

  const [totals] = await db.promise().query(`
    SELECT
      COUNT(DISTINCT s.id) as total_transactions,
      COALESCE(SUM(sd.subtotal), 0) as total_penjualan,
      COALESCE(SUM(sd.subtotal - (sd.cost_price * sd.qty)), 0) as total_profit,
      COALESCE(ROUND(SUM(sd.subtotal - (sd.cost_price * sd.qty)) * 0.8, 2), 0) as kopi_share
    FROM sales s
    JOIN sales_details sd ON s.id = sd.sale_id
    JOIN products p ON sd.product_id = p.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 1=1 ${filterCtx.productFilterClause}
  `, filterCtx.productParams);
  return totals[0] || {};
};

/**
 * Getkop / SHU Summary
 */
exports.getSHUSummary = async (from, to) => {
  const retailParams = [];
  const jastipParams = [];
  const retailDateFilter = buildDateFilter("s", "sale_date", from, to, retailParams);
  const jastipDateFilter = buildDateFilter("jo", "order_date", from, to, jastipParams);

  // Retail SHU calculation
  const [retailSHU] = await db.promise().query(`
    SELECT
      COALESCE(SUM(s.total_amount), 0) as total_penjualan,
      COALESCE(SUM(s.total_profit), 0) as total_profit,
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share
    FROM sales s
    WHERE 1=1 ${retailDateFilter}
  `, retailParams);

  // Jastip SHU calculation
  const [jastipSHU] = await db.promise().query(`
    SELECT
      COALESCE(SUM(jo.total_amount), 0) as total_penjualan,
      COALESCE(SUM(jo.total_profit), 0) as total_profit,
      COALESCE(SUM(jo.koperasi_share), 0) as kopi_share
    FROM jastip_orders jo
    WHERE jo.status = 'DONE' ${jastipDateFilter}
  `, jastipParams);

  return {
    retail: retailSHU[0] || {},
    jastip: jastipSHU[0] || {},
    gabungan: {
      total_penjualan: Number(retailSHU[0]?.total_penjualan || 0) + Number(jastipSHU[0]?.total_penjualan || 0),
      total_profit: Number(retailSHU[0]?.total_profit || 0) + Number(jastipSHU[0]?.total_profit || 0),
      kopi_share: Number(retailSHU[0]?.kopi_share || 0) + Number(jastipSHU[0]?.kopi_share || 0),
    }
  };
};

/**
 * Penjualan Retail - Summary Mode
 */
exports.getPenjualanRetailSummary = async (filters = {}) => {
  const { from, to, category_id, subcategory_id, brand_id } = filters;
  const filterCtx = buildRetailQueryFilters(filters);

  let dailySummary;
  if (!filterCtx.hasProductFilter) {
    // Query langsung dari header sales agar total struk tidak berlipat akibat JOIN sales_details
    [dailySummary] = await db.promise().query(`
      SELECT
        s.sale_date as date,
        COUNT(DISTINCT s.id) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_penjualan,
        COALESCE(SUM(s.total_profit), 0) as total_profit,
        COALESCE(SUM(s.koperasi_share), 0) as kopi_share
      FROM sales s
      WHERE 1=1 ${filterCtx.dateFilter}
      GROUP BY s.sale_date
      ORDER BY s.sale_date DESC
    `, filterCtx.dateParams);
  } else {
    // Saat filter produk aktif, agregasi dari nilai per-item (sales_details)
    [dailySummary] = await db.promise().query(`
      SELECT
        s.sale_date as date,
        COUNT(DISTINCT s.id) as total_transactions,
        COALESCE(SUM(sd.subtotal), 0) as total_penjualan,
        COALESCE(SUM(sd.subtotal - (sd.cost_price * sd.qty)), 0) as total_profit,
        COALESCE(ROUND(SUM(sd.subtotal - (sd.cost_price * sd.qty)) * 0.8, 2), 0) as kopi_share
      FROM sales s
      JOIN sales_details sd ON s.id = sd.sale_id
      JOIN products p ON sd.product_id = p.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1 ${filterCtx.productFilterClause}
      GROUP BY s.sale_date
      ORDER BY s.sale_date DESC
    `, filterCtx.productParams);
  }

  const summary = await queryRetailTotals(filterCtx);

  return {
    summary,
    dailySummary,
    filters: { from, to, category_id, subcategory_id, brand_id }
  };
};

/**
 * Penjualan Retail - Details Mode
 */
exports.getPenjualanRetailDetails = async (filters = {}) => {
  const { from, to, category_id, subcategory_id, brand_id } = filters;
  const filterCtx = buildRetailQueryFilters(filters);

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
    WHERE 1=1 ${filterCtx.productFilterClause}
    GROUP BY p.id, p.name, p.barcode, p.unit, c.name, sc.name, b.name, p.selling_price, p.cost_price
    ORDER BY total_qty DESC
  `, filterCtx.productParams);

  const summary = await queryRetailTotals(filterCtx);

  return {
    summary,
    productDetails,
    filters: { from, to, category_id, subcategory_id, brand_id }
  };
};

/**
 * Stok Retail - Mutasi (Stok Awal, Masuk, Keluar, Akhir), Subkategori & Detail Produk
 */
exports.getStokRetail = async (filters = {}) => {
  const { from, to, category_id, subcategory_id, brand_id } = filters;
  const fromTs = from ? `${from} 00:00:00` : null;
  const toTs = to ? `${to} 23:59:59` : null;

  const selectParams = [];
  let mutationSelect = "";

  if (fromTs) {
    mutationSelect = `
      COALESCE(SUM(
        CASE
          WHEN it.created_at < ? THEN
            CASE WHEN it.type = 'IN' THEN it.qty WHEN it.type = 'OUT' THEN -it.qty ELSE 0 END
          ELSE 0
        END
      ), 0) as opening_stock,
      COALESCE(SUM(
        CASE
          WHEN it.created_at >= ? AND (? IS NULL OR it.created_at <= ?) AND it.type = 'IN' THEN it.qty
          ELSE 0
        END
      ), 0) as qty_in,
      COALESCE(SUM(
        CASE
          WHEN it.created_at >= ? AND (? IS NULL OR it.created_at <= ?) AND it.type = 'OUT' THEN it.qty
          ELSE 0
        END
      ), 0) as qty_out
    `;
    selectParams.push(fromTs, fromTs, toTs, toTs, fromTs, toTs, toTs);
  } else {
    mutationSelect = `
      0 as opening_stock,
      COALESCE(SUM(
        CASE
          WHEN (? IS NULL OR it.created_at <= ?) AND it.type = 'IN' THEN it.qty
          ELSE 0
        END
      ), 0) as qty_in,
      COALESCE(SUM(
        CASE
          WHEN (? IS NULL OR it.created_at <= ?) AND it.type = 'OUT' THEN it.qty
          ELSE 0
        END
      ), 0) as qty_out
    `;
    selectParams.push(toTs, toTs, toTs, toTs);
  }

  const whereParams = [];
  let categoryFilter = "";
  let subcategoryFilter = "";
  let brandFilter = "";

  if (category_id) {
    categoryFilter = " AND c.id = ?";
    whereParams.push(category_id);
  }
  if (subcategory_id) {
    subcategoryFilter = " AND sc.id = ?";
    whereParams.push(subcategory_id);
  }
  if (brand_id) {
    brandFilter = " AND b.id = ?";
    whereParams.push(brand_id);
  }

  const [rows] = await db.promise().query(`
    SELECT
      p.id,
      p.name as product_name,
      p.barcode,
      p.unit,
      c.id as category_id,
      c.name as category_name,
      sc.id as subcategory_id,
      sc.name as subcategory_name,
      b.id as brand_id,
      b.name as brand_name,
      p.min_stock,
      p.selling_price,
      p.cost_price,
      ${mutationSelect}
    FROM products p
    JOIN subcategories sc ON p.subcategory_id = sc.id
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN inventory_transactions it ON p.id = it.product_id
    WHERE p.is_active = 1 ${categoryFilter} ${subcategoryFilter} ${brandFilter}
    GROUP BY
      p.id, p.name, p.barcode, p.unit,
      c.id, c.name, sc.id, sc.name, b.id, b.name,
      p.min_stock, p.selling_price, p.cost_price
    ORDER BY c.name ASC, sc.name ASC, p.name ASC
  `, [...selectParams, ...whereParams]);

  const subcategoryMap = new Map();
  const categoryMap = new Map();

  let totalOpening = 0;
  let totalIn = 0;
  let totalOut = 0;
  let totalStock = 0;
  let totalValue = 0;
  let totalSellingValue = 0;
  let lowStockCount = 0;
  let warningStockCount = 0;

  const productStocks = rows.map((row) => {
    const openingStock = Number(row.opening_stock || 0);
    const qtyIn = Number(row.qty_in || 0);
    const qtyOut = Number(row.qty_out || 0);
    const currentStock = openingStock + qtyIn - qtyOut;
    const minStock = Number(row.min_stock || 0);
    const costPrice = Number(row.cost_price || 0);
    const sellingPrice = Number(row.selling_price || 0);
    const stockValue = currentStock * costPrice;
    const sellingValue = currentStock * sellingPrice;
    const stockGap = currentStock - minStock;
    const stockStatus =
      currentStock <= minStock
        ? "LOW"
        : currentStock <= Math.ceil(minStock * 1.5)
        ? "WARNING"
        : "SAFE";

    if (stockStatus === "LOW") lowStockCount += 1;
    else if (stockStatus === "WARNING") warningStockCount += 1;

    totalOpening += openingStock;
    totalIn += qtyIn;
    totalOut += qtyOut;
    totalStock += currentStock;
    totalValue += stockValue;
    totalSellingValue += sellingValue;

    const subKey = `${row.category_id}-${row.subcategory_id}`;
    if (!subcategoryMap.has(subKey)) {
      subcategoryMap.set(subKey, {
        category_id: row.category_id,
        category_name: row.category_name,
        subcategory_id: row.subcategory_id,
        subcategory_name: row.subcategory_name,
        total_products: 0,
        opening_stock: 0,
        qty_in: 0,
        qty_out: 0,
        total_stock: 0,
        total_value: 0,
        total_selling_value: 0,
      });
    }
    const subAgg = subcategoryMap.get(subKey);
    subAgg.total_products += 1;
    subAgg.opening_stock += openingStock;
    subAgg.qty_in += qtyIn;
    subAgg.qty_out += qtyOut;
    subAgg.total_stock += currentStock;
    subAgg.total_value += stockValue;
    subAgg.total_selling_value += sellingValue;

    if (!categoryMap.has(row.category_id)) {
      categoryMap.set(row.category_id, {
        category_id: row.category_id,
        category_name: row.category_name,
        total_products: 0,
        opening_stock: 0,
        qty_in: 0,
        qty_out: 0,
        total_stock: 0,
        total_value: 0,
      });
    }
    const catAgg = categoryMap.get(row.category_id);
    catAgg.total_products += 1;
    catAgg.opening_stock += openingStock;
    catAgg.qty_in += qtyIn;
    catAgg.qty_out += qtyOut;
    catAgg.total_stock += currentStock;
    catAgg.total_value += stockValue;

    return {
      id: row.id,
      product_name: row.product_name,
      barcode: row.barcode,
      unit: row.unit,
      category_id: row.category_id,
      category_name: row.category_name,
      subcategory_id: row.subcategory_id,
      subcategory_name: row.subcategory_name,
      brand_id: row.brand_id,
      brand_name: row.brand_name,
      min_stock: minStock,
      cost_price: costPrice,
      selling_price: sellingPrice,
      opening_stock: openingStock,
      qty_in: qtyIn,
      qty_out: qtyOut,
      current_stock: currentStock,
      stock_value: stockValue,
      selling_value: sellingValue,
      stock_gap: stockGap,
      stock_status: stockStatus,
    };
  });

  const stockBySubcategory = Array.from(subcategoryMap.values());
  const stockByCategory = Array.from(categoryMap.values());
  const lowStock = productStocks
    .filter((p) => p.stock_status !== "SAFE")
    .sort((a, b) => a.stock_gap - b.stock_gap);
  const priorityProducts =
    lowStock.length > 0
      ? lowStock
      : [...productStocks].sort((a, b) => a.stock_gap - b.stock_gap).slice(0, 10);

  return {
    summary: {
      total_categories: stockByCategory.length,
      total_subcategories: stockBySubcategory.length,
      total_products: productStocks.length,
      opening_stock: totalOpening,
      total_in: totalIn,
      total_out: totalOut,
      total_stock: totalStock,
      total_value: totalValue,
      total_selling_value: totalSellingValue,
      low_stock_count: lowStockCount,
      warning_stock_count: warningStockCount,
    },
    stockByCategory,
    stockBySubcategory,
    productStocks,
    lowStock,
    priorityProducts,
    filters,
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

  const activeOrderFilter = " AND jo.status != 'CANCELLED'";

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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
    GROUP BY jo.order_date
    ORDER BY jo.order_date DESC
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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  // Get total unique members
  const [memberCount] = await db.promise().query(`
    SELECT COUNT(DISTINCT jod.user_id) as total_members
    FROM jastip_order_details jod
    JOIN jastip_orders jo ON jod.order_id = jo.id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  if (totals[0]) {
    totals[0].total_members = memberCount[0]?.total_members || 0;
  }

  // By status (tampilkan semua status sebagai informasi distribusi)
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

  const activeOrderFilter = " AND jo.status != 'CANCELLED'";

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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
  `, params);

  // Get total unique members
  const [memberCount] = await db.promise().query(`
    SELECT COUNT(DISTINCT jod.user_id) as total_members
    FROM jastip_order_details jod
    JOIN jastip_orders jo ON jod.order_id = jo.id
    JOIN menus m ON jod.menu_id = m.id
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
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
    WHERE 1=1 ${activeOrderFilter} ${dateFilter} ${vendorFilter} ${sessionFilter}
    ORDER BY jo.order_date DESC, jod.created_at DESC
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
  let dateFilter = "";
  if (from) {
    dateFilter += " AND DATE(COALESCE(py.paid_at, py.created_at)) >= ?";
    params.push(from);
  }
  if (to) {
    dateFilter += " AND DATE(COALESCE(py.paid_at, py.created_at)) <= ?";
    params.push(to);
  }

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
      DATE(COALESCE(py.paid_at, py.created_at)) as date,
      COUNT(*) as total_payments,
      COALESCE(SUM(py.amount), 0) as total_amount
    FROM payments py
    WHERE py.state = 'SETTLED' ${dateFilter}
    GROUP BY DATE(COALESCE(py.paid_at, py.created_at))
    ORDER BY date DESC
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
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share,
      COALESCE(SUM(s.coordinator_share), 0) as coordinator_share
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
      COALESCE(SUM(s.koperasi_share), 0) as kopi_share,
      COALESCE(SUM(s.coordinator_share), 0) as coordinator_share
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
      COUNT(DISTINCT jod.user_id) as total_members,
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
  `, params);

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
 * Get Jastip Metadata (Vendors, Sessions, Suppliers, and Anchor Dates)
 */
exports.getJastipMetadata = async () => {
  const [[vendors], [sessions], [suppliers], [retailBounds], [jastipBounds]] = await Promise.all([
    db.promise().query(`SELECT id, name FROM vendors ORDER BY name`),
    db.promise().query(`
      SELECT jo.id, jo.order_date, u.name as coordinator_name
      FROM jastip_orders jo
      LEFT JOIN users u ON jo.coordinator_id = u.id
      ORDER BY jo.order_date DESC
    `),
    db.promise().query(`SELECT id, name FROM suppliers ORDER BY name`),
    db.promise().query(`SELECT DATE_FORMAT(MAX(sale_date), '%Y-%m-%d') as max_date FROM sales`),
    db.promise().query(`SELECT DATE_FORMAT(MAX(order_date), '%Y-%m-%d') as max_date FROM jastip_orders`),
  ]);

  return {
    vendors,
    sessions,
    suppliers,
    retailMaxDate: retailBounds[0]?.max_date || null,
    jastipMaxDate: jastipBounds[0]?.max_date || null,
  };
};
