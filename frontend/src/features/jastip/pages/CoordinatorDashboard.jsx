import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Chip,
} from "@mui/material";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { AppCard, PageHeader, AppButton } from "../../../shared/components";
import { useCoordinatorDashboard } from "../hooks/useCoordinatorDashboard";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

const formatDateLabel = (tickItem) => {
  if (!tickItem) return "";
  try {
    const d = new Date(tickItem);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return tickItem;
  }
};

const CHART_COLORS = {
  jastip: "#2563EB",
  jastipLight: "#DBEAFE",
  profit: "#059669",
  profitLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  neutral: "#64748B",
  categories: ["#2563EB", "#7C3AED", "#EC4899", "#059669", "#D97706", "#06B6D4", "#F43F5E", "#10B981"],
};

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          color: "#FFFFFF",
          p: 1.5,
          borderRadius: 2.5,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography variant="body2" fontWeight={800}>
          {data.name}
        </Typography>
        <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
          Jumlah: {formatNumber(data.value)} Porsi
        </Typography>
      </Box>
    );
  }
  return null;
};

// Custom Tooltip for Payment Chart
const PaymentTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          color: "#FFFFFF",
          p: 1.5,
          borderRadius: 2.5,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography variant="body2" fontWeight={800}>
          {data.name}
        </Typography>
        <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
          Transaksi: {formatNumber(data.value)}
        </Typography>
      </Box>
    );
  }
  return null;
};

// Custom Tooltip for Trend Chart
const TrendTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          color: "#FFFFFF",
          p: 1.5,
          borderRadius: 2.5,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography variant="body2" fontWeight={800}>
          Tanggal: {formatDateLabel(data.date)}
        </Typography>
        <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "#60A5FA", fontWeight: 800 }}>
          Penjualan: {formatCurrency(data.sales)}
        </Typography>
      </Box>
    );
  }
  return null;
};

