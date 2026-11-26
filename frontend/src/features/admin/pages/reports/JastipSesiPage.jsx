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

export default function JastipSesiPage() {
  const [data, setData] = useState({
    summary: {},
    dailySummary: [],
    byStatus: [],
    transactionDetails: [],
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
      params.append("mode", filters.mode);

      const endpoint =
        filters.mode === "details"
          ? "/admin/reports/pesanan-jastip/details"
          : "/admin/reports/pesanan-jastip/summary";

      const response = await axiosInstance.get(endpoint, { params });
      const result = response.data;

      if (result.success) {
        setData((prev) => ({
          ...prev,
          ...result.data,
        }));
      } else {
        setError(result.message || "Gagal mengambil data laporan");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.vendor_id, filters.session_id, filters.mode]);

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
      data.dailySummary.reduce(
        (acc, curr) => {
          acc.orders += Number(curr.total_orders || 0);
          acc.subtotal += Number(curr.total_penjualan || 0);
          acc.ops += Number(curr.total_profit || 0);
          acc.sales += Number(curr.total_penjualan || 0) + Number(curr.total_profit || 0);
          return acc;
        },
        { orders: 0, subtotal: 0, ops: 0, sales: 0 }
      ),
    [data.dailySummary]
  );

  const detailsTotals = useMemo(
    () =>
      (data.transactionDetails || []).reduce(
        (acc, curr) => {
          acc.qty += Number(curr.qty || 0);
          acc.subtotal += Number(curr.subtotal || 0);
          acc.ops += Number(curr.profit || 0);
          acc.sales += Number(curr.subtotal || 0) + Number(curr.profit || 0);
          return acc;
        },
        { qty: 0, subtotal: 0, ops: 0, sales: 0 }
      ),
    [data.transactionDetails]
  );

  const activeRows = useMemo(
    () => (filters.mode === "summary" ? data.dailySummary : data.transactionDetails || []),
    [filters.mode, data.dailySummary, data.transactionDetails]
  );
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

    const totalUniqueMembers = Number(data.summary.total_members || 0);

    const sections =
      filters.mode === "summary"
        ? [
            {
              title: "Pesanan Harian",
              subtitle: "Ringkasan pesanan jastip per hari",
              headers: [
                { label: "Tanggal", align: "left" },
                { label: "Total Pesanan", align: "center" },
                { label: "Customer", align: "center" },
                { label: "Subtotal Menu", align: "right" },
                { label: "Biaya Operasional", align: "right" },
                { label: "Total Penjualan", align: "right" },
              ],
              rows: data.dailySummary.map((d) => [
                formatDate(d.date),
                Number(d.total_orders).toLocaleString("id-ID"),
                Number(d.total_members).toLocaleString("id-ID"),
                formatCurrency(d.total_penjualan),
                formatCurrency(d.total_profit),
                formatCurrency(Number(d.total_penjualan) + Number(d.total_profit)),
              ]),
              footerRow: [
                "Total",
                summaryTotals.orders.toLocaleString("id-ID"),
                `${totalUniqueMembers.toLocaleString("id-ID")} unik`,
                formatCurrency(summaryTotals.subtotal),
                formatCurrency(summaryTotals.ops),
                formatCurrency(summaryTotals.sales),
              ],
            },
          ]
        : [
            {
              title: "Detail Transaksi Jastip",
              subtitle: "Rincian pesanan per item jastip",
              headers: [
                { label: "Tanggal", align: "left" },
                { label: "Member", align: "left" },
                { label: "Menu", align: "left" },
                { label: "Vendor", align: "left" },
                { label: "Qty", align: "center" },
                { label: "Subtotal Menu", align: "right" },
                { label: "Biaya Operasional", align: "right" },
                { label: "Total Penjualan", align: "right" },
              ],
              rows: (data.transactionDetails || []).map((t) => [
                formatDate(t.order_date),
                t.member_name,
                t.menu_name,
                t.vendor_name,
                Number(t.qty).toLocaleString("id-ID"),
                formatCurrency(t.subtotal),
                formatCurrency(t.profit),
                formatCurrency(Number(t.subtotal) + Number(t.profit)),
              ]),
              footerRow: [
                { label: "Total", colSpan: 4, align: "left" },
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
          ? "LAPORAN DETAIL PESANAN JASTIP PER SESI"
          : "LAPORAN RINGKASAN PESANAN JASTIP PER SESI",
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

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "warning",
      PROCESSING: "info",
      READY: "success",
      DONE: "success",
      CANCELLED: "error",
    };
    return colors[status] || "default";
  };

  const totalUniqueMembers = Number(data.summary.total_members || 0);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Pesanan Jastip per Sesi
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Ringkasan harian dan rincian transaksi jastip per sesi
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
                  {totalUniqueMembers.toLocaleString("id-ID")}
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
              label="Ringkasan"
              color={filters.mode === "summary" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "summary" })}
              sx={{ cursor: "pointer" }}
            />
            <Chip
              icon={<FaList />}
              label="Rincian Item"
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
            <>
              {filters.mode === "summary" ? (
                <>
                  {/* Status Summary */}
                  {data.byStatus && data.byStatus.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Status Pesanan
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                          {data.byStatus.map((s, idx) => (
                            <Chip
                              key={s.status || idx}
                              label={`${s.status}: ${Number(s.total).toLocaleString("id-ID")}`}
                              color={getStatusColor(s.status)}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* Daily Summary Table */}
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <FaChartLine style={{ color: "#7A2E3A" }} />
                        <Typography variant="h6">Ringkasan Harian</Typography>
                      </Box>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Pesanan
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Customer
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
                                  Tidak ada data untuk periode ini
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedRows.map((row, idx) => (
                                <TableRow key={row.date || idx} hover>
                                  <TableCell>{formatDate(row.date)}</TableCell>
                                  <TableCell align="center">
                                    {Number(row.total_orders).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="center">
                                    {Number(row.total_members).toLocaleString("id-ID")}
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
                          {data.dailySummary.length > 0 && (
                            <TableFooter>
                              <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                  {summaryTotals.orders.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                  {totalUniqueMembers.toLocaleString("id-ID")}
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
              ) : (
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <FaList style={{ color: "#7A2E3A" }} />
                      <Typography variant="h6">Rincian Transaksi Sesi</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Member</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Menu</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Qty
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Harga Satuan
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
                              <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada rincian transaksi jastip untuk periode/filter ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.detail_id || idx} hover>
                                <TableCell>{formatDate(row.order_date)}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{row.member_name}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{row.menu_name}</TableCell>
                                <TableCell>{row.vendor_name}</TableCell>
                                <TableCell align="center">
                                  {Number(row.qty).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.price)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.subtotal)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.profit)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                  {formatCurrency(Number(row.subtotal) + Number(row.profit))}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.transactionDetails && data.transactionDetails.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                                Total
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {detailsTotals.qty.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell />
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
