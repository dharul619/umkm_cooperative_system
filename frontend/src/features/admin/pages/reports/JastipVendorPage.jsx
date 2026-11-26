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
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  TableFooter,
} from "@mui/material";
import { FaPrint, FaChartLine, FaList, FaStore } from "react-icons/fa";
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

export default function JastipVendorPage() {
  const [data, setData] = useState({
    summary: {},
    menuDetails: [],
    vendorDetails: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    mode: "summary",
    vendor_id: "",
    session_id: "",
    filterLabels: {},
  });

  const fetchReport = useCallback(async () => {
    if (!filters.session_id && (!filters.from || !filters.to)) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.vendor_id) params.append("vendor_id", filters.vendor_id);
      if (filters.session_id) params.append("session_id", filters.session_id);
      params.append("mode", "details");

      const response = await axiosInstance.get("/admin/reports/pesanan-jastip/details", { params });
      const result = response.data;

      if (result.success) {
        setData({
          summary: result.data.summary || {},
          menuDetails: result.data.menuDetails || [],
          vendorDetails: result.data.vendorDetails || [],
        });
      } else {
        setError(result.message || "Gagal mengambil data laporan");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.vendor_id, filters.session_id]);

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

  const summaryTotals = useMemo(
    () =>
      data.vendorDetails.reduce(
        (acc, curr) => {
          acc.orders += Number(curr.total_orders || 0);
          acc.items += Number(curr.total_items || 0);
          acc.subtotal += Number(curr.total_penjualan || 0);
          acc.ops += Number(curr.total_profit || 0);
          acc.sales += Number(curr.total_penjualan || 0) + Number(curr.total_profit || 0);
          return acc;
        },
        { orders: 0, items: 0, subtotal: 0, ops: 0, sales: 0 }
      ),
    [data.vendorDetails]
  );

  const detailsTotals = useMemo(
    () =>
      data.menuDetails.reduce(
        (acc, curr) => {
          acc.qty += Number(curr.total_qty || 0);
          acc.subtotal += Number(curr.total_penjualan || 0);
          acc.ops += Number(curr.total_profit || 0);
          acc.sales += Number(curr.total_penjualan || 0) + Number(curr.total_profit || 0);
          return acc;
        },
        { qty: 0, subtotal: 0, ops: 0, sales: 0 }
      ),
    [data.menuDetails]
  );

  const activeRows = filters.mode === "summary" ? data.vendorDetails : data.menuDetails;
  const paginatedRows = useMemo(
    () => activeRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [activeRows, page]
  );

  const handleExportPDF = () => {
    const labels = filters.filterLabels || {};
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);
    if (filters.vendor_id) filtersInfo.push(`Vendor: ${labels.vendor || filters.vendor_id}`);
    if (filters.session_id) filtersInfo.push(`Sesi: ${labels.session || filters.session_id}`);

    const sections =
      filters.mode === "summary"
        ? [
            {
              title: "Ringkasan per Vendor",
              subtitle: "Total penjualan per vendor jastip",
              headers: [
                { label: "Vendor", align: "left" },
                { label: "No. Telepon", align: "left" },
                { label: "Total Pesanan", align: "center" },
                { label: "Total Item", align: "center" },
                { label: "Subtotal Menu", align: "right" },
                { label: "Biaya Operasional", align: "right" },
                { label: "Total Penjualan", align: "right" },
              ],
              rows: data.vendorDetails.map((v) => [
                v.vendor_name,
                v.vendor_phone || "-",
                Number(v.total_orders).toLocaleString("id-ID"),
                Number(v.total_items).toLocaleString("id-ID"),
                formatCurrency(v.total_penjualan),
                formatCurrency(v.total_profit),
                formatCurrency(Number(v.total_penjualan) + Number(v.total_profit)),
              ]),
              footerRow: [
                { label: "Total", colSpan: 2, align: "left" },
                summaryTotals.orders.toLocaleString("id-ID"),
                summaryTotals.items.toLocaleString("id-ID"),
                formatCurrency(summaryTotals.subtotal),
                formatCurrency(summaryTotals.ops),
                formatCurrency(summaryTotals.sales),
              ],
            },
          ]
        : [
            {
              title: "Detail Penjualan Menu",
              subtitle: "Rincian penjualan menu per vendor",
              headers: [
                { label: "Menu", align: "left" },
                { label: "Vendor", align: "left" },
                { label: "Qty Terjual", align: "center" },
                { label: "Subtotal Menu", align: "right" },
                { label: "Biaya Operasional", align: "right" },
                { label: "Total Penjualan", align: "right" },
              ],
              rows: data.menuDetails.map((m) => [
                m.menu_name,
                m.vendor_name,
                Number(m.total_qty).toLocaleString("id-ID"),
                formatCurrency(m.total_penjualan),
                formatCurrency(m.total_profit),
                formatCurrency(Number(m.total_penjualan) + Number(m.total_profit)),
              ]),
              footerRow: [
                { label: "Total", colSpan: 2, align: "left" },
                detailsTotals.qty.toLocaleString("id-ID"),
                formatCurrency(detailsTotals.subtotal),
                formatCurrency(detailsTotals.ops),
                formatCurrency(detailsTotals.sales),
              ],
            },
          ];

    const summaryCards = [
      { key: "total_orders", label: "Total Pesanan", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_members", label: "Total Customer", format: "number", color: "#2563EB", bgColor: "#eff6ff" },
      { key: "total_profit", label: "Biaya Operasional", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "grand_total_sales", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
    ];

    const pdfContent = generateProfessionalPDF({
      title:
        filters.mode === "details"
          ? "LAPORAN DETAIL PESANAN JASTIP PER VENDOR"
          : "LAPORAN RINGKASAN PESANAN JASTIP PER VENDOR",
      reportType: "Jastip",
      filters,
      summary: {
        ...data.summary,
        grand_total_sales:
          Number(data.summary.total_penjualan || 0) + Number(data.summary.total_profit || 0),
      },
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
            Laporan Pesanan Jastip per Vendor
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Rekapitulasi penjualan dan item menu berdasarkan vendor
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Export PDF">
            <span>
              <AppButton
                color="primary"
                onClick={handleExportPDF}
                startIcon={<FaPrint />}
                disabled={loading || (!filters.session_id && (!filters.from || !filters.to))}
              >
                Export PDF
              </AppButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter */}
      <ReportFilter
        onFilterChange={handleFilterChange}
        loading={loading}
        showJastipFilters={true}
        isJastip={true}
      />

      {!filters.session_id && (!filters.from || !filters.to) ? (
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
          {data.summary && (
            <Box sx={styles.summaryContainer}>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Pesanan
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {Number(data.summary.total_orders || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Customer
                </Typography>
                <Typography variant="h5" sx={{ color: "#2563EB", fontWeight: 700 }}>
                  {Number(data.summary.total_members || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Biaya Operasional
                </Typography>
                <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
                  {formatCurrency(data.summary.total_profit)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Penjualan
                </Typography>
                <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                  {formatCurrency(
                    Number(data.summary.total_penjualan || 0) + Number(data.summary.total_profit || 0)
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Mode Toggle */}
          <Box sx={styles.modeToggle}>
            <Chip
              icon={<FaChartLine />}
              label="Ringkasan Vendor"
              color={filters.mode === "summary" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "summary" })}
              sx={{ cursor: "pointer" }}
            />
            <Chip
              icon={<FaList />}
              label="Detail Menu"
              color={filters.mode === "details" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "details" })}
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
            <Card>
              <CardContent>
                {filters.mode === "summary" ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <FaStore style={{ color: "#7A2E3A" }} />
                      <Typography variant="h6">Ringkasan per Vendor</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>No. Telepon</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Alamat</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Pesanan
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Total Item
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Subtotal Menu
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Biaya Operasional
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Total Penjualan
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data vendor untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.vendor_id || idx} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{row.vendor_name}</TableCell>
                                <TableCell>{row.vendor_phone || "-"}</TableCell>
                                <TableCell
                                  sx={{
                                    maxWidth: 220,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.vendor_address || "-"}
                                </TableCell>
                                <TableCell align="center">
                                  {Number(row.total_orders).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="center">
                                  {Number(row.total_items).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                  {formatCurrency(Number(row.total_penjualan) + Number(row.total_profit))}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.vendorDetails.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                Total
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {summaryTotals.orders.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {summaryTotals.items.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.subtotal)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.ops)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.sales)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <FaList style={{ color: "#7A2E3A" }} />
                      <Typography variant="h6">Detail Penjualan Menu</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Menu</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Qty Terjual
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Subtotal Menu
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Biaya Operasional
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Total Penjualan
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data penjualan menu
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.menu_id || idx} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{row.menu_name}</TableCell>
                                <TableCell>{row.vendor_name}</TableCell>
                                <TableCell align="center">
                                  {Number(row.total_qty).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                  {formatCurrency(Number(row.total_penjualan) + Number(row.total_profit))}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.menuDetails.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                                Total
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {detailsTotals.qty.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.subtotal)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.ops)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.sales)}
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
  modeToggle: {
    display: "flex",
    gap: 1,
    mb: 2,
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
