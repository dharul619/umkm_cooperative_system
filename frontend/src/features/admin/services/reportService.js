import axiosInstance from "../../../services/axiosInstace";
import { API_ENDPOINTS } from "../../../services/api";

const REPORTS = {
  G1_KEUANGAN_GABUNGAN: "/admin/reports/g1-keuangan-gabungan",
  G2_PENJUALAN_RITEL: "/admin/reports/g2-penjualan-ritel",
  G3_PENJUALAN_JASTIP: "/admin/reports/g3-penjualan-jastip",
  G4_STOK_RITEL: "/admin/reports/g4-stok-ritel",
  G5_PEMBELIAN_RITEL: "/admin/reports/g5-pembelian-ritel",
  G6_PREDIKSI_PENJUALAN: "/admin/reports/g6-prediksi-penjualan",
  G7_AKTIVITAS_PENGGUNA: "/admin/reports/g7-aktivitas-pengguna",
  PEMBAYARAN_JASTIP: "/admin/reports/pembayaran-jastip",
};

const fetchReport = async (endpoint, params = {}) => {
  try {
    const response = await axiosInstance.get(endpoint, { params });
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data || { message: "Gagal mengambil data laporan" };
  }
};

export const reportService = {
  getG1KeuanganGabungan: (params) =>
    fetchReport(REPORTS.G1_KEUANGAN_GABUNGAN, params),

  getG2PenjualanRitel: (params) =>
    fetchReport(REPORTS.G2_PENJUALAN_RITEL, params),

  getG3PenjualanJastip: (params) =>
    fetchReport(REPORTS.G3_PENJUALAN_JASTIP, params),

  getG4StokRitel: () =>
    fetchReport(REPORTS.G4_STOK_RITEL),

  getG5PembelianRitel: (params) =>
    fetchReport(REPORTS.G5_PEMBELIAN_RITEL, params),

  getG6PrediksiPenjualan: (params) =>
    fetchReport(REPORTS.G6_PREDIKSI_PENJUALAN, params),

  getG7AktivitasPengguna: (params) =>
    fetchReport(REPORTS.G7_AKTIVITAS_PENGGUNA, params),

  getPembayaranJastip: (params) =>
    fetchReport(REPORTS.PEMBAYARAN_JASTIP, params),
};
