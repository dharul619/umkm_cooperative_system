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
  Grid,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaBox, FaExclamationTriangle, FaExchangeAlt } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import AppButton from "../../../../shared/components/AppButton";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

export default function StokRetailPage() {
  const [data, setData] = useState({
    stockByCategory: [],
    lowStock: [],
    movementSummary: [],
    summary: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category_id: "",
    subcategory_id: "",
    brand_id: "",
  });

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.category_id) params.append("category_id", filters.category_id);
      if (filters.subcategory_id) params.append("subcategory_id", filters.subcategory_id);
      if (filters.brand_id) params.append("brand_id", filters.brand_id);

      const response = await axiosInstance.get(`/admin/reports/stok-retail`, { params });
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
    if (filters.category_id) filtersInfo.push(`Kategori ID: ${filters.category_id}`);
    if (filters.brand_id) filtersInfo.push(`Brand ID: ${filters.brand_id}`);

    const totalStock = data.stockByCategory.reduce((acc, cat) => acc + Number(cat.total_stock || 0), 0);
    const totalValue = data.stockByCategory.reduce((acc, cat) => acc + Number(cat.total_value || 0), 0);

    const summaryCards = [
      { key: "total_products", label: "Total Kategori", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "", label: "Total Stok", format: "number", value: totalStock, color: "#059669", bgColor: "#ecfdf5" },
      { key: "", label: "Total Nilai Stok", format: "currency", value: totalValue, color: "#D97706", bgColor: "#fffbeb" },
      { key: "", label: "Stok Rendah", format: "number", value: data.lowStock.length, color: "#DC2626", bgColor: "#fef2f2" },
    ];

    const sections = [
      {
        title: "Stok Berdasarkan Kategori",
        subtitle: "Ringkasan stok per kategori produk",
        headers: [
          { label: "Kategori", align: "left" },
          { label: "Total Produk", align: "center" },
          { label: "Stok Tersedia", align: "center" },
          { label: "Nilai Stok", align: "right" },
        ],
        rows: data.stockByCategory.map((cat) => [
          cat.category_name,
          Number(cat.total_products).toLocaleString("id-ID"),
          Number(cat.total_stock).toLocaleString("id-ID"),
          formatCurrency(cat.total_value),
        ]),
      },
      {
        title: "Produk Stok Rendah",
        subtitle: "Produk yang perlu diperhatikan (stok <= min_stock)",
        headers: [
          { label: "Produk", align: "left" },
          { label: "Barcode", align: "center" },
          { label: "Kategori", align: "left" },
          { label: "Stok Min", align: "center" },
          { label: "Stok Sekarang", align: "center" },
          { label: "Harga Jual", align: "right" },
        ],
        rows: data.lowStock.map((p) => [
          `${p.product_name} (${p.unit})`,
          p.barcode || "-",
          `${p.category_name} / ${p.subcategory_name}`,
          Number(p.min_stock).toLocaleString("id-ID"),
          Number(p.current_stock).toLocaleString("id-ID"),
          formatCurrency(p.selling_price),
        ]),
      },
    ];

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN STOK RETAIL",
      reportType: "Warung Retail",
      filters,
      summary: {},
      summaryCards,
      sections,
      filtersInfo: filtersInfo.length > 0 ? filtersInfo.join(" | ") : "Semua Filter",
    });

    openProfessionalPDF(pdfContent);
  };

  const totalStock = data.stockByCategory.reduce((acc, cat) => acc + Number(cat.total_stock || 0), 0);
  const totalValue = data.stockByCategory.reduce((acc, cat) => acc + Number(cat.total_value || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Stok Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Monitoring stok produk dan informasi produk dengan stok rendah
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
      <Box sx={styles.summaryContainer}>
        <Box sx={styles.summaryCard}>
          <Typography variant="caption" color="text.secondary">
            Total Kategori
          </Typography>
          <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
            {data.stockByCategory.length}
          </Typography>
        </Box>
        <Box sx={styles.summaryCard}>
          <Typography variant="caption" color="text.secondary">
            Total Stok Tersedia
          </Typography>
          <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
            {totalStock.toLocaleString("id-ID")} unit
          </Typography>
        </Box>
        <Box sx={styles.summaryCard}>
          <Typography variant="caption" color="text.secondary">
            Total Nilai Stok
          </Typography>
          <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
            {formatCurrency(totalValue)}
          </Typography>
        </Box>
        <Box sx={{ ...styles.summaryCard, borderColor: "#DC2626", borderWidth: 2, borderStyle: "solid" }}>
          <Typography variant="caption" color="text.secondary">
            Stok Rendah
          </Typography>
          <Typography variant="h5" sx={{ color: "#DC2626", fontWeight: 700 }}>
            {data.lowStock.length} Produk
          </Typography>
        </Box>
      </Box>

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

      {/* Stock by Category */}
      {!loading && !error && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <FaBox style={{ color: "#7A2E3A" }} />
                <Typography variant="h6">Stok Berdasarkan Kategori</Typography>
              </Box>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Kategori</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Total Produk</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Stok Tersedia</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Nilai Stok</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.stockByCategory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          Tidak ada data stok
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.stockByCategory.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{row.category_name}</TableCell>
                          <TableCell align="center">{Number(row.total_products).toLocaleString("id-ID")}</TableCell>
                          <TableCell align="center">{Number(row.total_stock).toLocaleString("id-ID")}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {formatCurrency(row.total_value)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {data.lowStock.length > 0 && (
            <Card sx={{ borderColor: "#DC2626", borderWidth: 2, borderStyle: "solid" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <FaExclamationTriangle style={{ color: "#DC2626" }} />
                  <Typography variant="h6" sx={{ color: "#DC2626" }}>
                    Peringatan Stok Rendah
                  </Typography>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#DC2626" }}>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Produk</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Barcode</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Kategori</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Stok Min</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Stok Sekarang</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Harga Jual</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.lowStock.map((row, idx) => (
                        <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? "#fef2f2" : "#fff" }}>
                          <TableCell sx={{ fontWeight: 500 }}>{row.product_name} ({row.unit})</TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>{row.barcode || "-"}</TableCell>
                          <TableCell>{row.category_name} / {row.subcategory_name}</TableCell>
                          <TableCell align="center">{Number(row.min_stock).toLocaleString("id-ID")}</TableCell>
                          <TableCell align="center" sx={{ color: "#DC2626", fontWeight: 700 }}>
                            {Number(row.current_stock).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {formatCurrency(row.selling_price)}
                          </TableCell>
                        </TableRow>
                      ))}
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
