import axiosInstance from "../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../services/api";

export const activityLogService = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.ACTIVITY_LOGS, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil log aktivitas" };
    }
  },
};
