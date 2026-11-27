import axiosInstance from "../../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../../services/api";

const handleError = (error, fallbackMessage) => {
  throw error.response?.data || { message: error.message || fallbackMessage };
};

export const salesService = {
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.SALES, { params });
      return response.data;
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
  lookupByInvoice: async (invoice) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.RETAIL.SALES}/lookup`, {
        params: { invoice },
      });
      return response.data.data ?? response.data;
    } catch (error) {
      handleError(error, "Transaksi dengan nomor invoice tersebut tidak ditemukan");
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
  voidSale: async (id, payload) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.RETAIL.SALES}/${id}/void`, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membatalkan (void) transaksi");
    }
  },
  createReturn: async (id, payload) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.RETAIL.SALES}/${id}/returns`, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal memproses retur penjualan");
    }
  },
  getPosProducts: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.POS_PRODUCTS);
      return response.data.data ?? [];
    } catch (error) {
      handleError(error, "Gagal mengambil daftar produk POS");
    }
  },
  searchMembers: async (search = "") => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.POS_MEMBERS, {
        params: search ? { search } : {},
      });
      return response.data.data ?? [];
    } catch (error) {
      handleError(error, "Gagal mencari member koperasi");
    }
  },
  getActiveShift: async () => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.RETAIL.POS_SHIFTS}/active`);
      return response.data.data ?? null;
    } catch (error) {
      handleError(error, "Gagal mengambil status shift kasir");
    }
  },
  getShiftHistory: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.POS_SHIFTS, { params });
      return response.data;
    } catch (error) {
      handleError(error, "Gagal mengambil riwayat shift");
    }
  },
  openShift: async (payload) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.RETAIL.POS_SHIFTS}/open`, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal membuka shift kasir");
    }
  },
  closeShift: async (shiftId, payload) => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.RETAIL.POS_SHIFTS}/${shiftId}/close`,
        payload
      );
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menutup shift kasir");
    }
  },
  getHeldCarts: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RETAIL.POS_HELD_CARTS);
      return response.data.data ?? [];
    } catch (error) {
      handleError(error, "Gagal mengambil daftar keranjang tertahan");
    }
  },
  createHeldCart: async (payload) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RETAIL.POS_HELD_CARTS, payload);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menahan keranjang");
    }
  },
  deleteHeldCart: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_ENDPOINTS.RETAIL.POS_HELD_CARTS}/${id}`);
      return response.data;
    } catch (error) {
      handleError(error, "Gagal menghapus keranjang tertahan");
    }
  },
};
