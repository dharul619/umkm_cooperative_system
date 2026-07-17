const router = require("express").Router();
const c = require("../controllers/dashboardController");
const { auth, authorize } = require("../middleware/authMiddleware");

// Dashboard statistics
router.get("/stats", auth, authorize(["System Administrator"]), c.getStats);

// User growth chart data
router.get("/user-growth", auth, authorize(["System Administrator"]), c.getUserGrowth);

// Activity summary by user
router.get("/activity-summary", auth, authorize(["System Administrator"]), c.getActivitySummary);

// ===================== JASTIP VISUALIZATION =====================

// Jastip overview
router.get("/jastip/overview", auth, authorize(["System Administrator"]), c.getJastipOverview);

// Jastip revenue trend (daily)
router.get("/jastip/revenue-trend", auth, authorize(["System Administrator"]), c.getJastipRevenueTrend);

// Jastip revenue trend monthly
router.get("/jastip/revenue-trend-monthly", auth, authorize(["System Administrator"]), c.getJastipRevenueTrendMonthly);

// Jastip top vendors
router.get("/jastip/top-vendors", auth, authorize(["System Administrator"]), c.getJastipTopVendors);

// Jastip top members
router.get("/jastip/top-members", auth, authorize(["System Administrator"]), c.getJastipTopMembers);

// Jastip top menus
router.get("/jastip/top-menus", auth, authorize(["System Administrator"]), c.getJastipTopMenus);

// ===================== RETAIL VISUALIZATION =====================

// Retail overview
router.get("/retail/overview", auth, authorize(["System Administrator", "Business Coordinator"]), c.getRetailOverview);

// Retail sales trend (daily)
router.get("/retail/sales-trend", auth, authorize(["System Administrator", "Business Coordinator"]), c.getRetailSalesTrend);

// Retail sales trend monthly
router.get("/retail/sales-trend-monthly", auth, authorize(["System Administrator", "Business Coordinator"]), c.getRetailSalesTrendMonthly);

// Sales by category
router.get("/retail/sales-by-category", auth, authorize(["System Administrator", "Business Coordinator"]), c.getSalesByCategory);

// Sales by subcategory
router.get("/retail/sales-by-subcategory", auth, authorize(["System Administrator", "Business Coordinator"]), c.getSalesBySubcategory);

// Top selling products
router.get("/retail/top-products", auth, authorize(["System Administrator", "Business Coordinator"]), c.getTopSellingProducts);

// Low stock products
router.get("/retail/low-stock", auth, authorize(["System Administrator", "Business Coordinator"]), c.getLowStockProducts);

// Purchase trend
router.get("/retail/purchase-trend", auth, authorize(["System Administrator", "Business Coordinator"]), c.getPurchaseTrend);

// ===================== SHU / COMBINED =====================

// SHU overview
router.get("/shu/overview", auth, authorize(["System Administrator", "Business Coordinator"]), c.getSHUOverview);

// Monthly SHU comparison
router.get("/shu/monthly-comparison", auth, authorize(["System Administrator"]), c.getMonthlySHUComparison);

// Retail inventory by subcategory
router.get("/retail/inventory-by-subcategory", auth, authorize(["System Administrator", "Business Coordinator"]), c.getInventoryBySubcategory);

// Jastip orders by division
router.get("/jastip/orders-by-division", auth, authorize(["System Administrator"]), c.getJastipOrdersByDivision);

// Payment method distribution
router.get("/payments/methods", auth, authorize(["System Administrator"]), c.getPaymentMethodStats);

// User count by division
router.get("/users/by-division", auth, authorize(["System Administrator"]), c.getUserCountByDivision);

module.exports = router;
