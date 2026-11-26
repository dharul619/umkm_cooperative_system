import { useState, useEffect, useCallback, useMemo } from "react";
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
  TableFooter,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaBox, FaExclamationTriangle, FaChartLine, FaList } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import { AppButton, Pagination } from "../../../../shared/components";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

const ROWS_PER_PAGE = 20;

const getStatusBadge = (status) => {
  if (status === "LOW") return { label: "Stok Rendah", color: "error" };
  if (status === "WARNING") return { label: "Menipis", color: "warning" };
  return { label: "Aman", color: "success" };
};

export default function StokRetailPage() {
  const [data, setData] = useState({
    summary: {},
    stockByCategory: [],
    stockBySubcategory: [],
    productStocks: [],
    lowStock: [],
    priorityProducts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("summary");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    filterLabels: {},
  });

  const fetchReport = useCallback(async () => {
    if (!filters.from || !filters.to) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.category_id) params.append("category_id", filters.category_id);
      if (filters.subcategory_id) params.append("subcategory_id", filters.subcategory_id);
      if (filters.brand_id) params.append("brand_id", filters.brand_id);

      const response = await axiosInstance.get("/admin/reports/stok-retail", { params });
      const result = response.data;

      if (result.success) {
        setData({
          summary: result.data.summary || {},
          stockByCategory: result.data.stockByCategory || [],
          stockBySubcategory: result.data.stockBySubcategory || [],
          productStocks: result.data.productStocks || [],
          lowStock: result.data.lowStock || [],
          priorityProducts: result.data.priorityProducts || [],
        });
      } else {
        setError(result.message || "Gagal mengambil data laporan");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.category_id, filters.subcategory_id, filters.brand_id]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        fetchReport();
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchReport]);

  const handleFilterChange = (newFilters) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setPage(1);
  };

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const attentionCount = useMemo(
    () =>
      Number(data.summary.low_stock_count || 0) + Number(data.summary.warning_stock_count || 0),
    [data.summary.low_stock_count, data.summary.warning_stock_count]
  );

  const safeCount = useMemo(
    () => data.productStocks.filter((p) => p.stock_status === "SAFE").length,
    [data.productStocks]
  );

  const filteredProducts = useMemo(() => {
    if (statusFilter === "ATTENTION") {
      return data.productStocks.filter((p) => p.stock_status !== "SAFE");
    }
    if (statusFilter === "SAFE") {
      return data.productStocks.filter((p) => p.stock_status === "SAFE");
    }
    return data.productStocks;
  }, [data.productStocks, statusFilter]);

  const paginatedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [filteredProducts, page]
  );

  const subcategoryTotals = useMemo(
    () =>
      data.stockBySubcategory.reduce(
        (acc, curr) => {
          acc.products += Number(curr.total_products || 0);
          acc.opening += Number(curr.opening_stock || 0);
          acc.inQty += Number(curr.qty_in || 0);
          acc.outQty += Number(curr.qty_out || 0);
          acc.closing += Number(curr.total_stock || 0);
          acc.value += Number(curr.total_value || 0);
          return acc;
        },
        { products: 0, opening: 0, inQty: 0, outQty: 0, closing: 0, value: 0 }
      ),
    [data.stockBySubcategory]
  );

  const filteredProductTotals = useMemo(
    () =>
      filteredProducts.reduce(
        (acc, curr) => {
          acc.opening += Number(curr.opening_stock || 0);
          acc.inQty += Number(curr.qty_in || 0);
          acc.outQty += Number(curr.qty_out || 0);
          acc.closing += Number(curr.current_stock || 0);
          acc.value += Number(curr.stock_value || 0);
          return acc;
        },
        { opening: 0, inQty: 0, outQty: 0, closing: 0, value: 0 }
      ),
    [filteredProducts]
  );

  const handleExportPDF = () => {
    const labels = filters.filterLabels || {};
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);
    if (filters.category_id) filtersInfo.push(`Kategori: ${labels.category || filters.category_id}`);
    if (filters.subcategory_id) filtersInfo.push(`Sub Kategori: ${labels.subcategory || filters.subcategory_id}`);
    if (filters.brand_id) filtersInfo.push(`Brand: ${labels.brand || filters.brand_id}`);
    if (mode === "details" && statusFilter !== "ALL") {
      filtersInfo.push(`Status: ${statusFilter === "ATTENTION" ? "Perlu Perhatian" : "Aman"}`);
    }

    const summaryCards = [
      { key: "total_products", label: "Total Produk", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "opening_stock", label: "Stok Awal", format: "number", color: "#4B5563", bgColor: "#f3f4f6" },
      { key: "total_in", label: "Mutasi Masuk (+IN)", format: "number", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_out", label: "Mutasi Keluar (-OUT)", format: "number", color: "#D97706", bgColor: "#fffbeb" },
      { key: "total_stock", label: "Stok Akhir", format: "number", color: "#2563EB", bgColor: "#eff6ff" },
      { key: "total_value", label: "Nilai Aset Stok", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
    ];

    const sections =
      mode === "summary"
        ? [
            {
              title: "Mutasi & Valuasi Stok per Subkategori",
              subtitle: "Pergerakan stok awal, masuk, keluar, dan stok akhir per subkategori",
              headers: [
                { label: "Kategori", align: "left" },
                { label: "Subkategori", align: "left" },
                { label: "Produk", align: "center" },
                { label: "Stok Awal", align: "center" },
                { label: "Masuk (+IN)", align: "center" },
                { label: "Keluar (-OUT)", align: "center" },
                { label: "Stok Akhir", align: "center" },
                { label: "Nilai Aset", align: "right" },
              ],
              rows: data.stockBySubcategory.map((row) => [
                row.category_name,
                row.subcategory_name,
                Number(row.total_products).toLocaleString("id-ID"),
                Number(row.opening_stock).toLocaleString("id-ID"),
                `+${Number(row.qty_in).toLocaleString("id-ID")}`,
                `-${Number(row.qty_out).toLocaleString("id-ID")}`,
                Number(row.total_stock).toLocaleString("id-ID"),
                formatCurrency(row.total_value),
              ]),
              footerRow: [
                { label: "Total", colSpan: 2, align: "left" },
                subcategoryTotals.products.toLocaleString("id-ID"),
                subcategoryTotals.opening.toLocaleString("id-ID"),
                `+${subcategoryTotals.inQty.toLocaleString("id-ID")}`,
                `-${subcategoryTotals.outQty.toLocaleString("id-ID")}`,
                subcategoryTotals.closing.toLocaleString("id-ID"),
                formatCurrency(subcategoryTotals.value),
              ],
            },
            {
              title: "Pemantauan Ketahanan Stok Produk",
              subtitle: "Produk dengan selisih terkecil terhadap batas stok minimum",
              headers: [
                { label: "Produk", align: "left" },
                { label: "Barcode", align: "center" },
                { label: "Subkategori", align: "left" },
                { label: "Stok Min", align: "center" },
                { label: "Stok Akhir", align: "center" },
                { label: "Selisih", align: "center" },
                { label: "Status", align: "center" },
              ],
              rows: data.priorityProducts.map((p) => [
                `${p.product_name} (${p.unit})`,
                p.barcode || "-",
                p.subcategory_name,
                Number(p.min_stock).toLocaleString("id-ID"),
                Number(p.current_stock).toLocaleString("id-ID"),
                `${p.stock_gap >= 0 ? "+" : ""}${Number(p.stock_gap).toLocaleString("id-ID")}`,
                getStatusBadge(p.stock_status).label,
              ]),
            },
          ]
        : [
            {
              title: "Rincian Mutasi & Valuasi Stok per Produk",
              subtitle: "Pergeseran stok dan nilai aset masing-masing produk",
              headers: [
                { label: "Produk", align: "left" },
                { label: "Barcode", align: "center" },
                { label: "Subkategori / Brand", align: "left" },
                { label: "Awal", align: "center" },
                { label: "Masuk", align: "center" },
                { label: "Keluar", align: "center" },
                { label: "Akhir", align: "center" },
                { label: "Min", align: "center" },
                { label: "Nilai Aset", align: "right" },
                { label: "Status", align: "center" },
              ],
              rows: filteredProducts.map((p) => [
                `${p.product_name} (${p.unit})`,
                p.barcode || "-",
                `${p.subcategory_name || "-"} / ${p.brand_name || "-"}`,
                Number(p.opening_stock).toLocaleString("id-ID"),
                `+${Number(p.qty_in).toLocaleString("id-ID")}`,
                `-${Number(p.qty_out).toLocaleString("id-ID")}`,
                Number(p.current_stock).toLocaleString("id-ID"),
                Number(p.min_stock).toLocaleString("id-ID"),
                formatCurrency(p.stock_value),
                getStatusBadge(p.stock_status).label,
              ]),
              footerRow: [
                { label: "Total", colSpan: 3, align: "left" },
                filteredProductTotals.opening.toLocaleString("id-ID"),
                `+${filteredProductTotals.inQty.toLocaleString("id-ID")}`,
                `-${filteredProductTotals.outQty.toLocaleString("id-ID")}`,
                filteredProductTotals.closing.toLocaleString("id-ID"),
                "-",
                formatCurrency(filteredProductTotals.value),
                "-",
              ],
            },
          ];

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN STOK & MUTASI RETAIL",
      reportType: "Warung Retail",
      filters: { ...filters, mode },
      summary: data.summary,
      summaryCards,
      sections,
      filtersInfo: filtersInfo.length > 0 ? filtersInfo.join(" | ") : "Semua Filter",
    });

    openProfessionalPDF(pdfContent);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Stok & Mutasi Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Pergerakan stok awal, masuk, keluar, stok akhir, dan valuasi produk
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Export PDF">
            <span>
              <AppButton
                color="primary"
                onClick={handleExportPDF}
                startIcon={<FaPrint />}
                disabled={loading || !filters.from || !filters.to}
              >
                Export PDF
              </AppButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter (Periode Mutasi + Kategori/Subkategori/Brand) */}
      <ReportFilter onFilterChange={handleFilterChange} loading={loading} />

      {!filters.from || !filters.to ? (
        <Card sx={{ mt: 2, p: 4, textAlign: "center", border: "2px dashed #F9D5DC", backgroundColor: "#FFFBFC" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="#7A2E3A" gutterBottom>
              Memuat Periode Laporan...
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards (6 Kartu KPI) */}
          <Box sx={styles.summaryContainer}>
            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Total Produk
              </Typography>
              <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                {Number(data.summary.total_products || 0).toLocaleString("id-ID")} Produk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Number(data.summary.total_subcategories || 0)} Subkategori
              </Typography>
            </Box>

            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Stok Awal
              </Typography>
              <Typography variant="h5" sx={{ color: "#374151", fontWeight: 700 }}>
                {Number(data.summary.opening_stock || 0).toLocaleString("id-ID")} unit
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sebelum {formatDate(filters.from)}
              </Typography>
            </Box>

            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Mutasi Masuk (+IN)
              </Typography>
              <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                +{Number(data.summary.total_in || 0).toLocaleString("id-ID")} unit
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pembelian / masuk
              </Typography>
            </Box>

            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Mutasi Keluar (-OUT)
              </Typography>
              <Typography variant="h5" sx={{ color: "#DC2626", fontWeight: 700 }}>
                -{Number(data.summary.total_out || 0).toLocaleString("id-ID")} unit
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Penjualan / keluar
              </Typography>
            </Box>

            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Stok Akhir
              </Typography>
              <Typography variant="h5" sx={{ color: "#2563EB", fontWeight: 700 }}>
                {Number(data.summary.total_stock || 0).toLocaleString("id-ID")} unit
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per {formatDate(filters.to)}
              </Typography>
            </Box>

            <Box
              sx={{
                ...styles.summaryCard,
                borderColor: attentionCount > 0 ? "#D97706" : "#e0e0e0",
                borderWidth: attentionCount > 0 ? 2 : 1,
                borderStyle: "solid",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Nilai Aset Stok
              </Typography>
              <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
                {formatCurrency(data.summary.total_value)}
              </Typography>
              <Typography variant="caption" color={attentionCount > 0 ? "warning.dark" : "text.secondary"}>
                {attentionCount} produk perlu perhatian
              </Typography>
            </Box>
          </Box>

          {/* Mode Toggle */}
          <Box sx={styles.modeToggle}>
            <Chip
              icon={<FaChartLine />}
              label="Ringkasan Subkategori"
              color={mode === "summary" ? "primary" : "default"}
              onClick={() => handleModeChange("summary")}
              sx={{ cursor: "pointer" }}
            />
            <Chip
              icon={<FaList />}
              label="Detail & Mutasi Produk"
              color={mode === "details" ? "primary" : "default"}
              onClick={() => handleModeChange("details")}
              sx={{ cursor: "pointer" }}
            />
          </Box>

          {/* Loading / Error */}
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

          {/* Content */}
          {!loading && !error && (
            <>
              {mode === "summary" ? (
                <>
                  {/* Table 1: Stock & Mutation by Subcategory */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <FaBox style={{ color: "#7A2E3A" }} />
                        <Typography variant="h6">Mutasi & Valuasi Stok per Subkategori</Typography>
                      </Box>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Kategori</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Subkategori</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Produk
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Stok Awal
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Masuk (+IN)
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Keluar (-OUT)
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Stok Akhir
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                Nilai Aset (Modal)
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.stockBySubcategory.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data stok
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.stockBySubcategory.map((row) => (
                                <TableRow key={`${row.category_id}-${row.subcategory_id}`} hover>
                                  <TableCell sx={{ color: "text.secondary" }}>{row.category_name}</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>{row.subcategory_name}</TableCell>
                                  <TableCell align="center">
                                    {Number(row.total_products).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontFamily: "monospace" }}>
                                    {Number(row.opening_stock).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}
                                  >
                                    +{Number(row.qty_in).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{ fontFamily: "monospace", color: "#DC2626", fontWeight: 600 }}
                                  >
                                    -{Number(row.qty_out).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                    {Number(row.total_stock).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                    {formatCurrency(row.total_value)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                          {data.stockBySubcategory.length > 0 && (
                            <TableFooter>
                              <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                                  Total
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                  {subcategoryTotals.products.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                  {subcategoryTotals.opening.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{ fontWeight: 700, fontFamily: "monospace", color: "#059669" }}
                                >
                                  +{subcategoryTotals.inQty.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}
                                >
                                  -{subcategoryTotals.outQty.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                  {subcategoryTotals.closing.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                  {formatCurrency(subcategoryTotals.value)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          )}
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>

                  {/* Table 2: Priority / Low Stock Monitoring */}
                  <Card
                    sx={{
                      borderColor: data.summary.low_stock_count > 0 ? "#DC2626" : "#E5E7EB",
                      borderWidth: data.summary.low_stock_count > 0 ? 2 : 1,
                      borderStyle: "solid",
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FaExclamationTriangle
                            style={{ color: data.summary.low_stock_count > 0 ? "#DC2626" : "#D97706" }}
                          />
                          <Typography variant="h6">
                            Pemantauan Ketahanan Stok Produk
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Selisih terkecil terhadap batas stok minimum
                        </Typography>
                      </Box>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Produk</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Barcode</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Subkategori</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Stok Min
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Stok Akhir
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Selisih
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Status Stok
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.priorityProducts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data produk
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.priorityProducts.map((row) => {
                                const badge = getStatusBadge(row.stock_status);
                                return (
                                  <TableRow key={row.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                      {row.product_name} ({row.unit})
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: "monospace" }}>{row.barcode || "-"}</TableCell>
                                    <TableCell>{row.subcategory_name}</TableCell>
                                    <TableCell align="center">
                                      {Number(row.min_stock).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                                      {Number(row.current_stock).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontWeight: 700,
                                        color: row.stock_gap <= 0 ? "#DC2626" : "#D97706",
                                      }}
                                    >
                                      {row.stock_gap >= 0 ? "+" : ""}
                                      {Number(row.stock_gap).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={badge.label}
                                        size="small"
                                        color={badge.color}
                                        variant="outlined"
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">Rincian Mutasi & Valuasi Stok per Produk</Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`Semua (${data.productStocks.length})`}
                          size="small"
                          color={statusFilter === "ALL" ? "primary" : "default"}
                          onClick={() => handleStatusFilterChange("ALL")}
                          sx={{ cursor: "pointer" }}
                        />
                        <Chip
                          label={`Perlu Perhatian (${attentionCount})`}
                          size="small"
                          color={statusFilter === "ATTENTION" ? "warning" : "default"}
                          onClick={() => handleStatusFilterChange("ATTENTION")}
                          sx={{ cursor: "pointer" }}
                        />
                        <Chip
                          label={`Aman (${safeCount})`}
                          size="small"
                          color={statusFilter === "SAFE" ? "success" : "default"}
                          onClick={() => handleStatusFilterChange("SAFE")}
                          sx={{ cursor: "pointer" }}
                        />
                      </Box>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ width: "100%", overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 960 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Produk</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Barcode</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Subkategori / Brand</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Awal
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Masuk (+IN)
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Keluar (-OUT)
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Akhir
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Min
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Harga Modal
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Nilai Aset
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Status
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedProducts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada produk untuk filter ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedProducts.map((row) => {
                              const badge = getStatusBadge(row.stock_status);
                              return (
                                <TableRow key={row.id} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {row.product_name} ({row.unit})
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: "monospace" }}>{row.barcode || "-"}</TableCell>
                                  <TableCell>
                                    {row.subcategory_name || "-"} / {row.brand_name || "-"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontFamily: "monospace" }}>
                                    {Number(row.opening_stock).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}
                                  >
                                    +{Number(row.qty_in).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{ fontFamily: "monospace", color: "#DC2626", fontWeight: 600 }}
                                  >
                                    -{Number(row.qty_out).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                    {Number(row.current_stock).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="center">
                                    {Number(row.min_stock).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                    {formatCurrency(row.cost_price)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                    {formatCurrency(row.stock_value)}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={badge.label}
                                      size="small"
                                      color={badge.color}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                        {filteredProducts.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                Total
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {filteredProductTotals.opening.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontWeight: 700, fontFamily: "monospace", color: "#059669" }}
                              >
                                +{filteredProductTotals.inQty.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}
                              >
                                -{filteredProductTotals.outQty.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {filteredProductTotals.closing.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                -
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                -
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(filteredProductTotals.value)}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                -
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </TableContainer>

                    {filteredProducts.length > ROWS_PER_PAGE && (
                      <Box sx={{ mt: 2 }}>
                        <Pagination
                          page={page}
                          count={Math.ceil(filteredProducts.length / ROWS_PER_PAGE)}
                          total={filteredProducts.length}
                          rowsPerPage={ROWS_PER_PAGE}
                          onPageChange={setPage}
                        />
                      </Box>
                    )}
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
    flexWrap: "wrap",
    gap: 2,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
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
  modeToggle: {
    display: "flex",
    gap: 1,
    mb: 2,
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
