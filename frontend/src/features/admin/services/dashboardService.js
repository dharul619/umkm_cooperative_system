import axiosInstance from "../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../services/api";

export const dashboardService = {
  // Base stats
  getStats: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil statistik" };
    }
  },

  getUserGrowth: async (months = 6) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.DASHBOARD_USER_GROWTH}?months=${months}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil data pertumbuhan user" };
    }
  },

  getActivitySummary: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.DASHBOARD_ACTIVITY_SUMMARY}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil ringkasan aktivitas" };
    }
  },

  // ===================== JASTIP =====================

  getJastipOverview: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.JASTIP_OVERVIEW);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil overview jastip" };
    }
  },

  getJastipRevenueTrend: async (days = 30) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.JASTIP_REVENUE_TREND}?days=${days}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil tren revenue jastip" };
    }
  },

  getJastipRevenueTrendMonthly: async (months = 12) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.JASTIP_REVENUE_TREND_MONTHLY}?months=${months}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil tren revenue bulanan jastip" };
    }
  },

  getJastipTopVendors: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.JASTIP_TOP_VENDORS}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil top vendor" };
    }
  },

  getJastipTopMembers: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.JASTIP_TOP_MEMBERS}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil top member" };
    }
  },

  getJastipTopMenus: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.JASTIP_TOP_MENUS}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil top menu" };
    }
  },

  // ===================== RETAIL =====================

  getRetailOverview: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.RETAIL_OVERVIEW);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil overview retail" };
    }
  },

  getRetailSalesTrend: async (days = 30) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_SALES_TREND}?days=${days}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil tren penjualan" };
    }
  },

  getRetailSalesTrendMonthly: async (months = 12) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_SALES_TREND_MONTHLY}?months=${months}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil tren penjualan bulanan" };
    }
  },

  getSalesByCategory: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_SALES_BY_CATEGORY}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil penjualan per kategori" };
    }
  },

  getSalesBySubcategory: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_SALES_BY_SUBCATEGORY}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil penjualan per sub-kategori" };
    }
  },

  getTopSellingProducts: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_TOP_PRODUCTS}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil produk terlaris" };
    }
  },

  getLowStockProducts: async (limit = 20) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_LOW_STOCK}?limit=${limit}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil produk low stock" };
    }
  },

  getPurchaseTrend: async (months = 12) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.RETAIL_PURCHASE_TREND}?months=${months}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil tren pembelian" };
    }
  },

  // ===================== SHU =====================

  getSHUOverview: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.SHU_OVERVIEW);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil overview SHU" };
    }
  },

  getMonthlySHUComparison: async (months = 12) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.ADMIN.SHU_MONTHLY_COMPARISON}?months=${months}`
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil perbandingan SHU" };
    }
  },

  getInventoryBySubcategory: async () => {
    try {
      const response = await axiosInstance.get("/admin/dashboard/retail/inventory-by-subcategory");
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil data inventori per sub-kategori" };
    }
  },

  getJastipOrdersByDivision: async () => {
    try {
      const response = await axiosInstance.get("/admin/dashboard/jastip/orders-by-division");
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil data pemesanan per divisi" };
    }
  },

  getPaymentMethodStats: async () => {
    try {
      const response = await axiosInstance.get("/admin/dashboard/payments/methods");
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil data metode pembayaran" };
    }
  },

  getUserCountByDivision: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS_BY_DIVISION);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil data user per divisi" };
    }
  },
};
