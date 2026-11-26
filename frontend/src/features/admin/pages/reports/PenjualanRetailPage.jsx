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
import { FaPrint, FaChartLine, FaList } from "react-icons/fa";
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

export default function PenjualanRetailPage() {
  const [summary, setSummary] = useState(null);
  const [dailySummary, setDailySummary] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    mode: "summary",
    filterLabels: {},
  });

  const fetchReport = useCallback(async () => {
    if (!filters.from || !filters.to) return;

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
  }, [
    filters.from,
    filters.to,
    filters.category_id,
    filters.subcategory_id,
    filters.brand_id,
    filters.mode,
  ]);

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

  const dailyTotals = useMemo(
    () =>
      dailySummary.reduce(
        (acc, curr) => {
          acc.transactions += Number(curr.total_transactions || 0);
          acc.sales += Number(curr.total_penjualan || 0);
          acc.profit += Number(curr.total_profit || 0);
          acc.kopi += Number(curr.kopi_share || 0);
          return acc;
        },
        { transactions: 0, sales: 0, profit: 0, kopi: 0 }
      ),
    [dailySummary]
  );

  const productTotals = useMemo(
    () =>
      productDetails.reduce(
        (acc, curr) => {
          acc.qty += Number(curr.total_qty || 0);
          acc.sales += Number(curr.total_penjualan || 0);
          acc.profit += Number(curr.total_profit || 0);
          return acc;
        },
        { qty: 0, sales: 0, profit: 0 }
      ),
    [productDetails]
  );

  const activeRows = filters.mode === "summary" ? dailySummary : productDetails;
  const paginatedRows = useMemo(
    () => activeRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [activeRows, page]
  );

  const handleExportPDF = () => {
    const labels = filters.filterLabels || {};
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);
    if (filters.category_id) filtersInfo.push(`Kategori: ${labels.category || filters.category_id}`);
    if (filters.subcategory_id) filtersInfo.push(`Sub Kategori: ${labels.subcategory || filters.subcategory_id}`);
    if (filters.brand_id) filtersInfo.push(`Brand: ${labels.brand || filters.brand_id}`);

    const sections =
      filters.mode === "summary"
        ? [
            {
              title: "Ringkasan Harian",
              subtitle: "Total penjualan per hari dalam periode terpilih",
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
              footerRow: [
                "Total",
                dailyTotals.transactions.toLocaleString("id-ID"),
                formatCurrency(dailyTotals.sales),
                formatCurrency(dailyTotals.profit),
                formatCurrency(dailyTotals.kopi),
              ],
            },
          ]
        : [
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
              footerRow: [
                { label: "Total", colSpan: 3, align: "left" },
                productTotals.qty.toLocaleString("id-ID"),
                formatCurrency(productTotals.sales),
                formatCurrency(productTotals.profit),
              ],
            },
          ];

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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Penjualan Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Ringkasan penjualan, profit, dan rincian produk terjual
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Export PDF">
            <span>
              <AppButton
                color="primary"
                onClick={handleExportPDF}
                startIcon={<FaPrint />}
                disabled={loading || !summary}
              >
                Export PDF
              </AppButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter */}
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
            <Card>
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
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.date || idx} hover>
                                <TableCell>{formatDate(row.date)}</TableCell>
                                <TableCell align="center">
                                  {Number(row.total_transactions).toLocaleString("id-ID")}
                                </TableCell>
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
                        {dailySummary.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {dailyTotals.transactions.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(dailyTotals.sales)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(dailyTotals.profit)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(dailyTotals.kopi)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
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
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.id || idx} hover>
                                <TableCell>
                                  {row.product_name} ({row.unit})
                                </TableCell>
                                <TableCell sx={{ fontFamily: "monospace" }}>{row.barcode || "-"}</TableCell>
                                <TableCell>
                                  {row.category_name || "-"} / {row.subcategory_name || "-"}
                                </TableCell>
                                <TableCell align="center">
                                  {Number(row.total_qty).toLocaleString("id-ID")}
                                </TableCell>
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
                        {productDetails.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                Total
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {productTotals.qty.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(productTotals.sales)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(productTotals.profit)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </TableContainer>
                  </>
                )}

                {activeRows.length > ROWS_PER_PAGE && (
                  <Box sx={{ mt: 2 }}>
                    <Pagination
                      page={page}
                      count={Math.ceil(activeRows.length / ROWS_PER_PAGE)}
                      total={activeRows.length}
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
