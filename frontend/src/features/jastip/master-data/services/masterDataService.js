import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: fallbackMessage };
};

const buildCrud = (endpoint, fallbackMessages) => ({
  getAll: async () => {
    try {
      const response = await axiosInstance.get(endpoint);
      return response.data;
    } catch (error) {
      handleError(error, fallbackMessages.getAll);
    }
  },
  create: async (payload) => {
    try {
      const response = await axiosInstance.post(endpoint, payload);
      return response.data;
    } catch (error) {
      handleError(error, fallbackMessages.create);
    }
  },
  update: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${endpoint}/${id}`, payload);
      return response.data;
    } catch (error) {
      handleError(error, fallbackMessages.update);
    }
  },
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`${endpoint}/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, fallbackMessages.delete);
    }
  },
});

export const masterDataService = {
  ...buildCrud(API_ENDPOINTS.DIVISIONS, {
    getAll: "Gagal mengambil data divisi",
    create: "Gagal membuat divisi",
    update: "Gagal memperbarui divisi",
    delete: "Gagal menghapus divisi",
  }),
  getDivisions: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DIVISIONS);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data divisi");
    }
  },
  createDivision: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.DIVISIONS,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuat divisi");
    }
  },
  updateDivision: async (id, payload) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.DIVISIONS}/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui divisi");
    }
  },
  deleteDivision: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `${API_ENDPOINTS.DIVISIONS}/${id}`,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus divisi");
    }
  },

  getDepartments: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DEPARTMENTS);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data departemen");
    }
  },
  createDepartment: async (payload) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.DEPARTMENTS,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuat departemen");
    }
  },
  updateDepartment: async (id, payload) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.DEPARTMENTS}/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui departemen");
    }
  },
  deleteDepartment: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `${API_ENDPOINTS.DEPARTMENTS}/${id}`,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus departemen");
    }
  },

  getVendors: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.VENDORS);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data vendor");
    }
  },
  createVendor: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.VENDORS, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuat vendor");
    }
  },
  updateVendor: async (id, payload) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.VENDORS}/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui vendor");
    }
  },
  deleteVendor: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `${API_ENDPOINTS.VENDORS}/${id}`,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus vendor");
    }
  },

  getMenus: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MENUS);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data menu");
    }
  },
  createMenu: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.MENUS, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuat menu");
    }
  },
  updateMenu: async (id, payload) => {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.MENUS}/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui menu");
    }
  },
  deleteMenu: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `${API_ENDPOINTS.MENUS}/${id}`,
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus menu");
    }
  },
};
