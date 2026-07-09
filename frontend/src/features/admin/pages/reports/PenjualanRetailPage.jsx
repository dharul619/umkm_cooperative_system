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
  IconButton,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaFilePdf, FaChartLine, FaList } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import AppButton from "../../../../shared/components/AppButton";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  generateProfessionalPDF,
  openProfessionalPDF,
  generateSummaryCards,
  generateTable,
  generateSectionTitle,
} from "../../../../shared/utils/pdfExport";

export default function PenjualanRetailPage() {
  const [summary, setSummary] = useState(null);
  const [dailySummary, setDailySummary] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    mode: "summary",
  });

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    if (!filters.from || !filters.to) {
      setSummary(null);
      setDailySummary([]);
      setProductDetails([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.subcategory_id) params.subcategory_id = filters.subcategory_id;
      if (filters.brand_id) params.brand_id = filters.brand_id;
      if (filters.mode) params.mode = filters.mode;

      const endpoint =
        filters.mode === "details"
          ? "/admin/reports/penjualan-retail/details"
          : "/admin/reports/penjualan-retail/summary";

      const response = await axiosInstance.get(endpoint, { params });
      const data = response.data;

      if (data.success) {
        setSummary(data.data.summary);
        if (filters.mode === "summary") {
          setDailySummary(data.data.dailySummary || []);
        } else {
          setProductDetails(data.data.productDetails || []);
        }
      } else {
        setError(data.message || "Gagal mengambil data laporan");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi");
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
    if (filters.category_id) filtersInfo.push(`Kategori: ${filters.category_id}`);
    if (filters.brand_id) filtersInfo.push(`Brand: ${filters.brand_id}`);

    let sections = [];

    if (filters.mode === "summary") {
      sections = [
        {
          title: "Ringkasan Harian",
          subtitle: "Total penjualan per hari dalam periode yang dipilih",
          headers: [
            { label: "Tanggal", align: "left" },
            { label: "Transaksi", align: "center" },
            { label: "Total Penjualan", align: "right" },
            { label: "Total Profit", align: "right" },
            { label: "SHU Koperasi", align: "right" },
          ],
          rows: dailySummary.map((d) => [
            formatDate(d.date),
            Number(d.total_transactions).toLocaleString("id-ID"),
            formatCurrency(d.total_penjualan),
            formatCurrency(d.total_profit),
            formatCurrency(d.kopi_share),
          ]),
        },
      ];
    } else {
      sections = [
        {
          title: "Detail Produk Terjual",
          subtitle: "Rincian penjualan per produk",
          headers: [
            { label: "Produk", align: "left" },
            { label: "Barcode", align: "center" },
            { label: "Kategori", align: "left" },
            { label: "Qty", align: "center" },
            { label: "Total Penjualan", align: "right" },
            { label: "Profit", align: "right" },
          ],
          rows: productDetails.map((p) => [
            `${p.product_name} (${p.unit})`,
            p.barcode || "-",
            `${p.category_name || "-"} / ${p.subcategory_name || "-"}`,
            Number(p.total_qty).toLocaleString("id-ID"),
            formatCurrency(p.total_penjualan),
            formatCurrency(p.total_profit),
          ]),
        },
      ];
    }

    const summaryCards = [
      { key: "total_transactions", label: "Total Transaksi", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_penjualan", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_profit", label: "Total Profit", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "kopi_share", label: "SHU Koperasi", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
    ];

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN PENJUALAN RETAIL",
      reportType: "Warung Retail",
      filters,
      summary,
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
            Laporan Penjualan Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Laporan penjualan produk retail dengan berbagai filter dan opsi export
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Export PDF">
            <AppButton
              color="primary"
              onClick={handleExportPDF}
              startIcon={<FaPrint />}
              disabled={loading || !summary}
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
          {summary && (
            <Box sx={styles.summaryContainer}>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Transaksi
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {Number(summary.total_transactions || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Penjualan
                </Typography>
                <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                  {formatCurrency(summary.total_penjualan)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Profit
                </Typography>
                <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
                  {formatCurrency(summary.total_profit)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  SHU Koperasi
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {formatCurrency(summary.kopi_share)}
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

          {/* Mode Toggle */}
          {!loading && !error && (
            <Box sx={styles.modeToggle}>
              <Chip
                icon={<FaChartLine />}
                label="Ringkasan Harian"
                color={filters.mode === "summary" ? "primary" : "default"}
                onClick={() => handleFilterChange({ mode: "summary" })}
                sx={{ cursor: "pointer" }}
              />
              <Chip
                icon={<FaList />}
                label="Detail Produk"
                color={filters.mode === "details" ? "primary" : "default"}
                onClick={() => handleFilterChange({ mode: "details" })}
                sx={{ cursor: "pointer" }}
              />
            </Box>
          )}

          {/* Data Table */}
          {!loading && !error && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                {filters.mode === "summary" ? (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Ringkasan Harian
                    </Typography>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Transaksi</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Penjualan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Profit</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">SHU Koperasi</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailySummary.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            dailySummary.map((row, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>{formatDate(row.date)}</TableCell>
                                <TableCell align="center">{Number(row.total_transactions).toLocaleString("id-ID")}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.kopi_share)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Detail Produk Terjual
                    </Typography>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Produk</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Barcode</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Kategori</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Qty</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Penjualan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Profit</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productDetails.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            productDetails.map((row, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>{row.product_name} ({row.unit})</TableCell>
                                <TableCell sx={{ fontFamily: "monospace" }}>{row.barcode || "-"}</TableCell>
                                <TableCell>{row.category_name} / {row.subcategory_name}</TableCell>
                                <TableCell align="center">{Number(row.total_qty).toLocaleString("id-ID")}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
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
  modeToggle: {
    display: "flex",
    gap: 1,
    mb: 2,
  },
};
