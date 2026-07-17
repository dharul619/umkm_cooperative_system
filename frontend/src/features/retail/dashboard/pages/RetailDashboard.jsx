import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Skeleton,
  Stack,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import {
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
} from "recharts";

import { AppCard, PageHeader, AppButton } from "../../../../shared/components";
import { dashboardService } from "../../../admin/services/dashboardService";

// Icons
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

const CHART_COLORS = {
  retail: "#E85D75",
  profit: "#059669",
  retailLight: "#FFF1F3",
  profitLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  blue: "#2563EB",
  blueLight: "#DBEAFE",
  darkBg: "rgba(15, 23, 42, 0.95)",
  slateText: "#64748B",
  categories: ["#E85D75", "#2563EB", "#059669", "#D97706", "#7C3AED", "#EC4899", "#14B8A6"],
};

// Premium Glassmorphism Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: CHART_COLORS.darkBg,
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 3,
        p: 2,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1, color: "#94A3B8", letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Stack spacing={0.75}>
        {payload.map((entry, i) => (
          <Stack key={i} direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.color }} />
            <Typography variant="caption" sx={{ color: "#E2E8F0", fontWeight: 600 }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#F8FAFC", fontWeight: 800, ml: "auto" }}>
              {formatCurrency(entry.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

// Premium KPI Card
const PremiumKPICard = ({ title, value, subtitle, icon: Icon, color = "#7A2E3A", lightColor = "#FFF1F3", loading, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <AppCard
      hoverable={!!onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        height: "100%",
        position: "relative",
        background: `linear-gradient(135deg, #FFFFFF 0%, ${lightColor}40 100%)`,
        border: `1px solid ${hovered && onClick ? color : "#E2E8F0"}`,
        boxShadow: hovered && onClick
          ? `0 12px 20px -8px ${color}35`
          : "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Stack direction="row" spacing={2.5} alignItems="center" sx={{ height: "100%" }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 4,
            backgroundColor: `${color}15`,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.3s",
            transform: hovered ? "scale(1.08)" : "scale(1)",
            boxShadow: hovered ? `0 6px 12px -3px ${color}30` : "none",
          }}
        >
          <Icon fontSize="medium" />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={110} height={36} sx={{ mt: 0.5 }} />
          ) : (
            <Typography variant="h5" fontWeight={850} color={color} sx={{ mt: 0.25, letterSpacing: "-0.5px" }}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {onClick && hovered && (
          <Box sx={{ color: color, display: "flex", alignItems: "center", opacity: 0.7 }}>
            <ArrowForwardRounded fontSize="small" />
          </Box>
        )}
      </Stack>
    </AppCard>
  );
};

// Premium Trend Chart wrapper (mixed line and bar layout)
const ComposedRevenueSHUChart = ({ id, data, barKey, lineKey, barName, lineName, barColor, lineColor, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={data} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
      <defs>
        <linearGradient id={`${id}Grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={barColor} stopOpacity={0.85}/>
          <stop offset="100%" stopColor={barColor} stopOpacity={0.15}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
      <XAxis
        dataKey="month"
        tick={{ fontSize: 10, fill: CHART_COLORS.slateText, fontWeight: 600 }}
        tickFormatter={(v) => {
          if (!v) return "";
          const parts = v.split("-");
          if (parts.length < 2) return v;
          const m = parts[1];
          const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
          return months[parseInt(m) - 1] || v;
        }}
        axisLine={{ stroke: "#E2E8F0" }}
        tickLine={false}
      />
      <YAxis
        tickFormatter={(v) => formatCurrency(v)}
        tick={{ fontSize: 10, fill: CHART_COLORS.slateText, fontWeight: 600 }}
        width={75}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 15 }} />
      <Bar dataKey={barKey} name={barName} fill={`url(#${id}Grad)`} radius={[6, 6, 0, 0]} barSize={32} />
      <Line type="monotone" dataKey={lineKey} name={lineName} stroke={lineColor} strokeWidth={3.5} dot={{ r: 5, strokeWidth: 1.5, fill: "#FFFFFF" }} activeDot={{ r: 7 }} />
    </ComposedChart>
  </ResponsiveContainer>
);

// Styled list items for Top Lists
const TopListItem = ({ title, subtitle, value, color = "#2563EB" }) => {
  const initials = title ? title.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "PR";
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        backgroundColor: "#FFFFFF",
        border: "1px solid #F1F5F9",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateX(4px)",
          backgroundColor: "#F8FAFC",
          borderColor: `${color}30`,
          boxShadow: `0 4px 12px -4px ${color}15`,
        }
      }}
    >
      <Avatar
        sx={{
          width: 38,
          height: 38,
          fontSize: 13,
          fontWeight: 800,
          backgroundColor: `${color}10`,
          color: color,
          border: `1px solid ${color}20`
        }}
      >
        {initials}
      </Avatar>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" fontWeight={750} noWrap color="text.primary">
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.25 }}>
          {subtitle}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={850} color={color} sx={{ textAlign: "right", ml: 1 }}>
        {value}
      </Typography>
    </Stack>
  );
};

const RetailDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [months] = useState(12);

  // States for dashboard stats
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        overviewRes,
        trendRes,
        categoryRes,
        topProductsRes,
        lowStockRes
      ] = await Promise.allSettled([
        dashboardService.getRetailOverview(),
        dashboardService.getRetailSalesTrendMonthly(months),
        dashboardService.getSalesByCategory(10),
        dashboardService.getTopSellingProducts(10),
        dashboardService.getLowStockProducts(20)
      ]);

      setOverview(overviewRes.status === "fulfilled" ? overviewRes.value : null);
      setTrend(trendRes.status === "fulfilled" ? trendRes.value : []);
      setByCategory(categoryRes.status === "fulfilled" ? categoryRes.value : []);
      setTopProducts(topProductsRes.status === "fulfilled" ? topProductsRes.value : []);
      setLowStock(lowStockRes.status === "fulfilled" ? lowStockRes.value : []);

    } catch (err) {
      console.error("Gagal mengambil data dashboard retail:", err);
      setError("Gagal memuat beberapa data dashboard. Silakan coba segarkan kembali.");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  const pageActions = (
    <AppButton
      variant="outlined"
      onClick={fetchDashboardData}
      startIcon={<RefreshRounded />}
      sx={{ borderRadius: 2.5, fontWeight: 800 }}
    >
      Segarkan Data
    </AppButton>
  );

  // Totals calculations
  const totalSales = overview?.salesStats?.total_revenue || 0;
  const totalProfit = overview?.salesStats?.total_profit || 0;
  const totalKopiShare = overview?.salesStats?.total_kopi_share || 0;
  const lowStockCount = overview?.lowStockCount || 0;
  const totalProducts = overview?.productStats?.total_products || 0;

  return (
    <Box sx={{ background: "linear-gradient(180deg, #FFF8F9 0%, #FFFFFF 100%)", minHeight: "100%", width: "100%", boxSizing: "border-box", display: "block", p: 0.5, borderRadius: 4 }}>
      <PageHeader
        eyebrow="Retail Coordinator Workspace"
        title="Dashboard Ritel"
        description="Pantau performa penjualan ritel koperasi, tingkat keuntungan, kondisi stok gudang, dan barang terpopuler."
        actions={pageActions}
      />

      {error && (
        <Box sx={{ p: 2, mb: 3.5, borderRadius: 2.5, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
          <Typography variant="body2" fontWeight={700}>{error}</Typography>
        </Box>
      )}

      {/* Row 1: KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        <Grid item xs={12} sm={6} md={6} lg={6} xl={3}>
          <PremiumKPICard
            title="Total Penjualan"
            value={formatCurrency(totalSales)}
            subtitle={`Bulan Ini: ${formatCurrency(overview?.thisMonth?.total_revenue || 0)}`}
            icon={PointOfSaleRounded}
            color={CHART_COLORS.retail}
            lightColor={CHART_COLORS.retailLight}
            loading={loading}
            onClick={() => navigate("/retail/master/sales")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={6} xl={3}>
          <PremiumKPICard
            title="Estimasi Keuntungan"
            value={formatCurrency(totalProfit)}
            subtitle={`Share Koperasi: ${formatCurrency(totalKopiShare)}`}
            icon={TrendingUpRounded}
            color={CHART_COLORS.profit}
            lightColor={CHART_COLORS.profitLight}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={6} xl={3}>
          <PremiumKPICard
            title="Stok Kritis"
            value={`${lowStockCount} Produk`}
            subtitle="Membutuhkan restock segera"
            icon={Inventory2Rounded}
            color={CHART_COLORS.warning}
            lightColor={CHART_COLORS.warningLight}
            loading={loading}
            onClick={() => navigate("/retail/master/inventory")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={6} xl={3}>
          <PremiumKPICard
            title="Total Produk Ritel"
            value={`${formatNumber(totalProducts)} Item`}
            subtitle={`Aktif: ${overview?.productStats?.active_products || 0}`}
            icon={CategoryRounded}
            color={CHART_COLORS.blue}
            lightColor={CHART_COLORS.blueLight}
            loading={loading}
            onClick={() => navigate("/retail/master/products")}
          />
        </Grid>
      </Grid>

      {/* Row 2: Sales Trend Chart & Top Category Distribution */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} md={12} lg={12} xl={8}>
          <AppCard sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 3 }}>
              Tren Omzet Penjualan & Keuntungan Ritel Bulanan
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : trend.length > 0 ? (
              <ComposedRevenueSHUChart
                id="retailSalesTrend"
                data={trend}
                barKey="revenue"
                lineKey="profit"
                barName="Total Penjualan"
                lineName="Margin Keuntungan"
                barColor={CHART_COLORS.retail}
                lineColor={CHART_COLORS.profit}
                height={300}
              />
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data tren penjualan</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>

        {/* Category Pie Chart */}
        <Grid item xs={12} md={12} lg={12} xl={4}>
          <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 1 }}>
              Penjualan Per Kategori
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : byCategory.length > 0 ? (
              <Box sx={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 300, flexGrow: 1 }}>
                <PieChart width={200} height={200}>
                  <Pie
                    data={byCategory
                      .map((c, idx) => ({
                        name: c.category_name,
                        value: Number(c.total_revenue),
                        color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byCategory
                      .map((c, idx) => ({
                        name: c.category_name,
                        value: Number(c.total_revenue),
                        color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)
                      .map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
                <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none", top: "37%" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.6rem", textTransform: "uppercase" }}>
                    Total Omzet
                  </Typography>
                  <Typography variant="body2" fontWeight={850} color="text.primary" sx={{ fontSize: "0.85rem" }}>
                    {formatCurrency(byCategory.reduce((acc, curr) => acc + Number(curr.total_revenue), 0))}
                  </Typography>
                </Box>
                <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} sx={{ mt: 2 }}>
                  {byCategory.slice(0, 4).map((c, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: CHART_COLORS.categories[idx % CHART_COLORS.categories.length] }} />
                      <Typography sx={{ fontSize: 10, fontWeight: 700 }} color="text.secondary">
                        {c.category_name}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data kategori</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>

      {/* Row 3: Top Selling Products & Low Stock Alerts Table */}
      <Grid container spacing={3}>
        {/* Top Selling Products List */}
        <Grid item xs={12} md={12} lg={12} xl={5}>
          <AppCard sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 3 }}>
              Top 5 Produk Terlaris
            </Typography>
            {loading ? (
              <Stack spacing={1.5}>
                <Skeleton height={52} />
                <Skeleton height={52} />
                <Skeleton height={52} />
                <Skeleton height={52} />
              </Stack>
            ) : topProducts.length > 0 ? (
              <Stack spacing={1.5}>
                {topProducts.slice(0, 5).map((p, i) => (
                  <TopListItem
                    key={i}
                    title={p.product_name}
                    subtitle={`${p.category_name || "Ritel"} • ${formatNumber(p.total_qty)} terjual`}
                    value={formatCurrency(p.total_revenue)}
                    color={CHART_COLORS.retail}
                  />
                ))}
              </Stack>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data produk terlaris</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>

        {/* Low Stock Warning Table */}
        <Grid item xs={12} md={12} lg={12} xl={7}>
          <AppCard sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 3 }}>
              Peringatan Stok Gudang (Kritis)
            </Typography>
            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Stack>
            ) : lowStock.length > 0 ? (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #F1F5F9", borderRadius: 2.5 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#FFF1F3" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Nama Produk</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Min Stok</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Stok Saat Ini</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStock.slice(0, 5).map((p, index) => {
                      const stockVal = Number(p.stock);
                      const minStockVal = Number(p.min_stock);
                      const isCritical = stockVal <= minStockVal * 0.5 || stockVal === 0;

                      return (
                        <TableRow key={index} sx={{ "&:hover": { backgroundColor: "#FFF8F9" } }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.825rem" }}>{p.name}</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.825rem" }}>{minStockVal}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isCritical ? "#EF4444" : "#D97706", fontSize: "0.825rem" }}>
                            {stockVal}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={isCritical ? "Sangat Kritis" : "Perlu Restock"}
                              color={isCritical ? "error" : "warning"}
                              size="small"
                              sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
                <Typography variant="body2" color="text.secondary">Kondisi stok gudang aman (tidak ada stok kritis)</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RetailDashboard;
