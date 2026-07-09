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
  CircularProgress,
  Alert,
  Grid,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaWallet, FaChartLine, FaPercentage } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import AppButton from "../../../../shared/components/AppButton";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

export default function SHURetailPage() {
  const [data, setData] = useState({
    summary: {},
    monthlySummary: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
        monthlySummary: [],
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);

      const response = await axiosInstance.get(`/admin/reports/shu-retail`, { params });
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
      { key: "total_transactions", label: "Total Transaksi", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_penjualan", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_profit", label: "Total Profit", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "kopi_share", label: "SHU Koperasi (50%)", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
    ];

    const sections = [
      {
        title: "SHU Bulanan - Warung Retail",
        subtitle: "Ringkasan SHU per bulan dari penjualan retail",
        headers: [
          { label: "Bulan", align: "left" },
          { label: "Transaksi", align: "center" },
          { label: "Total Penjualan", align: "right" },
          { label: "Total Profit", align: "right" },
          { label: "SHU Koperasi", align: "right" },
        ],
        rows: data.monthlySummary.map((m) => [
          m.month_name,
          Number(m.total_transactions).toLocaleString("id-ID"),
          formatCurrency(m.total_penjualan),
          formatCurrency(m.total_profit),
          formatCurrency(m.kopi_share),
        ]),
      },
    ];

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN SHU - WARUNG RETAIL",
      reportType: "Warung Retail",
      filters,
      summary: data.summary,
      summaryCards,
      sections,
      filtersInfo: filtersInfo.length > 0 ? filtersInfo.join(" | ") : "Semua Filter",
    });

    openProfessionalPDF(pdfContent);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Pembagian SHU - Warung Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Laporan sisa hasil usaha dari penjualan retail
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
                  Total Transaksi
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {Number(data.summary.total_transactions || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Penjualan
                </Typography>
                <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                  {formatCurrency(data.summary.total_penjualan)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Profit
                </Typography>
                <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
                  {formatCurrency(data.summary.total_profit)}
                </Typography>
              </Box>
              <Box sx={{ ...styles.summaryCard, borderColor: "#7A2E3A", borderWidth: 2, borderStyle: "solid" }}>
                <Typography variant="caption" color="text.secondary">
                  SHU Koperasi (50% Profit)
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {formatCurrency(data.summary.kopi_share)}
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

          {/* Monthly Summary Table */}
          {!loading && !error && (
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <FaChartLine style={{ color: "#7A2E3A" }} />
                  <Typography variant="h6">SHU Bulanan</Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Bulan</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Transaksi</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Penjualan</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Profit</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">SHU Koperasi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.monthlySummary.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                            Tidak ada data untuk periode ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.monthlySummary.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{row.month_name}</TableCell>
                            <TableCell align="center">{Number(row.total_transactions).toLocaleString("id-ID")}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                              {formatCurrency(row.total_penjualan)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                              {formatCurrency(row.total_profit)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#7A2E3A" }}>
                              {formatCurrency(row.kopi_share)}
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
