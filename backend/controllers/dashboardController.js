const model = require("../models/dashboardModel");

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
exports.getStats = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const stats = await model.getStats(Number(months) || 1);

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get user growth statistics
 * GET /api/admin/dashboard/user-growth
 */
exports.getUserGrowth = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const data = await model.getUserGrowth(Number(months));

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getUserGrowth error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get activity summary by user
 * GET /api/admin/dashboard/activity-summary
 */
exports.getActivitySummary = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await model.getActivityByUser(Number(limit));

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getActivitySummary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== JASTIP VISUALIZATION =====================

/**
 * Get jastip overview stats
 * GET /api/admin/dashboard/jastip/overview
 */
exports.getJastipOverview = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getJastipOverview(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipOverview error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get jastip revenue trend
 * GET /api/admin/dashboard/jastip/revenue-trend
 */
exports.getJastipRevenueTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await model.getJastipRevenueTrend(Number(days));
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipRevenueTrend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get jastip revenue trend monthly
 * GET /api/admin/dashboard/jastip/revenue-trend-monthly
 */
exports.getJastipRevenueTrendMonthly = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getJastipRevenueTrendMonthly(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipRevenueTrendMonthly error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get top vendors by revenue
 * GET /api/admin/dashboard/jastip/top-vendors
 */
exports.getJastipTopVendors = async (req, res) => {
  try {
    const { limit = 10, months = 1 } = req.query;
    const data = await model.getJastipTopVendors(Number(limit), Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipTopVendors error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get top members by orders
 * GET /api/admin/dashboard/jastip/top-members
 */
exports.getJastipTopMembers = async (req, res) => {
  try {
    const { limit = 10, months = 1 } = req.query;
    const data = await model.getJastipTopMembers(Number(limit), Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipTopMembers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get top menus
 * GET /api/admin/dashboard/jastip/top-menus
 */
exports.getJastipTopMenus = async (req, res) => {
  try {
    const { limit = 10, months = 1 } = req.query;
    const data = await model.getJastipTopMenus(Number(limit), Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipTopMenus error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== RETAIL VISUALIZATION =====================

/**
 * Get retail overview stats
 * GET /api/admin/dashboard/retail/overview
 */
exports.getRetailOverview = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getRetailOverview(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getRetailOverview error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get retail sales trend
 * GET /api/admin/dashboard/retail/sales-trend
 */
exports.getRetailSalesTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await model.getRetailSalesTrend(Number(days));
    res.json({ success: true, data });
  } catch (err) {
    console.error("getRetailSalesTrend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get retail sales trend monthly
 * GET /api/admin/dashboard/retail/sales-trend-monthly
 */
exports.getRetailSalesTrendMonthly = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getRetailSalesTrendMonthly(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getRetailSalesTrendMonthly error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get sales by category
 * GET /api/admin/dashboard/retail/sales-by-category
 */
exports.getSalesByCategory = async (req, res) => {
  try {
    const { limit = 10, months = 1 } = req.query;
    const data = await model.getSalesByCategory(Number(limit), Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getSalesByCategory error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get sales by subcategory
 * GET /api/admin/dashboard/retail/sales-by-subcategory
 */
exports.getSalesBySubcategory = async (req, res) => {
  try {
    const { limit = 10, months = 1 } = req.query;
    const data = await model.getSalesBySubcategory(Number(limit), Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getSalesBySubcategory error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get top selling products
 * GET /api/admin/dashboard/retail/top-products
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, months = 1 } = req.query;
    const data = await model.getTopSellingProducts(Number(limit), Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getTopSellingProducts error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get low stock products
 * GET /api/admin/dashboard/retail/low-stock
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const data = await model.getLowStockProducts(Number(limit));
    res.json({ success: true, data });
  } catch (err) {
    console.error("getLowStockProducts error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get purchase trend
 * GET /api/admin/dashboard/retail/purchase-trend
 */
exports.getPurchaseTrend = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const data = await model.getPurchaseTrend(Number(months));
    res.json({ success: true, data });
  } catch (err) {
    console.error("getPurchaseTrend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== SHU / COMBINED =====================

/**
 * Get SHU overview
 * GET /api/admin/dashboard/shu/overview
 */
exports.getSHUOverview = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getSHUOverview(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getSHUOverview error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get monthly SHU comparison
 * GET /api/admin/dashboard/shu/monthly-comparison
 */
exports.getMonthlySHUComparison = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getMonthlySHUComparison(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getMonthlySHUComparison error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get retail inventory by subcategory
 * GET /api/admin/dashboard/retail/inventory-by-subcategory
 */
exports.getInventoryBySubcategory = async (req, res) => {
  try {
    const data = await model.getInventoryBySubcategory();
    res.json({ success: true, data });
  } catch (err) {
    console.error("getInventoryBySubcategory error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get jastip orders by division
 * GET /api/admin/dashboard/jastip/orders-by-division
 */
exports.getJastipOrdersByDivision = async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const data = await model.getJastipOrdersByDivision(Number(months) || 1);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getJastipOrdersByDivision error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get payment method distribution
 * GET /api/admin/dashboard/payments/methods
 */
exports.getPaymentMethodStats = async (req, res) => {
  try {
    const data = await model.getPaymentMethodStats();
    res.json({ success: true, data });
  } catch (err) {
    console.error("getPaymentMethodStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get user count by division
 * GET /api/admin/dashboard/users/by-division
 */
exports.getUserCountByDivision = async (req, res) => {
  try {
    const data = await model.getUserCountByDivision();
    res.json({ success: true, data });
  } catch (err) {
    console.error("getUserCountByDivision error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