const CoordinatorDashboard = () => {
  const { stats, loading, actionLoading, error, refresh, updateSessionStatus, approvePayment } = useCoordinatorDashboard();
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  const activeSession = stats?.activeSession || null;
  const summary = stats?.summary || { total_sessions: 0, total_earnings: 0, pending_payments: 0, total_members_served: 0 };
  const pendingPayments = stats?.pendingPayments || [];

  // Visualizations datasets
  const ordersByDivision = stats?.activeSessionOrdersByDivision || [];
  const ordersByVendor = stats?.activeSessionOrdersByVendor || [];
  const paymentSummary = stats?.activeSessionPaymentSummary || [];
  const orderDetails = stats?.activeSessionOrderDetails || [];
  const jastipSalesTrend = stats?.jastipSalesTrend || [];

  // Payment status label mapping for Pie Chart
  const getPaymentChartData = () => {
    return paymentSummary.map((p) => {
      let stateName = p.name;
      if (p.name === "SETTLED") stateName = "Lunas (SETTLED)";
      else if (p.name === "PENDING") stateName = "Verifikasi (PENDING)";
      else if (p.name === "PROCESSING") stateName = "Diproses (PROCESSING)";
      else if (p.name === "FAILED") stateName = "Gagal (FAILED)";
      else if (p.name === "EXPIRED") stateName = "Kedaluwarsa (EXPIRED)";
      return {
        name: stateName,
        value: Number(p.value),
      };
    });
  };

  const paymentChartData = getPaymentChartData();

  // Status transition handlers
  const handleUpdateStatus = async (status) => {
    if (!activeSession) return;
    try {
      setTransitioning(true);
      await updateSessionStatus(activeSession.id, status);
    } catch (err) {
      console.error(err);
    } finally {
      setTransitioning(false);
    }
  };

  const handleConfirmPayment = async (paymentId, memberName) => {
    if (!window.confirm(`Konfirmasi pembayaran manual untuk anggota ${memberName}?`)) return;
    try {
      await approvePayment(paymentId);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      OPEN: { label: "Menerima Order", color: "primary" },
      CONFIRMED: { label: "Terkonfirmasi", color: "warning" },
      ORDERED: { label: "Dipesan ke Vendor", color: "info" },
      DELIVERED: { label: "Tiba di Kantor", color: "secondary" },
      DONE: { label: "Selesai", color: "success" },
      CANCELLED: { label: "Dibatalkan", color: "error" },
    };
    const current = statusMap[status] || { label: status, color: "default" };
    return <Chip label={current.label} color={current.color} size="small" sx={{ fontWeight: 800 }} />;
  };

  const getPaymentStateBadge = (state) => {
    const stateMap = {
      PENDING: { label: "Menunggu Verifikasi", color: "warning" },
      SETTLED: { label: "Lunas", color: "success" },
      FAILED: { label: "Gagal", color: "error" },
      EXPIRED: { label: "Kedaluwarsa", color: "default" },
    };
    const current = stateMap[state] || { label: state, color: "default" };
    return <Chip label={current.label} color={current.color} size="small" sx={{ fontWeight: 700 }} />;
  };

  const pageActions = (
    <AppButton
      variant="outlined"
      onClick={refresh}
      startIcon={<RefreshRounded />}
      sx={{ borderRadius: 2.5, fontWeight: 800 }}
    >
      Refresh Data
    </AppButton>
  );

  return (
    <Box sx={{ background: "linear-gradient(180deg, #FFF8F9 0%, #FFFFFF 100%)", minHeight: "100%", width: "100%", boxSizing: "border-box", display: "block", p: 0.5, borderRadius: 4 }}>
      <PageHeader
        eyebrow="Jastip Coordinator Workspace"
        title="Dashboard Jastip"
        description="Analisis visual pesanan jastip aktif per divisi, vendor harian, persetujuan pembayaran, dan daftar order."
        actions={pageActions}
      />

      {error && (
        <Grid container spacing={3} sx={{ mb: 3.5 }}>
          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
              <Typography variant="body2" fontWeight={700}>{error}</Typography>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Row 1: KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        {/* KPI 1: Active Session Status */}
        <Grid item xs={12} sm={6} md={3}>
          <AppCard
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, #FFFFFF 0%, ${CHART_COLORS.jastipLight}15 100%)`,
            }}
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3.5,
                  backgroundColor: `${CHART_COLORS.jastip}15`,
                  color: CHART_COLORS.jastip,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StorefrontRounded />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ textTransform: "uppercase" }}>
                  Status Sesi
                </Typography>
                {loading ? (
                  <Skeleton width={80} height={28} />
                ) : (
                  <Typography variant="h6" fontWeight={850} color={CHART_COLORS.jastip} sx={{ mt: 0.25 }}>
                    {activeSession ? getStatusBadge(activeSession.status) : "Tidak Ada Sesi"}
                  </Typography>
                )}
              </Box>
            </Stack>
          </AppCard>
        </Grid>

        {/* KPI 2: Total Session Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <AppCard
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, #FFFFFF 0%, ${CHART_COLORS.profitLight}15 100%)`,
            }}
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3.5,
                  backgroundColor: `${CHART_COLORS.profit}15`,
                  color: CHART_COLORS.profit,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccountBalanceWalletRounded />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ textTransform: "uppercase" }}>
                  Omzet Sesi Hari Ini
                </Typography>
                {loading ? (
                  <Skeleton width={120} height={28} />
                ) : (
                  <Typography variant="h6" fontWeight={850} color={CHART_COLORS.profit} sx={{ mt: 0.25 }}>
                    {activeSession ? formatCurrency(activeSession.total_amount) : "Rp 0"}
                  </Typography>
                )}
              </Box>
            </Stack>
          </AppCard>
        </Grid>

        {/* KPI 3: Pending Payments */}
        <Grid item xs={12} sm={6} md={3}>
          <AppCard
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, #FFFFFF 0%, ${CHART_COLORS.warningLight}15 100%)`,
            }}
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3.5,
                  backgroundColor: `${CHART_COLORS.warning}15`,
                  color: CHART_COLORS.warning,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PaymentsRounded />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ textTransform: "uppercase" }}>
                  Persetujuan Bayar
                </Typography>
                {loading ? (
                  <Skeleton width={80} height={28} />
                ) : (
                  <Typography variant="h6" fontWeight={850} color={CHART_COLORS.warning} sx={{ mt: 0.25 }}>
                    {formatNumber(summary.pending_payments)} Pending
                  </Typography>
                )}
              </Box>
            </Stack>
          </AppCard>
        </Grid>

        {/* KPI 4: Total Portions Ordered */}
        <Grid item xs={12} sm={6} md={3}>
          <AppCard sx={{ height: "100%" }}>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3.5,
                  backgroundColor: "#E2E8F0",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ReceiptLongRounded />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ textTransform: "uppercase" }}>
                  Item Terpesan Hari Ini
                </Typography>
                {loading ? (
                  <Skeleton width={80} height={28} />
                ) : (
                  <Typography variant="h6" fontWeight={850} color="#475569" sx={{ mt: 0.25 }}>
                    {activeSession ? `${formatNumber(activeSession.total_items_ordered)} Porsi` : "0 Porsi"}
                  </Typography>
                )}
              </Box>
            </Stack>
          </AppCard>
        </Grid>
      </Grid>

      {/* Row 2: Sales Trend (1 Month Area Chart) + Payment Status Donut */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        {/* Trend Penjualan 1 Bulan */}
        <Grid item xs={12} md={8}>
          <AppCard sx={{ height: "100%", p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 2 }}>
              Grafik Tren Penjualan Jastip (1 Bulan Terakhir)
            </Typography>
            {loading ? (
              <Skeleton height={220} />
            ) : jastipSalesTrend.length > 0 ? (
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={jastipSalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorJastipSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.jastip} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.jastip} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      stroke={CHART_COLORS.neutral}
                      tickLine={false}
                      style={{ fontSize: "11px", fontWeight: 700 }}
                    />
                    <YAxis
                      stroke={CHART_COLORS.neutral}
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: "11px", fontWeight: 700 }}
                      tickFormatter={(value) => `Rp ${formatNumber(value / 1000)}k`}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={CHART_COLORS.jastip}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorJastipSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ py: 8, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", height: 220 }}>
                <Typography variant="body2" color="text.secondary">Belum ada riwayat transaksi penjualan jastip bulan ini</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>

        {/* Proporsi Status Pembayaran (Donut Chart) */}
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%", p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 2 }}>
              Proporsi Status Pembayaran
            </Typography>
            {loading ? (
              <Skeleton height={220} />
            ) : activeSession && paymentChartData.length > 0 ? (
              <Box sx={{ height: 220, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="55%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, idx) => {
                        let color = CHART_COLORS.neutral;
                        if (entry.name.includes("Lunas")) color = CHART_COLORS.profit;
                        else if (entry.name.includes("Verifikasi")) color = CHART_COLORS.warning;
                        else if (entry.name.includes("Gagal")) color = CHART_COLORS.danger;
                        return <Cell key={`cell-${idx}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip content={<PaymentTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconSize={10}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ py: 8, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", height: 220 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data pembayaran sesi aktif</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>

      {/* Row 3: Active Session Donut & Pie Charts (Donut per Division & Solid Pie per Vendor) */}
      {activeSession && (
        <Grid container spacing={3} sx={{ mb: 4.5 }}>
          {/* Chart 1: Pemesanan by Divisi (Donut Chart) */}
          <Grid item xs={12} md={6}>
            <AppCard sx={{ p: 2.5, height: "100%" }}>
              <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 2 }}>
                Pemesanan Jastip per Divisi
              </Typography>
              {loading ? (
                <Skeleton height={220} />
              ) : ordersByDivision.length > 0 ? (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByDivision}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {ordersByDivision.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS.categories[idx % CHART_COLORS.categories.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconSize={10}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Belum ada pesanan divisi harian</Typography>
                </Box>
              )}
            </AppCard>
          </Grid>

          {/* Chart 2: Pemesanan by Vendor (Solid Pie Chart) */}
          <Grid item xs={12} md={6}>
            <AppCard sx={{ p: 2.5, height: "100%" }}>
              <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 2 }}>
                Pemesanan Jastip per Vendor
              </Typography>
              {loading ? (
                <Skeleton height={220} />
              ) : ordersByVendor.length > 0 ? (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByVendor}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {ordersByVendor.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS.categories[(idx + 3) % CHART_COLORS.categories.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconSize={10}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Belum ada pesanan vendor harian</Typography>
                </Box>
              )}
            </AppCard>
          </Grid>
        </Grid>
      )}

      {/* Stepper Status / Workflow actions bar */}
      {activeSession ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4.5 }}>
            <Grid item xs={12}>
              <AppCard sx={{ p: 2.5 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
                  <Box>
                    <Typography variant="body2" fontWeight={800} color="#7A2E3A">
                      Sesi Kuliner Aktif Tanggal {new Date(activeSession.order_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                      Status Terkini: {activeSession.status} | Anggota Memesan: {formatNumber(activeSession.total_members_ordered)} Orang
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5}>
                    {activeSession.status === "OPEN" && (
                      <AppButton
                        variant="contained"
                        color="primary"
                        disabled={actionLoading || transitioning}
                        onClick={() => handleUpdateStatus("CONFIRMED")}
                        endIcon={<ArrowForwardRounded />}
                      >
                        Tutup Penerimaan Order
                      </AppButton>
                    )}

                    {activeSession.status === "CONFIRMED" && (
                      <AppButton
                        variant="contained"
                        color="primary"
                        disabled={actionLoading || transitioning}
                        onClick={() => navigate(`/jastip/sessions/${activeSession.id}`)}
                        endIcon={<ArrowForwardRounded />}
                      >
                        Dispatcher Rekap Vendor
                      </AppButton>
                    )}

                    {activeSession.status === "ORDERED" && (
                      <AppButton
                        variant="contained"
                        color="primary"
                        disabled={actionLoading || transitioning}
                        onClick={() => handleUpdateStatus("DELIVERED")}
                        endIcon={<CheckCircleRounded />}
                      >
                        Tandai Makanan Sampai
                      </AppButton>
                    )}

                    {activeSession.status === "DELIVERED" && (
                      <AppButton
                        variant="contained"
                        color="success"
                        disabled={actionLoading || transitioning}
                        onClick={() => handleUpdateStatus("DONE")}
                        endIcon={<CheckCircleRounded />}
                      >
                        Selesaikan Sesi Jastip
                      </AppButton>
                    )}

                    {activeSession.status !== "DONE" && activeSession.status !== "CANCELLED" && (
                      <AppButton
                        variant="outlined"
                        color="error"
                        disabled={actionLoading || transitioning}
                        onClick={async () => {
                          if (window.confirm("Batal sesi jastip ini?")) await handleUpdateStatus("CANCELLED");
                        }}
                        startIcon={<BlockRounded />}
                      >
                        Batalkan Sesi
                      </AppButton>
                    )}
                  </Stack>
                </Stack>
              </AppCard>
            </Grid>
          </Grid>

          {/* Row 4: Orders List (Today's active session) */}
          <Grid container spacing={3} sx={{ mb: 4.5 }}>
            <Grid item xs={12}>
              <AppCard sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 2.5 }}>
                  Rincian Pesanan Sesi Hari Ini
                </Typography>
                {loading ? (
                  <Stack spacing={1}><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></Stack>
                ) : orderDetails.length > 0 ? (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Anggota</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Menu Makanan</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Mitra Vendor</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Jumlah</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Harga</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Subtotal</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Metode</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="center">Pembayaran</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderDetails.map((row) => (
                          <TableRow key={row.id} sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}>
                            <TableCell sx={{ fontWeight: 700 }}>{row.member_name}</TableCell>
                            <TableCell>{row.menu_name}</TableCell>
                            <TableCell>{row.vendor_name}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{row.qty} Porsi</TableCell>
                            <TableCell align="right">{formatCurrency(row.price)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(row.subtotal)}</TableCell>
                            <TableCell align="center">{row.payment_method || "Tunai"}</TableCell>
                            <TableCell align="center">{getPaymentStateBadge(row.payment_state || "PENDING")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">Belum ada pesanan yang masuk pada sesi ini.</Typography>
                  </Box>
                )}
              </AppCard>
            </Grid>
          </Grid>
        </>
      ) : (
        /* Empty State */
        <Grid container spacing={3} sx={{ mb: 4.5 }}>
          <Grid item xs={12}>
            <AppCard sx={{ p: 6, textAlign: "center" }}>
              <StorefrontRounded sx={{ fontSize: 64, color: "text.secondary", opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" fontWeight={800} color="text.secondary">
                Belum Ada Sesi Jastip yang Aktif Hari Ini
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4, maxWidth: 450, mx: "auto" }}>
                Anda belum membuka penerimaan pesanan jastip kuliner untuk hari ini. Silakan buat sesi jastip baru untuk menyajikan menu vendor mitra ke anggota koperasi.
              </Typography>
              <AppButton
                variant="contained"
                color="primary"
                onClick={() => navigate("/jastip/sessions/create")}
                sx={{ borderRadius: 2.5, fontWeight: 800 }}
              >
                Buka Sesi Jastip Baru
              </AppButton>
            </AppCard>
          </Grid>
        </Grid>
      )}

      {/* Row 5: Pending Payments Manual Approvals */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AppCard sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={850} sx={{ mb: 2.5 }}>
              Konfirmasi Penerimaan Pembayaran Manual (Pending)
            </Typography>

            {loading ? (
              <Stack spacing={1.5}><Skeleton height={42} /><Skeleton height={42} /></Stack>
            ) : pendingPayments.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="medium">
                  <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Anggota Pemesan</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Sesi Terkait</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Metode Transfer</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Jumlah Dana</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Tanggal Transaksi</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Aksi Verifikasi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingPayments.map((p, i) => (
                      <TableRow key={p.payment_id || i} sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: CHART_COLORS.jastipLight, color: CHART_COLORS.jastip, fontSize: 13, fontWeight: 800 }}>
                              {p.member_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={800}>
                                {p.member_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                username: @{p.member_username}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Sesi #{p.session_id} ({new Date(p.order_date).toLocaleDateString("id-ID")})
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={p.payment_method} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: CHART_COLORS.profit }}>
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell align="center">
                          {new Date(p.created_at).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell align="center">
                          <AppButton
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleConfirmPayment(p.payment_id, p.member_name)}
                          >
                            Setujui Manual
                          </AppButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Tidak ada transfer manual atau dana cash yang menunggu konfirmasi Anda saat ini.
                </Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CoordinatorDashboard;
