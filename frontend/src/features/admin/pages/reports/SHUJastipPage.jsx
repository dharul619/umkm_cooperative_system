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
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  TableFooter,
} from "@mui/material";
import { FaPrint, FaChartLine, FaList, FaWallet } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import AppButton from "../../../../shared/components/AppButton";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 3,
  },
  title: {
    fontWeight: 700,
    color: "#61414A",
  },
  subtitle: {
    color: "text.secondary",
    mt: 0.5,
  },
  modeToggle: {
    display: "flex",
    gap: 1,
    mb: 3,
  },
  summaryContainer: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
    gap: 2,
    mb: 3,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 2,
    p: 2,
    display: "flex",
    flexDirection: "column",
    gap: 0.5,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    py: 8,
    color: "#7A2E3A",
  },
};

export default function SHUJastipPage() {
  const [data, setData] = useState({
    summary: {},
    monthlySummary: [],
    sessionSHUDetails: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    mode: "summary",
    vendor_id: "",
    session_id: "",
  });

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    if (!filters.session_id && (!filters.from || !filters.to)) {
      setData({
        summary: {},
        monthlySummary: [],
        sessionSHUDetails: [],
      });
      return;
    }
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
        setData((prev) => ({
          ...prev,
          summary: result.data.summary || {},
          monthlySummary: result.data.monthlySummary || [],
          sessionSHUDetails: result.data.sessionSHUDetails || [],
        }));
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
    if (filters.from) filtersInfo.push(`Dari Tanggal: ${formatDate(filters.from)}`);
    if (filters.to) filtersInfo.push(`Ke Tanggal: ${formatDate(filters.to)}`);

    let sections = [];

    if (filters.mode === "summary") {
      sections = [
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
        },
      ];
    } else {
      sections = [
        {
          title: "Rincian SHU Jastip Sesi",
          subtitle: "Rincian SHU per sesi jastip",
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
        },
      ];
    }

    const summaryCards = [
      { key: "total_orders", label: "Total Pesanan", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_penjualan", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_profit", label: "Total Profit", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "kopi_share", label: "Koperasi 50%", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
      { key: "coor_share", label: "Coordinator 50%", format: "currency", color: "#2563EB", bgColor: "#f0f7ff" },
    ];

    const pdfContent = generateProfessionalPDF({
      title: filters.mode === "details" ? "LAPORAN DETAIL SHU JASTIP" : "LAPORAN SUMMARY SHU JASTIP",
      reportType: "Jastip",
      filters,
      summary: {
        ...data.summary,
        coor_share: data.summary.coor_share || (data.summary.total_profit ? data.summary.total_profit * 0.5 : 0)
      },
      summaryCards,
      sections,
      filtersInfo: filtersInfo.length > 0 ? filtersInfo.join(" | ") : "Semua Filter",
    });

    openProfessionalPDF(pdfContent);
  };

  // Grand totals helpers
  const getSummaryTotals = () => {
    return data.monthlySummary.reduce(
      (acc, curr) => {
        acc.orders += Number(curr.total_orders || 0);
        acc.coordinators += Number(curr.total_coordinators || 0);
        acc.members += Number(curr.total_members || 0);
        acc.sales += Number(curr.total_penjualan || 0);
        acc.profit += Number(curr.total_profit || 0);
        acc.kopi += Number(curr.kopi_share || 0);
        acc.coor += Number(curr.coor_share || 0);
        return acc;
      },
      { orders: 0, coordinators: 0, members: 0, sales: 0, profit: 0, kopi: 0, coor: 0 }
    );
  };

  const getDetailsTotals = () => {
    return data.sessionSHUDetails.reduce(
      (acc, curr) => {
        acc.sales += Number(curr.total_penjualan || 0);
        acc.profit += Number(curr.total_profit || 0);
        acc.kopi += Number(curr.kopi_share || 0);
        acc.coor += Number(curr.coor_share || 0);
        return acc;
      },
      { sales: 0, profit: 0, kopi: 0, coor: 0 }
    );
  };

  const summaryTotals = getSummaryTotals();
  const detailsTotals = getDetailsTotals();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Pembagian SHU Jastip
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Analisis pembagian keuntungan 50% Koperasi dan 50% Koordinator dari pesanan jastip
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
      <ReportFilter onFilterChange={handleFilterChange} showJastipFilters={true} />

      {/* Date Filter Placeholder */}
      {!filters.session_id && (!filters.from || !filters.to) ? (
        <Card sx={{ mt: 3, p: 4, textAlign: "center", border: "2px dashed #F9D5DC", backgroundColor: "#FFFBFC" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="#7A2E3A" gutterBottom>
              Rentang Tanggal atau Sesi Belum Ditentukan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Silakan pilih tanggal "Dari Tanggal" & "Ke Tanggal", atau pilih "Sesi Jastip" pada filter di atas untuk memuat laporan.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mode Toggle */}
          <Box sx={styles.modeToggle}>
            <Chip
              icon={<FaChartLine />}
              label="Summary"
              color={filters.mode === "summary" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "summary" })}
              sx={{ cursor: "pointer" }}
            />
            <Chip
              icon={<FaList />}
              label="Details"
              color={filters.mode === "details" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "details" })}
              sx={{ cursor: "pointer" }}
            />
          </Box>

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
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Koperasi 50%
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {formatCurrency(data.summary.kopi_share)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Coordinator 50%
                </Typography>
                <Typography variant="h5" sx={{ color: "#2563EB", fontWeight: 700 }}>
                  {formatCurrency(data.summary.coor_share || (data.summary.total_profit ? data.summary.total_profit * 0.5 : 0))}
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

          {/* Content */}
          {!loading && !error && (
            <>
              {filters.mode === "summary" ? (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <FaChartLine style={{ color: "#7A2E3A" }} />
                      <Typography variant="h6">SHU Bulanan - Jastip</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Bulan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Pesanan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Coordinator</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Customer</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Penjualan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Profit</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Koperasi 50%</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Coordinator 50%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.monthlySummary.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada data SHU untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.monthlySummary.map((row, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{row.month_name}</TableCell>
                                <TableCell align="center">{Number(row.total_orders).toLocaleString("id-ID")}</TableCell>
                                <TableCell align="center">{Number(row.total_coordinators).toLocaleString("id-ID")}</TableCell>
                                <TableCell align="center">{Number(row.total_members).toLocaleString("id-ID")}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>
                                  {formatCurrency(row.kopi_share)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#2563EB", fontWeight: 600 }}>
                                  {formatCurrency(row.coor_share)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.monthlySummary.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                {summaryTotals.orders.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                {summaryTotals.coordinators.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                {summaryTotals.members.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.sales)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                {formatCurrency(summaryTotals.profit)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace", color: "#059669" }}>
                                {formatCurrency(summaryTotals.kopi)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace", color: "#2563EB" }}>
                                {formatCurrency(summaryTotals.coor)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <FaList style={{ color: "#7A2E3A" }} />
                      <Typography variant="h6">Rincian SHU Jastip Sesi</Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Sesi</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }}>Coordinator</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Penjualan</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Profit</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Koperasi 50%</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Coordinator 50%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.sessionSHUDetails.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                Tidak ada rincian sesi untuk periode ini
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.sessionSHUDetails.map((row, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>{formatDate(row.date)}</TableCell>
                                <TableCell align="center">Sesi #{row.session_id}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{row.coordinator_name || "-"}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_penjualan)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                  {formatCurrency(row.total_profit)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>
                                  {formatCurrency(row.kopi_share)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#2563EB", fontWeight: 600 }}>
                                  {formatCurrency(row.coor_share)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {data.sessionSHUDetails.length > 0 && (
                          <TableFooter>
                            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                              <TableCell colSpan={3} sx={{ fontWeight: "bold" }}>Total</TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.sales)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                {formatCurrency(detailsTotals.profit)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace", color: "#059669" }}>
                                {formatCurrency(detailsTotals.kopi)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace", color: "#2563EB" }}>
                                {formatCurrency(detailsTotals.coor)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </TableContainer>
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
