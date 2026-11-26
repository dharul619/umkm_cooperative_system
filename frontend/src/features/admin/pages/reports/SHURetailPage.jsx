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
  Tooltip,
} from "@mui/material";
import { FaPrint, FaChartLine } from "react-icons/fa";
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

export default function SHURetailPage() {
  const [data, setData] = useState({
    summary: {},
    monthlySummary: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

      const response = await axiosInstance.get("/admin/reports/shu-retail", { params });
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

  const monthlyTotals = useMemo(
    () =>
      data.monthlySummary.reduce(
        (acc, curr) => {
          acc.transactions += Number(curr.total_transactions || 0);
          acc.sales += Number(curr.total_penjualan || 0);
          acc.profit += Number(curr.total_profit || 0);
          acc.kopi += Number(curr.kopi_share || 0);
          acc.coordinator += Number(curr.coordinator_share || 0);
          return acc;
        },
        { transactions: 0, sales: 0, profit: 0, kopi: 0, coordinator: 0 }
      ),
    [data.monthlySummary]
  );

  const paginatedRows = useMemo(
    () => data.monthlySummary.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [data.monthlySummary, page]
  );

  const handleExportPDF = () => {
    const filtersInfo = [];
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);

    const summaryCards = [
      { key: "total_transactions", label: "Total Transaksi", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_penjualan", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_profit", label: "Total Profit", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "kopi_share", label: "SHU Koperasi (80%)", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
      { key: "coordinator_share", label: "SHU Coordinator (20%)", format: "currency", color: "#E85D75", bgColor: "#fff5f6" },
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
          { label: "SHU Koperasi (80%)", align: "right" },
          { label: "SHU Coordinator (20%)", align: "right" },
        ],
        rows: data.monthlySummary.map((m) => [
          m.month_name,
          Number(m.total_transactions).toLocaleString("id-ID"),
          formatCurrency(m.total_penjualan),
          formatCurrency(m.total_profit),
          formatCurrency(m.kopi_share),
          formatCurrency(m.coordinator_share),
        ]),
        footerRow: [
          "Total",
          monthlyTotals.transactions.toLocaleString("id-ID"),
          formatCurrency(monthlyTotals.sales),
          formatCurrency(monthlyTotals.profit),
          formatCurrency(monthlyTotals.kopi),
          formatCurrency(monthlyTotals.coordinator),
        ],
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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Pembagian SHU - Warung Retail
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Rekapitulasi pembagian SHU penjualan warung retail
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

      {/* Filter (Tanggal saja) */}
      <ReportFilter onFilterChange={handleFilterChange} loading={loading} hideCategory={true} />

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
                  SHU Koperasi (80%)
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {formatCurrency(data.summary.kopi_share)}
                </Typography>
              </Box>
              <Box sx={{ ...styles.summaryCard, borderColor: "#E85D75", borderWidth: 2, borderStyle: "solid" }}>
                <Typography variant="caption" color="text.secondary">
                  SHU Coordinator (20%)
                </Typography>
                <Typography variant="h5" sx={{ color: "#E85D75", fontWeight: 700 }}>
                  {formatCurrency(data.summary.coordinator_share)}
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
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">
                          Transaksi
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                          Total Penjualan
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                          Total Profit
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                          SHU Koperasi (80%)
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                          SHU Coordinator (20%)
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
                          <TableRow key={row.month || idx} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{row.month_name}</TableCell>
                            <TableCell align="center">
                              {Number(row.total_transactions).toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                              {formatCurrency(row.total_penjualan)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                              {formatCurrency(row.total_profit)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#7A2E3A" }}>
                              {formatCurrency(row.kopi_share)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#E85D75" }}>
                              {formatCurrency(row.coordinator_share)}
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
                            {monthlyTotals.transactions.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                            {formatCurrency(monthlyTotals.sales)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                            {formatCurrency(monthlyTotals.profit)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#7A2E3A" }}>
                            {formatCurrency(monthlyTotals.kopi)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#E85D75" }}>
                            {formatCurrency(monthlyTotals.coordinator)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </TableContainer>

                {data.monthlySummary.length > ROWS_PER_PAGE && (
                  <Box sx={{ mt: 2 }}>
                    <Pagination
                      page={page}
                      count={Math.ceil(data.monthlySummary.length / ROWS_PER_PAGE)}
                      total={data.monthlySummary.length}
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
