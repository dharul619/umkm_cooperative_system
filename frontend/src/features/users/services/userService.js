import axiosInstance from "../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../services/api";

export const userService = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.USERS);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal mengambil data user" };
    }
  },

  create: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.USERS, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal membuat user" };
    }
  },

  update: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.USERS}/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal memperbarui user" };
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.USERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal menghapus user" };
    }
  },

  approve: async (id) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.USERS}/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal approve user" };
    }
  },

  reject: async (id) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.USERS}/${id}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Gagal reject user" };
    }
  },
};
