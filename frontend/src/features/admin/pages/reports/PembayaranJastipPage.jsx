import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaCreditCard, FaCheckCircle, FaClock, FaTimesCircle, FaList } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import AppButton from "../../../../shared/components/AppButton";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

export default function PembayaranJastipPage() {
  const [data, setData] = useState({
    summary: {},
    byState: [],
    byMethod: [],
    dailySummary: [],
    recentPayments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    if (!filters.from || !filters.to) {
      setData({
        summary: {},
        byState: [],
        byMethod: [],
        dailySummary: [],
        recentPayments: [],
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);

      const response = await axiosInstance.get(`/admin/reports/pembayaran-jastip`, { params });
      const result = response.data;

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Gagal mengambil data laporan");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleExportPDF = () => {
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);

    const summaryCards = [
      { key: "total_payments", label: "Total Pembayaran", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_amount", label: "Total Amount", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "unique_members", label: "Member Unik", format: "number", color: "#2563EB", bgColor: "#eff6ff" },
      { key: "unique_orders", label: "Order Unik", format: "number", color: "#D97706", bgColor: "#fffbeb" },
    ];

    const sections = [];
    if (activeTab === 0) {
      sections.push({
        title: "Ringkasan Pembayaran Jastip (Summary)",
        subtitle: "Daftar ringkasan transaksi pembayaran",
        headers: [
          { label: "Tanggal", align: "left" },
          { label: "ID / Ref", align: "left" },
          { label: "Customer (Member)", align: "left" },
          { label: "Coordinator", align: "left" },
          { label: "Vendor", align: "left" },
          { label: "Metode", align: "center" },
          { label: "Total", align: "right" },
          { label: "Status", align: "center" },
        ],
        rows: data.recentPayments.map((p) => [
          formatDateShort(p.paid_at || p.created_at),
          p.external_reference || `#${p.id}`,
          `<strong>${p.member_name || "-"}</strong> (ID: ${p.member_id || "-"})<br/><span style="font-size: 8px; color: #666;">${p.division_name || ''} - ${p.department_name || ''}</span>`,
          `<strong>${p.coordinator_name || "-"}</strong> (ID: ${p.coordinator_id || "-"})<br/><span style="font-size: 8px; color: #666;">Sesi #${p.order_id}</span>`,
          p.vendor_names || "-",
          p.payment_method || "-",
          formatCurrency(p.amount),
          p.state,
        ]),
      });
    } else {
      sections.push({
        title: "Rincian Pembayaran Jastip (Details)",
        subtitle: "Daftar rincian transaksi pembayaran beserta pesanan",
        headers: [
          { label: "Tanggal", align: "left" },
          { label: "ID / Ref", align: "left" },
          { label: "Customer (Member)", align: "left" },
          { label: "Coordinator", align: "left" },
          { label: "Vendor", align: "left" },
          { label: "Pesanan", align: "left" },
          { label: "Metode", align: "center" },
          { label: "Total", align: "right" },
          { label: "Status", align: "center" },
        ],
        rows: data.recentPayments.map((p) => [
          formatDateShort(p.paid_at || p.created_at),
          p.external_reference || `#${p.id}`,
          `<strong>${p.member_name || "-"}</strong> (ID: ${p.member_id || "-"})<br/><span style="font-size: 8px; color: #666;">${p.division_name || ''} - ${p.department_name || ''}</span>`,
          `<strong>${p.coordinator_name || "-"}</strong> (ID: ${p.coordinator_id || "-"})<br/><span style="font-size: 8px; color: #666;">Sesi #${p.order_id}</span>`,
          p.vendor_names || "-",
          p.items_summary ? `<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 3px; font-weight: bold; font-size: 9px; color: #555;">
                               <span>Produk</span>
                               <span>Qty</span>
                             </div>` + p.items_summary.split(", ").map((item) => {
            const match = item.match(/(.+)\s\((\d+)\)/);
            if (match) {
              const [, name, qty] = match;
              return `<div style="display: flex; justify-content: space-between; gap: 8px; font-size: 9px; border-bottom: 1px dashed #eee; padding: 2px 0;">
                        <span>${name}</span>
                        <span style="font-weight: bold; color: #e85d75; white-space: nowrap;">x${qty}</span>
                      </div>`;
            }
            return `<div style="font-size: 9px; border-bottom: 1px dashed #eee; padding: 2px 0;">${item}</div>`;
          }).join("") : "-",
          p.payment_method || "-",
          formatCurrency(p.amount),
          p.state,
        ]),
      });
    }

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN PEMBAYARAN JASTIP",
      reportType: "Jastip",
      filters,
      summary: data.summary,
      summaryCards,
      sections,
      filtersInfo: filtersInfo.length > 0 ? filtersInfo.join(" | ") : "Semua Filter",
    });

    openProfessionalPDF(pdfContent);
  };

  const getStateColor = (state) => {
    const colors = {
      SETTLED: "success",
      PENDING: "warning",
      PROCESSING: "info",
      FAILED: "error",
      EXPIRED: "default",
    };
    return colors[state] || "default";
  };

  const getStateIcon = (state) => {
    const icons = {
      SETTLED: <FaCheckCircle style={{ color: "#059669" }} />,
      PENDING: <FaClock style={{ color: "#D97706" }} />,
      PROCESSING: <FaClock style={{ color: "#2563EB" }} />,
      FAILED: <FaTimesCircle style={{ color: "#DC2626" }} />,
    };
    return icons[state] || state;
  };

  return (
    <Box sx={{ p: 3, width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Pembayaran Jastip
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Ringkasan pembayaran jastip per status dan metode
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Export PDF">
            <AppButton
              color="primary"
              onClick={handleExportPDF}
              startIcon={<FaPrint />}
              disabled={loading}
            >
              Export PDF
            </AppButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter */}
      <ReportFilter onFilterChange={handleFilterChange} />

      {/* Summary Cards */}
      {/* Date Filter Placeholder */}
      {!filters.from || !filters.to ? (
        <Card sx={{ mt: 3, p: 4, textAlign: "center", border: "2px dashed #F9D5DC", backgroundColor: "#FFFBFC" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="#7A2E3A" gutterBottom>
              Rentang Tanggal Belum Ditentukan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Silakan pilih tanggal "Dari Tanggal" dan "Ke Tanggal" pada filter di atas untuk memuat laporan.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          {data.summary && (
            <Box sx={styles.summaryContainer}>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Pembayaran
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {Number(data.summary.total_payments || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                  {formatCurrency(data.summary.total_amount)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Member Unik
                </Typography>
                <Typography variant="h5" sx={{ color: "#2563EB", fontWeight: 700 }}>
                  {Number(data.summary.unique_members || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Order Unik
                </Typography>
                <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
                  {Number(data.summary.unique_orders || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Loading/Error */}
          {loading && (
            <Box sx={styles.loadingContainer}>
              <CircularProgress color="inherit" />
              <Typography sx={{ mt: 2 }}>Memuat data laporan...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tabs */}
          {!loading && !error && (
            <>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
              >
                <Tab icon={<FaList />} label="Summary" iconPosition="start" />
                <Tab icon={<FaList />} label="Details" iconPosition="start" />
              </Tabs>

              {/* Tab 0: Summary View */}
              {activeTab === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Summary Pembayaran Jastip</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ width: "100%", overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 1000 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>ID / Ref</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Customer (Member)</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Coordinator</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Metode</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.recentPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.recentPayments.map((row, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell sx={{ fontSize: 13 }}>
                                  {formatDateShort(row.paid_at || row.created_at)}
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                                  {row.external_reference || row.id}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.member_name || "-"} (ID: {row.member_id || "-"})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {row.division_name || "-"} ({row.department_name || "-"})
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.coordinator_name || "-"} (ID: {row.coordinator_id || "-"})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Sesi #{row.order_id}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                                  {row.vendor_names || "-"}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: 13, fontWeight: 600 }}>
                                  {row.payment_method || "-"}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                  {formatCurrency(row.amount)}
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                    {getStateIcon(row.state)}
                                    <Chip label={row.state} size="small" color={getStateColor(row.state)} variant="outlined" />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Tab 1: Details View */}
              {activeTab === 1 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Details Pembayaran Jastip</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ width: "100%", overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 1200 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>ID / Ref</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Customer (Member)</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Coordinator</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Pesanan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Metode</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.recentPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.recentPayments.map((row, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell sx={{ fontSize: 13 }}>
                                  {formatDateShort(row.paid_at || row.created_at)}
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                                  {row.external_reference || row.id}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.member_name || "-"} (ID: {row.member_id || "-"})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {row.division_name || "-"} ({row.department_name || "-"})
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {row.coordinator_name || "-"} (ID: {row.coordinator_id || "-"})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Sesi #{row.order_id}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                                  {row.vendor_names || "-"}
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, py: 1, minWidth: 220 }}>
                                  {row.items_summary ? (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                      {/* Mini Header */}
                                      <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ddd", pb: 0.5, mb: 0.5 }}>
                                        <span style={{ fontWeight: 700, color: "#666", fontSize: 11 }}>Produk</span>
                                        <span style={{ fontWeight: 700, color: "#666", fontSize: 11, paddingRight: 4 }}>Qty</span>
                                      </Box>
                                      {row.items_summary.split(", ").map((item, index) => {
                                        const match = item.match(/(.+)\s\((\d+)\)/);
                                        if (match) {
                                          const [, name, qty] = match;
                                          return (
                                            <Box key={index} sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, borderBottom: "1px dashed #f3f3f3", pb: 0.25 }}>
                                              <span style={{ fontWeight: 500, color: "#333" }}>{name}</span>
                                              <span style={{ color: "#e85d75", fontWeight: 700, whiteSpace: "nowrap" }}>x{qty}</span>
                                            </Box>
                                          );
                                        }
                                        return <span key={index}>{item}</span>;
                                      })}
                                    </Box>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: 13, fontWeight: 600 }}>
                                  {row.payment_method || "-"}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                  {formatCurrency(row.amount)}
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                    {getStateIcon(row.state)}
                                    <Chip label={row.state} size="small" color={getStateColor(row.state)} variant="outlined" />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 3,
  },
  title: {
    fontWeight: 700,
    color: "#7A2E3A",
  },
  subtitle: {
    color: "text.secondary",
    mt: 0.5,
  },
  summaryContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 2,
    mb: 3,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 2,
    p: 2,
    border: "1px solid #e0e0e0",
    textAlign: "center",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    py: 8,
    color: "text.secondary",
  },
};
