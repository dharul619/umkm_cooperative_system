import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: fallbackMessage };
};

const PREDICTIONS_BASE = API_ENDPOINTS.RETAIL.PREDICTIONS;

export const predictionService = {
  getSummary: async () => {
    try {
      const response = await axiosInstance.get(PREDICTIONS_BASE);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data prediksi penjualan");
    }
  },
  runPipeline: async () => {
    try {
      const response = await axiosInstance.post(`${PREDICTIONS_BASE}/run`);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menjalankan ulang prediksi Random Forest");
    }
  },
};
