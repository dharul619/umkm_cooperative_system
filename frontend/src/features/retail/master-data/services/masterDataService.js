import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: fallbackMessage };
};

const buildCrud = (endpoint, fallbackMessages) => ({
  getAll: async () => {
    try {
      const response = await axiosInstance.get(endpoint);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, fallbackMessages.getAll);
    }
  },
  create: async (payload) => {
    try {
      const response = await axiosInstance.post(endpoint, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, fallbackMessages.create);
    }
  },
  update: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${endpoint}/${id}`, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, fallbackMessages.update);
    }
  },
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`${endpoint}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, fallbackMessages.delete);
    }
  },
});

export const retailMasterDataService = {
  ...buildCrud(API_ENDPOINTS.RETAIL.CATEGORIES, {
    getAll: "Gagal mengambil data kategori",
    create: "Gagal membuat kategori",
    update: "Gagal memperbarui kategori",
    delete: "Gagal menghapus kategori",
  }),
  getCategories: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.CATEGORIES);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data kategori");
    }
  },
  createCategory: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.CATEGORIES, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal membuat kategori");
    }
  },
  updateCategory: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.RETAIL.CATEGORIES}/${id}`, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui kategori");
    }
  },
  deleteCategory: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.RETAIL.CATEGORIES}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus kategori");
    }
  },

  getSubcategories: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.SUBCATEGORIES);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data subkategori");
    }
  },
  createSubcategory: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.SUBCATEGORIES, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal membuat subkategori");
    }
  },
  updateSubcategory: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.RETAIL.SUBCATEGORIES}/${id}`, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui subkategori");
    }
  },
  deleteSubcategory: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.RETAIL.SUBCATEGORIES}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus subkategori");
    }
  },

  getBrands: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.BRANDS);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data brand");
    }
  },
  createBrand: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.BRANDS, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal membuat brand");
    }
  },
  updateBrand: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.RETAIL.BRANDS}/${id}`, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui brand");
    }
  },
  deleteBrand: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.RETAIL.BRANDS}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus brand");
    }
  },

  getProducts: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.PRODUCTS);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data produk");
    }
  },
  createProduct: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.PRODUCTS, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal membuat produk");
    }
  },
  updateProduct: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.RETAIL.PRODUCTS}/${id}`, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui produk");
    }
  },
  deleteProduct: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.RETAIL.PRODUCTS}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus produk");
    }
  },

  getSuppliers: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.SUPPLIERS);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil data supplier");
    }
  },
  createSupplier: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.SUPPLIERS, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal membuat supplier");
    }
  },
  updateSupplier: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINTS.RETAIL.SUPPLIERS}/${id}`, payload);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal memperbarui supplier");
    }
  },
  deleteSupplier: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.RETAIL.SUPPLIERS}/${id}`);
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus supplier");
    }
  },
};


