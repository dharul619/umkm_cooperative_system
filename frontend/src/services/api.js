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
  RETAIL: {
    CATEGORIES: "/categories",
    SUBCATEGORIES: "/subcategories",
    BRANDS: "/brands",
    PRODUCTS: "/products",
    SUPPLIERS: "/suppliers",
    PURCHASES: "/purchases",
    SALES: "/sales",
  },
};
