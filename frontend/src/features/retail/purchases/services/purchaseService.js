import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: fallbackMessage };
};

export const purchaseService = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.PURCHASES);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data pembelian");
    }
  },
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.RETAIL.PURCHASES}/${id}`,
      );
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil detail pembelian");
    }
  },
  create: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.RETAIL.PURCHASES,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuat pembelian");
    }
  },
};
