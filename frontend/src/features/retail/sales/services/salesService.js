import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: fallbackMessage };
};

export const salesService = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.SALES);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data penjualan");
    }
  },
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.RETAIL.SALES}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil detail penjualan");
    }
  },
  create: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.SALES, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuat penjualan");
    }
  },
};
