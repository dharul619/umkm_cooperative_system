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
  Tabs,
  Tab,
  Grid,
  Tooltip,
} from "@mui/material";
import { FaPrint, FaShoppingBag, FaUsers, FaStore, FaChartLine, FaList } from "react-icons/fa";
import ReportFilter from "../../components/reports/ReportFilter";
import AppButton from "../../../../shared/components/AppButton";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  formatDate,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

export default function PesananJastipPage() {
  const [data, setData] = useState({
    summary: {},
    dailySummary: [],
    byStatus: [],
    menuDetails: [],
    memberOrders: [],
    vendorDetails: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
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
        dailySummary: [],
        byStatus: [],
        menuDetails: [],
        memberOrders: [],
        vendorDetails: [],
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
          title: "Pesanan Harian",
          subtitle: "Ringkasan pesanan per hari",
          headers: [
            { label: "Tanggal", align: "left" },
            { label: "Total Pesanan", align: "center" },
            { label: "Coordinator", align: "center" },
            { label: "Total Penjualan", align: "right" },
            { label: "Total Profit", align: "right" },
            { label: "SHU Koperasi", align: "right" },
          ],
          rows: data.dailySummary.map((d) => [
            formatDate(d.date),
            Number(d.total_orders).toLocaleString("id-ID"),
            Number(d.coordinators).toLocaleString("id-ID"),
            formatCurrency(d.total_penjualan),
            formatCurrency(d.total_profit),
            formatCurrency(d.kopi_share),
          ]),
        },
        {
          title: "Status Pesanan",
          subtitle: "Distribusi pesanan berdasarkan status",
          headers: [
            { label: "Status", align: "left" },
            { label: "Jumlah", align: "center" },
            { label: "Total Penjualan", align: "right" },
          ],
          rows: data.byStatus.map((s) => [
            s.status,
            Number(s.total).toLocaleString("id-ID"),
            formatCurrency(s.total_amount),
          ]),
        },
      ];
    } else {
      sections = [
        {
          title: "Detail Menu",
          subtitle: "Menu terpopuler berdasarkan jumlah pesanan",
          headers: [
            { label: "Menu", align: "left" },
            { label: "Vendor", align: "left" },
            { label: "Kontak Vendor", align: "left" },
            { label: "Total Qty", align: "center" },
            { label: "Total Penjualan", align: "right" },
            { label: "Profit", align: "right" },
          ],
          rows: data.menuDetails.map((m) => [
            m.menu_name,
            m.vendor_name,
            m.vendor_phone || "-",
            Number(m.total_qty).toLocaleString("id-ID"),
            formatCurrency(m.total_penjualan),
            formatCurrency(m.total_profit),
          ]),
        },
        {
          title: "Pesanan per Member",
          subtitle: "Ringkasan pesanan dari masing-masing member",
          headers: [
            { label: "Member", align: "left" },
            { label: "No. Telepon", align: "left" },
            { label: "Total Pesanan", align: "center" },
            { label: "Total Item", align: "center" },
            { label: "Total Amount", align: "right" },
          ],
          rows: data.memberOrders.map((m) => [
            m.member_name,
            m.phone_number || "-",
            Number(m.total_orders).toLocaleString("id-ID"),
            Number(m.total_items).toLocaleString("id-ID"),
            formatCurrency(m.total_amount),
          ]),
        },
        {
          title: "Ringkasan per Vendor",
          subtitle: "Total penjualan dan profit per vendor jastip",
          headers: [
            { label: "Vendor", align: "left" },
            { label: "No. Telepon", align: "left" },
            { label: "Total Pesanan", align: "center" },
            { label: "Total Item", align: "center" },
            { label: "Total Penjualan", align: "right" },
            { label: "Profit Koperasi", align: "right" },
          ],
          rows: (data.vendorDetails || []).map((v) => [
            v.vendor_name,
            v.vendor_phone || "-",
            Number(v.total_orders).toLocaleString("id-ID"),
            Number(v.total_items).toLocaleString("id-ID"),
            formatCurrency(v.total_penjualan),
            formatCurrency(v.total_profit),
          ]),
        },
      ];
    }

    const summaryCards = [
      { key: "total_orders", label: "Total Pesanan", format: "number", color: "#7A2E3A", bgColor: "#fef2f2" },
      { key: "total_penjualan", label: "Total Penjualan", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_profit", label: "Total Profit", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "kopi_share", label: "SHU Koperasi", format: "currency", color: "#7A2E3A", bgColor: "#fdf2f4" },
    ];

    const pdfContent = generateProfessionalPDF({
      title: "LAPORAN PESANAN JASTIP",
      reportType: "Jastip",
      filters,
      summary: data.summary,
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h5" sx={styles.title}>
            Laporan Pesanan Jastip
          </Typography>
          <Typography variant="body2" sx={styles.subtitle}>
            Ringkasan pesanan jastip dan detail menu
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
              label="Ringkasan Harian"
              color={filters.mode === "summary" ? "primary" : "default"}
              onClick={() => handleFilterChange({ mode: "summary" })}
              sx={{ cursor: "pointer" }}
            />
            <Chip
              icon={<FaList />}
              label="Detail Menu & Member"
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
                  Coordinator
                </Typography>
                <Typography variant="h5" sx={{ color: "#059669", fontWeight: 700 }}>
                  {Number(data.summary.total_coordinators || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Member
                </Typography>
                <Typography variant="h5" sx={{ color: "#2563EB", fontWeight: 700 }}>
                  {Number(data.summary.total_members || 0).toLocaleString("id-ID")}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  Total Penjualan
                </Typography>
                <Typography variant="h5" sx={{ color: "#D97706", fontWeight: 700 }}>
                  {formatCurrency(data.summary.total_penjualan)}
                </Typography>
              </Box>
              <Box sx={styles.summaryCard}>
                <Typography variant="caption" color="text.secondary">
                  SHU Koperasi
                </Typography>
                <Typography variant="h5" sx={{ color: "#7A2E3A", fontWeight: 700 }}>
                  {formatCurrency(data.summary.kopi_share)}
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
                <>
                  {/* Status Summary */}
                  {data.byStatus && data.byStatus.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Status Pesanan</Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          {data.byStatus.map((s, idx) => (
                            <Chip
                              key={idx}
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
                      <Typography variant="h6" sx={{ mb: 2 }}>Ringkasan Harian</Typography>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Tanggal</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Pesanan</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Coordinator</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Penjualan</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Profit</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">SHU Koperasi</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.dailySummary.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data untuk periode ini
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.dailySummary.map((row, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell>{formatDate(row.date)}</TableCell>
                                  <TableCell align="center">{Number(row.total_orders).toLocaleString("id-ID")}</TableCell>
                                  <TableCell align="center">{Number(row.coordinators).toLocaleString("id-ID")}</TableCell>
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
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Menu Details */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <FaStore style={{ color: "#7A2E3A" }} />
                        <Typography variant="h6">Detail Menu</Typography>
                      </Box>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Menu</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Vendor</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Kontak</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Qty</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Penjualan</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Profit</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.menuDetails.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data menu
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.menuDetails.map((row, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>{row.menu_name}</TableCell>
                                  <TableCell>{row.vendor_name}</TableCell>
                                  <TableCell>{row.vendor_phone || "-"}</TableCell>
                                  <TableCell align="center">{Number(row.total_qty).toLocaleString("id-ID")}</TableCell>
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
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>

                  {/* Vendor Summary */}
                  {data.vendorDetails && data.vendorDetails.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
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
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Pesanan</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Total Item</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Penjualan</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Profit Koperasi</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.vendorDetails.map((row, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>{row.vendor_name}</TableCell>
                                  <TableCell>{row.vendor_phone || "-"}</TableCell>
                                  <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {row.vendor_address || "-"}
                                  </TableCell>
                                  <TableCell align="center">{Number(row.total_orders).toLocaleString("id-ID")}</TableCell>
                                  <TableCell align="center">{Number(row.total_items).toLocaleString("id-ID")}</TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                    {formatCurrency(row.total_penjualan)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>
                                    {formatCurrency(row.total_profit)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Member Orders */}
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <FaUsers style={{ color: "#7A2E3A" }} />
                        <Typography variant="h6">Pesanan per Member</Typography>
                      </Box>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>Member</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }}>No. Telepon</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Pesanan</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Total Item</TableCell>
                              <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">Total Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.memberOrders.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                  Tidak ada data member
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.memberOrders.map((row, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>{row.member_name}</TableCell>
                                  <TableCell>{row.phone_number || "-"}</TableCell>
                                  <TableCell align="center">{Number(row.total_orders).toLocaleString("id-ID")}</TableCell>
                                  <TableCell align="center">{Number(row.total_items).toLocaleString("id-ID")}</TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
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
                </>
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
  modeToggle: {
    display: "flex",
    gap: 1,
    mb: 2,
  },
};
