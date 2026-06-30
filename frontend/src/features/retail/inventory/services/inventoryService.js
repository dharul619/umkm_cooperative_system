import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: fallbackMessage };
};

const INVENTORY_BASE = API_ENDPOINTS.RETAIL.INVENTORY;

export const inventoryService = {
  getStocks: async () => {
    try {
      const response = await axiosInstance.get(`${INVENTORY_BASE}/stocks`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data stok");
    }
  },
  getStockCard: async (productId) => {
    try {
      const response = await axiosInstance.get(`${INVENTORY_BASE}/stocks/${productId}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil kartu stok");
    }
  },
  createBeginningStock: async (payload) => {
    try {
      const response = await axiosInstance.post(`${INVENTORY_BASE}/beginning`, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menyimpan stok awal");
    }
  },
  createAdjustment: async (payload) => {
    try {
      const response = await axiosInstance.post(`${INVENTORY_BASE}/adjustment`, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menyimpan adjustment stok");
    }
  },
};
