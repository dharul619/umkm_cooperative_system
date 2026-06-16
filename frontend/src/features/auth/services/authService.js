import axiosInstance from "../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../services/api";

export const authService = {
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH.REGISTER,
        userData,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  },

  getDivisions: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DIVISIONS);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch divisions" };
    }
  },

  getRoles: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ROLES);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch roles" };
    }
  },

  getDepartments: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DEPARTMENTS);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },

  getDepartmentsByDivision: async (divisionId) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.DEPARTMENTS}?division_id=${divisionId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch departments" };
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  isLoggedIn: () => {
    return !!localStorage.getItem("token");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};
