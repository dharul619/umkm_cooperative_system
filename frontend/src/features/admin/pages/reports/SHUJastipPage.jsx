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

export default function SHUJastipPage() {
  const [data, setData] = useState({
    summary: {},
    monthlySummary: [],
    sessionSHUDetails: [],
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

      const response = await axiosInstance.get("/admin/reports/shu-jastip", { params });
      const result = response.data;

      if (result.success) {
        setData({
          summary: result.data.summary || {},
          monthlySummary: result.data.monthlySummary || [],
          sessionSHUDetails: result.data.sessionSHUDetails || [],
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
      data.monthlySummary.reduce(
        (acc, curr) => {
          acc.orders += Number(curr.total_orders || 0);
          acc.sales += Number(curr.total_penjualan || 0);
          acc.profit += Number(curr.total_profit || 0);
          acc.kopi += Number(curr.kopi_share || 0);
          acc.coor += Number(curr.coor_share || 0);
          return acc;
        },
        { orders: 0, sales: 0, profit: 0, kopi: 0, coor: 0 }
      ),
    [data.monthlySummary]
  );

  const detailsTotals = useMemo(
    () =>
      data.sessionSHUDetails.reduce(
        (acc, curr) => {
          acc.sales += Number(curr.total_penjualan || 0);
          acc.profit += Number(curr.total_profit || 0);
          acc.kopi += Number(curr.kopi_share || 0);
          acc.coor += Number(curr.coor_share || 0);
          return acc;
        },
        { sales: 0, profit: 0, kopi: 0, coor: 0 }
      ),
    [data.sessionSHUDetails]
  );

  const totalUniqueCoordinators = Number(data.summary.total_coordinators || 0);
  const totalUniqueMembers = Number(data.summary.total_members || 0);

  const activeRows = filters.mode === "summary" ? data.monthlySummary : data.sessionSHUDetails;
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
              title: "SHU Bulanan - Jastip",
              subtitle: "Ringkasan SHU per bulan dari pesanan jastip",
              headers: [
                { label: "Bulan", align: "left" },
                { label: "Pesanan", align: "center" },
                { label: "Coordinator", align: "center" },
                { label: "Customer", align: "center" },
                { label: "Total Penjualan", align: "right" },
                { label: "Total Profit", align: "right" },
                { label: "Koperasi 50%", align: "right" },
                { label: "Coordinator 50%", align: "right" },
              ],
              rows: data.monthlySummary.map((m) => [
                m.month_name,
                Number(m.total_orders).toLocaleString("id-ID"),
                Number(m.total_coordinators).toLocaleString("id-ID"),
                Number(m.total_members).toLocaleString("id-ID"),
                formatCurrency(m.total_penjualan),
                formatCurrency(m.total_profit),
                formatCurrency(m.kopi_share),
                formatCurrency(m.coor_share),
              ]),
              footerRow: [
                "Total",
                summaryTotals.orders.toLocaleString("id-ID"),
                totalUniqueCoordinators.toLocaleString("id-ID"),
                totalUniqueMembers.toLocaleString("id-ID"),
                formatCurrency(summaryTotals.sales),
                formatCurrency(summaryTotals.profit),
                formatCurrency(summaryTotals.kopi),
                formatCurrency(summaryTotals.coor),
              ],
            },
          ]
        : [
            {
              title: "Rincian SHU Jastip per Sesi",
              subtitle: "Rincian SHU setiap sesi jastip",
              headers: [
                { label: "Tanggal", align: "left" },
                { label: "Sesi", align: "center" },
                { label: "Coordinator", align: "left" },
                { label: "Penjualan", align: "right" },
                { label: "Total Profit", align: "right" },
                { label: "Koperasi 50%", align: "right" },
                { label: "Coordinator 50%", align: "right" },
              ],
              rows: data.sessionSHUDetails.map((s) => [
                formatDate(s.date),
                `Sesi #${s.session_id}`,
                s.coordinator_name || "-",
                formatCurrency(s.total_penjualan),
                formatCurrency(s.total_profit),
                formatCurrency(s.kopi_share),
                formatCurrency(s.coor_share),
              ]),
              footerRow: [
                { label: "Total", colSpan: 3, align: "left" },
                formatCurrency(detailsTotals.sales),
                formatCurrency(detailsTotals.profit),
                formatCurrency(detailsTotals.kopi),
                formatCurrency(detailsTotals.coor),
              ],
            },
          ];

    const summaryCards = [
      { key: "total_orders", label: "Total Pesanan", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_penjualan", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_profit", label: "Total Profit", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "kopi_share", label: "Koperasi 50%", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
      { key: "coor_share", label: "Coordinator 50%", format: "currency", color: "#2563EB", bgColor: "#f0f7ff" },
    ];

    const pdfContent = generateProfessionalPDF({
      title: filters.mode === "details" ? "LAPORAN DETAIL SHU JASTIP" : "LAPORAN RINGKASAN SHU JASTIP",
      reportType: "Jastip",
      filters,
      summary: {
        ...data.summary,
        coor_share:
          data.summary.coor_share ?? (data.summary.total_profit ? data.summary.total_profit * 0.5 : 0),
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
            Pembagian SHU - Jastip
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Pembagian SHU 50% Koperasi dan 50% Koordinator
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
                  Koperasi 50%
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {formatCurrency(data.summary.kopi_share)}
                </Typography>
              </Box>
              <Box sx={{ ...styles.summaryCard, borderColor: "#2563EB", borderWidth: 2, borderStyle: "solid" }}>
                <Typography variant="caption" color="text.secondary">
                  Coordinator 50%
                </Typography>
                <Typography variant="h5" sx={{ color: "#2563EB", fontWeight: 700 }}>
                  {formatCurrency(
                    data.summary.coor_share ??
                      (data.summary.total_profit ? data.summary.total_profit * 0.5 : 0)
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Mode Toggle */}
          <Box sx={styles.modeToggle}>
            <Chip
              icon={<FaChartLine />}
              label="Ringkasan Bulanan"
              color={filters.mode === "summary" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "summary" })}
              sx={{ cursor: "pointer" }}
            />
            <Chip
              icon={<FaList />}
              label="Rincian per Sesi"
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
                      <FaChartLine style={{ color: "#7A2E3A" }} />
                      <Typography variant="h6">SHU Bulanan - Jastip</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Bulan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Pesanan
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Coordinator
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Customer
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Total Penjualan
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Total Profit
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Koperasi 50%
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Coordinator 50%
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data SHU untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.month || idx} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{row.month_name}</TableCell>
                                <TableCell align="center">
                                  {Number(row.total_orders).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell align="center">
                                  {Number(row.total_coordinators).toLocaleString("id-ID")}
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
                                <TableCell
                                  align="right"
                                  sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}
                                >
                                  {formatCurrency(row.kopi_share)}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontFamily: "monospace", color: "#2563EB", fontWeight: 600 }}
                                >
                                  {formatCurrency(row.coor_share)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.monthlySummary.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {summaryTotals.orders.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {totalUniqueCoordinators.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {totalUniqueMembers.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.sales)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.profit)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 700, fontFamily: "monospace", color: "#059669" }}
                              >
                                {formatCurrency(summaryTotals.kopi)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 700, fontFamily: "monospace", color: "#2563EB" }}
                              >
                                {formatCurrency(summaryTotals.coor)}
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
                      <Typography variant="h6">Rincian SHU Jastip per Sesi</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                              Sesi
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Coordinator</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Penjualan
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Total Profit
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Koperasi 50%
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                              Coordinator 50%
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada rincian sesi untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <TableRow key={row.session_id || idx} hover>
                                <TableCell>{formatDate(row.date)}</TableCell>
                                <TableCell align="center">Sesi #{row.session_id}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{row.coordinator_name || "-"}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}
                                >
                                  {formatCurrency(row.kopi_share)}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontFamily: "monospace", color: "#2563EB", fontWeight: 600 }}
                                >
                                  {formatCurrency(row.coor_share)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.sessionSHUDetails.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                Total
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.sales)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.profit)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 700, fontFamily: "monospace", color: "#059669" }}
                              >
                                {formatCurrency(detailsTotals.kopi)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 700, fontFamily: "monospace", color: "#2563EB" }}
                              >
                                {formatCurrency(detailsTotals.coor)}
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
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
