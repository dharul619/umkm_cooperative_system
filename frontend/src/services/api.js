export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
  ROLES: "/roles",
  DIVISIONS: "/divisions",
  DEPARTMENTS: "/departments",
  VENDORS: "/vendors",
  MENUS: "/menus",
  USERS: "/users",
  ADMIN: {
    DASHBOARD_STATS: "/admin/dashboard/stats",
    DASHBOARD_USER_GROWTH: "/admin/dashboard/user-growth",
    DASHBOARD_ACTIVITY_SUMMARY: "/admin/dashboard/activity-summary",
    ACTIVITY_LOGS: "/admin/activity-logs",
    // Jastip
    JASTIP_OVERVIEW: "/admin/dashboard/jastip/overview",
    JASTIP_REVENUE_TREND: "/admin/dashboard/jastip/revenue-trend",
    JASTIP_REVENUE_TREND_MONTHLY: "/admin/dashboard/jastip/revenue-trend-monthly",
    JASTIP_TOP_VENDORS: "/admin/dashboard/jastip/top-vendors",
    JASTIP_TOP_MEMBERS: "/admin/dashboard/jastip/top-members",
    JASTIP_TOP_MENUS: "/admin/dashboard/jastip/top-menus",
    // Retail
    RETAIL_OVERVIEW: "/admin/dashboard/retail/overview",
    RETAIL_SALES_TREND: "/admin/dashboard/retail/sales-trend",
    RETAIL_SALES_TREND_MONTHLY: "/admin/dashboard/retail/sales-trend-monthly",
    RETAIL_SALES_BY_SUBCATEGORY: "/admin/dashboard/retail/sales-by-subcategory",
    RETAIL_TOP_PRODUCTS: "/admin/dashboard/retail/top-products",
    RETAIL_LOW_STOCK: "/admin/dashboard/retail/low-stock",
    RETAIL_PURCHASE_TREND: "/admin/dashboard/retail/purchase-trend",
    // SHU
    SHU_OVERVIEW: "/admin/dashboard/shu/overview",
    SHU_MONTHLY_COMPARISON: "/admin/dashboard/shu/monthly-comparison",
  },
  RETAIL: {
    CATEGORIES: "/categories",
    SUBCATEGORIES: "/subcategories",
    BRANDS: "/brands",
    PRODUCTS: "/products",
    SUPPLIERS: "/suppliers",
    PURCHASES: "/purchases",
    SALES: "/sales",
    INVENTORY: "/inventory",
  },
};
