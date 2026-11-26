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
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaCheckCircle, FaClock, FaTimesCircle, FaChartBar, FaList } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import { AppButton, Pagination } from "../../../../shared/components";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

const ROWS_PER_PAGE = 20;

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
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });

  const fetchReport = useCallback(async () => {
    if (!filters.from || !filters.to) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);

      const response = await axiosInstance.get("/admin/reports/pembayaran-jastip", { params });
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
  }, [filters.from, filters.to]);

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
          acc.payments += Number(curr.total_payments || 0);
          acc.amount += Number(curr.total_amount || 0);
          return acc;
        },
        { payments: 0, amount: 0 }
      ),
    [data.dailySummary]
  );

  const activeRows = activeTab === 0 ? data.dailySummary : data.recentPayments;
  const paginatedRows = useMemo(
    () => activeRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [activeRows, page]
  );

  const handleExportPDF = () => {
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);

    const summaryCards = [
      { key: "total_payments", label: "Total Pembayaran", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_amount", label: "Total Nominal", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "unique_members", label: "Member Unik", format: "number", color: "#2563EB", bgColor: "#eff6ff" },
      { key: "unique_orders", label: "Sesi / Order Unik", format: "number", color: "#D97706", bgColor: "#fffbeb" },
    ];

    const sections =
      activeTab === 0
        ? [
            {
              title: "Ringkasan per Metode Pembayaran",
              subtitle: "Distribusi transaksi berdasarkan metode pembayaran",
              headers: [
                { label: "Metode Pembayaran", align: "left" },
                { label: "Jumlah Transaksi", align: "center" },
                { label: "Total Nominal", align: "right" },
              ],
              rows: data.byMethod.map((m) => [
                m.payment_method || "-",
                Number(m.total_payments).toLocaleString("id-ID"),
                formatCurrency(m.total_amount),
              ]),
            },
            {
              title: "Ringkasan per Status Pembayaran",
              subtitle: "Distribusi status pembayaran",
              headers: [
                { label: "Status", align: "left" },
                { label: "Jumlah Transaksi", align: "center" },
                { label: "Member Unik", align: "center" },
                { label: "Total Nominal", align: "right" },
              ],
              rows: data.byState.map((s) => [
                s.state || "-",
                Number(s.total_payments).toLocaleString("id-ID"),
                Number(s.unique_members).toLocaleString("id-ID"),
                formatCurrency(s.total_amount),
              ]),
            },
            {
              title: "Ringkasan Pembayaran Harian (Settled)",
              subtitle: "Total pembayaran masuk per hari",
              headers: [
                { label: "Tanggal", align: "left" },
                { label: "Jumlah Pembayaran", align: "center" },
                { label: "Total Nominal", align: "right" },
              ],
              rows: data.dailySummary.map((d) => [
                formatDate(d.date),
                Number(d.total_payments).toLocaleString("id-ID"),
                formatCurrency(d.total_amount),
              ]),
              footerRow: [
                "Total",
                dailyTotals.payments.toLocaleString("id-ID"),
                formatCurrency(dailyTotals.amount),
              ],
            },
          ]
        : [
            {
              title: "Rincian Transaksi Pembayaran Jastip",
              subtitle: "Daftar transaksi pembayaran dan pesanan member",
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
                `<strong>${p.member_name || "-"}</strong> (ID: ${p.member_id || "-"})<br/><span style="font-size: 8px; color: #666;">${p.division_name || ""} - ${p.department_name || ""}</span>`,
                `<strong>${p.coordinator_name || "-"}</strong> (ID: ${p.coordinator_id || "-"})<br/><span style="font-size: 8px; color: #666;">Sesi #${p.order_id}</span>`,
                p.vendor_names || "-",
                p.items_summary || "-",
                p.payment_method || "-",
                formatCurrency(p.amount),
                p.state,
              ]),
            },
          ];

    const pdfContent = generateProfessionalPDF({
      title:
        activeTab === 0
          ? "LAPORAN RINGKASAN PEMBAYARAN JASTIP"
          : "LAPORAN RINCIAN PEMBAYARAN JASTIP",
      reportType: "Jastip",
      filters: { ...filters, mode: activeTab === 0 ? "summary" : "details" },
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
    return icons[state] || null;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Pembayaran Jastip
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Rekapitulasi pembayaran jastip per metode, status, dan transaksi
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

      {/* Filter (Tanggal saja, tanpa Kategori Retail) */}
      <ReportFilter
        onFilterChange={handleFilterChange}
        loading={loading}
        hideCategory={true}
        isJastip={true}
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
                  Total Nominal
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
                <Tab icon={<FaChartBar />} label="Ringkasan" iconPosition="start" />
                <Tab icon={<FaList />} label="Rincian Transaksi" iconPosition="start" />
              </Tabs>

              {/* Tab 0: Ringkasan (byMethod, byState, dailySummary) */}
              {activeTab === 0 && (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                      mb: 3,
                    }}
                  >
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Metode Pembayaran
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                                <TableCell sx={{ color: "white", fontWeight: 600 }}>Metode</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                  Jumlah
                                </TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                  Total Nominal
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.byMethod.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                    Tidak ada data
                                  </TableCell>
                                </TableRow>
                              ) : (
                                data.byMethod.map((row, idx) => (
                                  <TableRow key={row.payment_method || idx} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.payment_method || "-"}</TableCell>
                                    <TableCell align="center">
                                      {Number(row.total_payments).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                      {formatCurrency(row.total_amount)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Status Pembayaran
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                                <TableCell sx={{ color: "white", fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                  Transaksi
                                </TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                  Member
                                </TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                  Total Nominal
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.byState.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                    Tidak ada data
                                  </TableCell>
                                </TableRow>
                              ) : (
                                data.byState.map((row, idx) => (
                                  <TableRow key={row.state || idx} hover>
                                    <TableCell>
                                      <Chip
                                        label={row.state}
                                        size="small"
                                        color={getStateColor(row.state)}
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      {Number(row.total_payments).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell align="center">
                                      {Number(row.unique_members).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                      {formatCurrency(row.total_amount)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Ringkasan Pembayaran Harian (Settled)
                      </Typography>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                                Jumlah Pembayaran
                              </TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                                Total Nominal
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
                                    {Number(row.total_payments).toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
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
                                  {dailyTotals.payments.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                  {formatCurrency(dailyTotals.amount)}
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
              )}

              {/* Tab 1: Rincian Transaksi */}
              {activeTab === 1 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Rincian Transaksi Pembayaran
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ width: "100%", overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 1100 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>ID / Ref</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Customer (Member)</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Coordinator</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Pesanan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Metode
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Total
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Status
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data transaksi pembayaran
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.id || idx} hover>
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
                                      {row.items_summary.split(", ").map((item, index) => {
                                        const match = item.match(/(.+)\s\((\d+)\)/);
                                        if (match) {
                                          const [, name, qty] = match;
                                          return (
                                            <Box
                                              key={index}
                                              sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 1.5,
                                                borderBottom: "1px dashed #f3f3f3",
                                                pb: 0.25,
                                              }}
                                            >
                                              <span style={{ fontWeight: 500, color: "#333" }}>{name}</span>
                                              <span style={{ color: "#e85d75", fontWeight: 700, whiteSpace: "nowrap" }}>
                                                x{qty}
                                              </span>
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
                                    <Chip
                                      label={row.state}
                                      size="small"
                                      color={getStateColor(row.state)}
                                      variant="outlined"
                                    />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
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
