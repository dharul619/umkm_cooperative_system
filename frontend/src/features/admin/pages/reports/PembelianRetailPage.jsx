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
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaShoppingCart, FaStore, FaBox } from "react-icons/fa";
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

export default function PembelianRetailPage() {
  const [data, setData] = useState({
    summary: {},
    dailySummary: [],
    bySupplier: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    supplier_id: "",
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
      if (filters.supplier_id) params.append("supplier_id", filters.supplier_id);

      const response = await axiosInstance.get("/admin/reports/pembelian-retail", { params });
      const result = response.data;

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Gagal mengambil data laporan");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.supplier_id]);

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

  const handleTabChange = (_e, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const dailyTotals = useMemo(
    () =>
      data.dailySummary.reduce(
        (acc, curr) => {
          acc.purchases += Number(curr.total_purchases || 0);
          acc.amount += Number(curr.total_amount || 0);
          return acc;
        },
        { purchases: 0, amount: 0 }
      ),
    [data.dailySummary]
  );

  const supplierTotals = useMemo(
    () =>
      data.bySupplier.reduce(
        (acc, curr) => {
          acc.purchases += Number(curr.total_purchases || 0);
          acc.amount += Number(curr.total_amount || 0);
          return acc;
        },
        { purchases: 0, amount: 0 }
      ),
    [data.bySupplier]
  );

  const productTotals = useMemo(
    () =>
      data.topProducts.reduce(
        (acc, curr) => {
          acc.qty += Number(curr.total_qty || 0);
          acc.amount += Number(curr.total_amount || 0);
          return acc;
        },
        { qty: 0, amount: 0 }
      ),
    [data.topProducts]
  );

  const activeRows =
    activeTab === 0 ? data.dailySummary : activeTab === 1 ? data.bySupplier : data.topProducts;

  const paginatedRows = useMemo(
    () => activeRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [activeRows, page]
  );

  const handleExportPDF = () => {
    const labels = filters.filterLabels || {};
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);
    if (filters.supplier_id) filtersInfo.push(`Supplier: ${labels.supplier || filters.supplier_id}`);

    const summaryCards = [
      { key: "total_purchases", label: "Total Pembelian", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_amount", label: "Total Pengeluaran", format: "currency", color: "#DC2626", bgColor: "#fef2f2" },
      { key: "total_suppliers", label: "Supplier Dilayani", format: "number", color: "#059669", bgColor: "#ecfdf5" },
    ];

    const sections = [
      {
        title: "Pembelian Harian",
        subtitle: "Ringkasan pembelian per hari",
        headers: [
          { label: "Tanggal", align: "left" },
          { label: "Jumlah Pembelian", align: "center" },
          { label: "Total Pengeluaran", align: "right" },
        ],
        rows: data.dailySummary.map((d) => [
          formatDate(d.date),
          Number(d.total_purchases).toLocaleString("id-ID"),
          formatCurrency(d.total_amount),
        ]),
        footerRow: [
          "Total",
          dailyTotals.purchases.toLocaleString("id-ID"),
          formatCurrency(dailyTotals.amount),
        ],
      },
      {
        title: "Pembelian per Supplier",
        subtitle: "Total pembelian per supplier",
        headers: [
          { label: "Supplier", align: "left" },
          { label: "Kontak", align: "left" },
          { label: "Jumlah Pembelian", align: "center" },
          { label: "Total Pengeluaran", align: "right" },
        ],
        rows: data.bySupplier.map((s) => [
          s.supplier_name || "Tanpa Supplier",
          s.phone || "-",
          Number(s.total_purchases).toLocaleString("id-ID"),
          formatCurrency(s.total_amount),
        ]),
        footerRow: [
          { label: "Total", colSpan: 2, align: "left" },
          supplierTotals.purchases.toLocaleString("id-ID"),
          formatCurrency(supplierTotals.amount),
        ],
      },
      {
        title: "Produk Terbanyak Dibeli",
        subtitle: "Produk dengan volume pembelian tertinggi",
        headers: [
          { label: "Produk", align: "left" },
          { label: "Barcode", align: "center" },
          { label: "Kategori", align: "left" },
          { label: "Total Qty", align: "center" },
          { label: "Total Pengeluaran", align: "right" },
          { label: "Harga Rata-rata", align: "right" },
        ],
        rows: data.topProducts.map((p) => [
          `${p.product_name} (${p.unit})`,
          p.barcode || "-",
          `${p.category_name || "-"} / ${p.brand_name || "-"}`,
          Number(p.total_qty).toLocaleString("id-ID"),
          formatCurrency(p.total_amount),
          formatCurrency(p.avg_price),
        ]),
        footerRow: [
          { label: "Total", colSpan: 3, align: "left" },
          productTotals.qty.toLocaleString("id-ID"),
          formatCurrency(productTotals.amount),
          "-",
        ],
      },
    ];

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN PEMBELIAN RETAIL",
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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Pembelian Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Rekap pembelian barang stok dan supplier
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

      {/* Filter (Tanggal + Supplier) */}
      <ReportFilter
        onFilterChange={handleFilterChange}
        loading={loading}
        hideCategory={true}
        showSupplierFilter={true}
      />

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
          <Box sx={styles.summaryContainer}>
            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Total Pembelian
              </Typography>
              <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                {Number(data.summary.total_purchases || 0).toLocaleString("id-ID")}
              </Typography>
            </Box>
            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Total Pengeluaran
              </Typography>
              <Typography variant="h5" sx={{ color: "#DC2626", fontWeight: 700 }}>
                {formatCurrency(data.summary.total_amount)}
              </Typography>
            </Box>
            <Box sx={styles.summaryCard}>
              <Typography variant="caption" color="text.secondary">
                Supplier Dilayani
              </Typography>
              <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                {Number(data.summary.total_suppliers || 0).toLocaleString("id-ID")}
              </Typography>
            </Box>
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

          {/* Tabs */}
          {!loading && !error && (
            <>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
              >
                <Tab icon={<FaShoppingCart />} label="Harian" iconPosition="start" />
                <Tab icon={<FaStore />} label="Per Supplier" iconPosition="start" />
                <Tab icon={<FaBox />} label="Produk" iconPosition="start" />
              </Tabs>

              <Card>
                <CardContent>
                  {activeTab === 0 && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Pembelian Harian
                      </Typography>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Jumlah Pembelian
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                Total Pengeluaran
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paginatedRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data untuk periode ini
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedRows.map((row, idx) => (
                                <TableRow key={row.date || idx} hover>
                                  <TableCell>{formatDate(row.date)}</TableCell>
                                  <TableCell align="center">
                                    {Number(row.total_purchases).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", color: "#DC2626" }}>
                                    {formatCurrency(row.total_amount)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                          {data.dailySummary.length > 0 && (
                            <TableFooter>
                              <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                  {dailyTotals.purchases.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}
                                >
                                  {formatCurrency(dailyTotals.amount)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          )}
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  {activeTab === 1 && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Pembelian per Supplier
                      </Typography>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Supplier</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Kontak</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Alamat</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Jumlah Pembelian
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                Total Pengeluaran
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paginatedRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data supplier
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedRows.map((row, idx) => (
                                <TableRow key={row.supplier_id || idx} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {row.supplier_name || "Tanpa Supplier"}
                                  </TableCell>
                                  <TableCell>{row.phone || "-"}</TableCell>
                                  <TableCell sx={{ maxWidth: 200 }}>{row.address || "-"}</TableCell>
                                  <TableCell align="center">
                                    {Number(row.total_purchases).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", color: "#DC2626" }}>
                                    {formatCurrency(row.total_amount)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                          {data.bySupplier.length > 0 && (
                            <TableFooter>
                              <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                                <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                  Total
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                  {supplierTotals.purchases.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}
                                >
                                  {formatCurrency(supplierTotals.amount)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          )}
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  {activeTab === 2 && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Produk Terbanyak Dibeli
                      </Typography>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Produk</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Barcode</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Kategori</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Total Qty
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                Total Pengeluaran
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                Harga Rata-rata
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paginatedRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data produk
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedRows.map((row, idx) => (
                                <TableRow key={row.product_id || idx} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {row.product_name} ({row.unit})
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: "monospace" }}>{row.barcode || "-"}</TableCell>
                                  <TableCell>
                                    {row.category_name || "-"} / {row.brand_name || "-"}
                                  </TableCell>
                                  <TableCell align="center">
                                    {Number(row.total_qty).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", color: "#DC2626" }}>
                                    {formatCurrency(row.total_amount)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                    {formatCurrency(row.avg_price)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                          {data.topProducts.length > 0 && (
                            <TableFooter>
                              <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                                <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                  Total
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                  {productTotals.qty.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}
                                >
                                  {formatCurrency(productTotals.amount)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                  -
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
