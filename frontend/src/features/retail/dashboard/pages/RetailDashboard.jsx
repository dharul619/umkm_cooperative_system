import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppButton, AppCard, PageHeader } from "../../../../shared/components";
import { dashboardService } from "../../../admin/services/dashboardService";
import { predictionService } from "../../predictions/services/predictionService";
import { salesService } from "../../sales/services/salesService";

import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import AutoGraphRounded from "@mui/icons-material/AutoGraphRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const formatCurrencyCompact = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatCurrencyFull = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));

const formatPeriodLabel = (value) => {
  if (!value || !String(value).includes("-")) return value || "-";
  const parts = String(value).split("-");
  const year = parts[0];
  const monthLabel = MONTH_NAMES[parseInt(parts[1], 10) - 1];
  if (!monthLabel) return value;
  if (parts.length === 3) {
    return `${parseInt(parts[2], 10)} ${monthLabel}`;
  }
  return `${monthLabel} '${year.slice(-2)}`;
};

const formatFullMonthYear = (ym) => {
  if (!ym || !String(ym).includes("-")) return "";
  const [year, month] = String(ym).split("-");
  const monthLabel = MONTH_NAMES[parseInt(month, 10) - 1];
  return monthLabel ? `${monthLabel} ${year}` : ym;
};

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: CHART_COLORS.darkBg,
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 2.5,
        p: 1.5,
        boxShadow: "0 16px 24px -6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        display="block"
        sx={{ mb: 0.75, color: "#94A3B8", letterSpacing: 0.4, textTransform: "uppercase" }}
      >
        {formatPeriodLabel(label)}
      </Typography>
      <Stack spacing={0.5}>
        {payload.map((entry, i) => (
          <Stack key={i} direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.color }} />
            <Typography variant="caption" sx={{ color: "#E2E8F0", fontWeight: 600 }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#F8FAFC", fontWeight: 800, ml: "auto" }}>
              {formatCurrencyFull(entry.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

const RetailKPICard = ({ title, value, subtitle, icon: Icon, color = "#7A2E3A", lightColor = "#FFF1F3", loading, onClick }) => {
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
        background: `linear-gradient(135deg, #FFFFFF 0%, ${lightColor}40 100%)`,
        border: `1px solid ${hovered && onClick ? color : "#E2E8F0"}`,
        transition: "all 0.2s ease",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ height: "100%" }}>
        <Box
          sx={{
            p: 1.75,
            borderRadius: 3,
            backgroundColor: `${color}15`,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon fontSize="medium" />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={105} height={34} sx={{ mt: 0.25 }} />
          ) : (
            <Typography variant="h5" fontWeight={850} color={color} sx={{ mt: 0.25, letterSpacing: "-0.4px" }}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {onClick && hovered && (
          <Box sx={{ color, display: "flex", alignItems: "center", opacity: 0.75 }}>
            <ArrowForwardRounded fontSize="small" />
          </Box>
        )}
      </Stack>
    </AppCard>
  );
};

const ComposedSalesProfitChart = ({ id, data, barColor, lineColor, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
      <defs>
        <linearGradient id={`${id}Grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={barColor} stopOpacity={0.85} />
          <stop offset="100%" stopColor={barColor} stopOpacity={0.15} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
      <XAxis
        dataKey="month"
        tick={{ fontSize: 10, fill: CHART_COLORS.slateText, fontWeight: 600 }}
        tickFormatter={formatPeriodLabel}
        axisLine={{ stroke: "#E2E8F0" }}
        tickLine={false}
      />
      <YAxis
        tickFormatter={formatCurrencyCompact}
        tick={{ fontSize: 10, fill: CHART_COLORS.slateText, fontWeight: 600 }}
        width={75}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 10 }} />
      <Bar dataKey="revenue" name="Total Penjualan" fill={`url(#${id}Grad)`} radius={[6, 6, 0, 0]} barSize={28} />
      <Line
        type="monotone"
        dataKey="profit"
        name="Margin Keuntungan"
        stroke={lineColor}
        strokeWidth={3}
        dot={{ r: 4, strokeWidth: 1.5, fill: "#FFFFFF" }}
        activeDot={{ r: 6 }}
      />
    </ComposedChart>
  </ResponsiveContainer>
);

const DonutChartWithLegend = ({
  data = [],
  valueFormatter = formatCurrencyCompact,
  totalLabel,
  totalValue,
  loading = false,
  height = 200,
}) => {
  const chartData = data.filter((d) => Number(d.value) > 0);
  const total = chartData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />;
  }

  if (!chartData.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height }}>
        <Typography variant="body2" color="text.secondary">
          Belum ada data
        </Typography>
      </Box>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="center"
      sx={{ minHeight: height, flexGrow: 1 }}
    >
      <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
        <PieChart width={156} height={156}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={44}
            outerRadius={66}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrencyFull(value)} />
        </PieChart>
        <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none", px: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.6rem", textTransform: "uppercase", display: "block" }}>
            {totalLabel}
          </Typography>
          <Typography variant="body2" fontWeight={850} color="text.primary" sx={{ fontSize: "0.75rem" }}>
            {totalValue}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={0.85} sx={{ width: "100%", minWidth: 0, maxHeight: height, overflowY: "auto", pr: 0.5 }}>
        {chartData.map((item, idx) => {
          const pct = total > 0 ? Math.round((Number(item.value) / total) * 100) : 0;
          return (
            <Stack key={idx} direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
              <Typography variant="caption" fontWeight={700} color="text.primary" noWrap sx={{ flexGrow: 1 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                {valueFormatter(item.value)} ({pct}%)
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

const TopListItem = ({ title, subtitle, value, color = "#E85D75" }) => {
  const initials = String(title || "PR")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        p: 1.25,
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        border: "1px solid #F1F5F9",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateX(4px)",
          backgroundColor: "#F8FAFC",
          borderColor: `${color}30`,
        },
      }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          fontSize: 12,
          fontWeight: 800,
          backgroundColor: `${color}15`,
          color,
        }}
      >
        {initials}
      </Avatar>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" fontWeight={750} noWrap color="text.primary">
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
          {subtitle}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={800} color={color} sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Stack>
  );
};

const PredictionRestockCard = ({ predictions, lowStock = [], loading, onOpenPredictions }) => {
  const predItems = predictions?.items || [];
  const priorityPred = predItems.filter((item) => item.stock_status !== "AMAN");
  const displayItems = (priorityPred.length ? priorityPred : predItems).slice(0, 4);
  const accuracy = predictions?.metrics?.accuracy;
  const priorityCount = predictions?.summary
    ? Number(predictions.summary.kritis_count || 0) + Number(predictions.summary.perlu_restok_count || 0)
    : lowStock.length;

  return (
    <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={800} color="text.primary">
          Prioritas Restok (RF)
        </Typography>
        <AppButton variant="text" size="small" onClick={onOpenPredictions} sx={{ fontWeight: 800, p: 0 }}>
          Detail
        </AppButton>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {accuracy !== undefined && (
          <Chip
            size="small"
            label={`Akurasi ${accuracy}%`}
            sx={{ fontWeight: 800, bgcolor: "#FFF1F3", color: "#C93F58" }}
          />
        )}
        <Chip
          size="small"
          label={`${formatNumber(priorityCount)} Perlu Restok`}
          color={priorityCount > 0 ? "warning" : "success"}
          sx={{ fontWeight: 800 }}
        />
      </Stack>

      {loading ? (
        <Stack spacing={1.25}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </Stack>
      ) : displayItems.length > 0 ? (
        <Stack spacing={1.1}>
          {displayItems.map((item) => {
            const isCritical = item.stock_status === "KRITIS";
            const needRestock = Number(item.restock_1_week || 0);
            return (
              <Stack
                key={item.product_id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{ p: 1.25, borderRadius: 2, border: "1px solid #F1F5F9", backgroundColor: "#FAFAFA" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={750} noWrap>
                    {item.product_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                    Stok {formatNumber(item.current_stock)} • Pred 1 Mg: {formatNumber(item.pred_week_1)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={needRestock > 0 ? `+${formatNumber(needRestock)}` : "Aman"}
                  color={isCritical ? "error" : needRestock > 0 ? "warning" : "success"}
                  sx={{ fontWeight: 800, flexShrink: 0 }}
                />
              </Stack>
            );
          })}
        </Stack>
      ) : lowStock.length > 0 ? (
        <Stack spacing={1.1}>
          {lowStock.slice(0, 4).map((item) => (
            <Stack
              key={item.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              sx={{ p: 1.25, borderRadius: 2, border: "1px solid #F1F5F9", backgroundColor: "#FAFAFA" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={750} noWrap>
                  {item.product_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stok {formatNumber(item.current_stock)} / Min {formatNumber(item.min_stock)}
                </Typography>
              </Box>
              <Chip size="small" label="Low" color="warning" sx={{ fontWeight: 800 }} />
            </Stack>
          ))}
        </Stack>
      ) : (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Semua stok aman
          </Typography>
        </Box>
      )}
    </AppCard>
  );
};

const RetailDashboard = () => {
  const navigate = useNavigate();
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [bySubcategory, setBySubcategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [inventoryBySubcategory, setInventoryBySubcategory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [activeShift, setActiveShift] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        overviewRes,
        trendRes,
        subcatRes,
        topProductsRes,
        lowStockRes,
        inventorySubcatRes,
        predictionsRes,
        activeShiftRes,
      ] = await Promise.allSettled([
        dashboardService.getRetailOverview(months),
        dashboardService.getRetailSalesTrendMonthly(months),
        dashboardService.getSalesBySubcategory(10, months),
        dashboardService.getTopSellingProducts(10, months),
        dashboardService.getLowStockProducts(20),
        dashboardService.getInventoryBySubcategory(),
        predictionService.getSummary(),
        salesService.getActiveShift(),
      ]);

      const coreResults = [
        overviewRes,
        trendRes,
        subcatRes,
        topProductsRes,
        lowStockRes,
        inventorySubcatRes,
      ];
      const rejectedCoreCount = coreResults.filter((r) => r.status === "rejected").length;
      if (rejectedCoreCount === coreResults.length) {
        setError("Gagal memuat data dashboard ritel. Silakan coba segarkan kembali.");
      } else if (rejectedCoreCount > 0) {
        setError("Sebagian data dashboard gagal dimuat. Silakan coba segarkan kembali.");
      }

      setOverview(overviewRes.status === "fulfilled" ? overviewRes.value : null);

      const rawTrend = trendRes.status === "fulfilled" ? trendRes.value : [];
      setTrend(
        rawTrend.map((row) => ({
          ...row,
          transactions: Number(row.transactions || 0),
          revenue: Number(row.revenue || 0),
          profit: Number(row.profit || 0),
          kopi_share: Number(row.kopi_share || 0),
        }))
      );

      setBySubcategory(subcatRes.status === "fulfilled" ? subcatRes.value : []);
      setTopProducts(topProductsRes.status === "fulfilled" ? topProductsRes.value : []);
      setLowStock(lowStockRes.status === "fulfilled" ? lowStockRes.value : []);
      setInventoryBySubcategory(inventorySubcatRes.status === "fulfilled" ? inventorySubcatRes.value : []);
      setPredictions(predictionsRes.status === "fulfilled" ? predictionsRes.value : null);
      setActiveShift(activeShiftRes.status === "fulfilled" ? activeShiftRes.value : null);
    } catch (err) {
      console.error("Gagal mengambil data dashboard retail:", err);
      setError("Gagal memuat data dashboard ritel. Silakan coba segarkan kembali.");
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
    <Stack direction="row" spacing={1.5} alignItems="center">
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <Select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          startAdornment={<CalendarMonthRounded fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />}
          sx={{
            backgroundColor: "white",
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: CHART_COLORS.retail },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: CHART_COLORS.retail },
          }}
        >
          <MenuItem value={1} sx={{ fontWeight: 700 }}>1 Bulan Terakhir</MenuItem>
          <MenuItem value={6} sx={{ fontWeight: 700 }}>6 Bulan Terakhir</MenuItem>
          <MenuItem value={12} sx={{ fontWeight: 700 }}>12 Bulan Terakhir</MenuItem>
          <MenuItem value={24} sx={{ fontWeight: 700 }}>24 Bulan Terakhir</MenuItem>
        </Select>
      </FormControl>
      <AppButton
        variant="contained"
        onClick={fetchDashboardData}
        startIcon={<RefreshRounded />}
        sx={{
          borderRadius: 2.5,
          fontWeight: 800,
          backgroundColor: CHART_COLORS.retail,
          "&:hover": { backgroundColor: "#BE123C" },
        }}
      >
        Refresh
      </AppButton>
    </Stack>
  );

  // Derived KPI metrics
  const totalSales = Number(overview?.salesStats?.total_revenue || 0);
  const totalTransactions = Number(overview?.salesStats?.total_transactions || 0);
  const totalProfit = Number(overview?.salesStats?.total_profit || 0);
  const totalKopiShare = Number(overview?.salesStats?.total_kopi_share || 0);
  const totalCoordShare = Number(overview?.salesStats?.total_coordinator_share || 0);
  const totalInventoryValue = Number(overview?.inventoryValue?.total_inventory_value || 0);
  const totalProducts = Number(overview?.productStats?.total_products || 0);
  const activeProducts = Number(overview?.productStats?.active_products || 0);
  const totalPurchaseSpent = Number(overview?.purchaseStats?.total_spent || 0);
  const lowStockCount = Number(overview?.lowStockCount || 0);

  const latestMonthLabel = formatFullMonthYear(overview?.thisMonth?.period_month);
  const latestMonthRevenue = Number(overview?.thisMonth?.total_revenue || 0);

  const kritisCount = Number(predictions?.summary?.kritis_count || 0);
  const restokCount = Number(predictions?.summary?.perlu_restok_count || 0);
  const hasPredictionSummary = Boolean(predictions?.summary);
  const priorityCount = hasPredictionSummary ? kritisCount + restokCount : lowStockCount;

  const subcatSalesData = bySubcategory.map((c, idx) => ({
    name: c.subcategory_name,
    value: Number(c.total_revenue || 0),
    color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length],
  }));

  const inventorySubcatData = inventoryBySubcategory.map((c, idx) => ({
    name: c.subcategory_name,
    value: Number(c.total_value || 0),
    color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length],
  }));

  return (
    <Box sx={{ minHeight: "100%", width: "100%" }}>
      <PageHeader
        eyebrow="Retail Coordinator Workspace"
        title="Dashboard Ritel"
        description="Pantau performa penjualan ritel koperasi, pembagian hasil, nilai inventori, kondisi stok gudang, dan prioritas restok."
        actions={pageActions}
      />

      {error && (
        <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
          <Typography variant="body2" fontWeight={700}>{error}</Typography>
        </Box>
      )}

      {/* Operational Status & Quick Shortcuts */}
      <AppCard sx={{ mb: 3 }} contentSx={{ py: 1.5, px: 2.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            {loading ? (
              <Skeleton width={210} height={28} />
            ) : activeShift ? (
              <Chip
                size="small"
                icon={<PointOfSaleRounded fontSize="small" />}
                label={`Shift Aktif: ${activeShift.shift_code}`}
                sx={{ fontWeight: 800, bgcolor: "#D1FAE5", color: "#065F46", "& .MuiChip-icon": { color: "#059669" } }}
              />
            ) : (
              <Chip
                size="small"
                icon={<PointOfSaleRounded fontSize="small" />}
                label="Belum ada shift kasir terbuka"
                sx={{ fontWeight: 700, bgcolor: "#F1F5F9", color: "#475569" }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton
              variant="outlined"
              size="small"
              startIcon={<PointOfSaleRounded />}
              onClick={() => navigate("/retail/master/sales")}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Buka POS Kasir
            </AppButton>
            <AppButton
              variant="outlined"
              size="small"
              startIcon={<ReceiptLongRounded />}
              onClick={() => navigate("/retail/master/purchases")}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Catat Pembelian
            </AppButton>
            <AppButton
              variant="outlined"
              size="small"
              startIcon={<AutoGraphRounded />}
              onClick={() => navigate("/retail/master/predictions")}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Prediksi Restok
            </AppButton>
          </Stack>
        </Stack>
      </AppCard>

      {/* Row 1: KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <RetailKPICard
          title="Penjualan Ritel"
          value={formatCurrencyCompact(totalSales)}
          subtitle={
            latestMonthLabel
              ? `${formatNumber(totalTransactions)} trx (${months} bln) • ${latestMonthLabel}: ${formatCurrencyCompact(latestMonthRevenue)}`
              : `${formatNumber(totalTransactions)} transaksi (${months} bln)`
          }
          icon={ShoppingCartRounded}
          color={CHART_COLORS.retail}
          lightColor={CHART_COLORS.retailLight}
          loading={loading}
          onClick={() => navigate("/retail/master/sales")}
        />
        <RetailKPICard
          title="Profit Ritel"
          value={formatCurrencyCompact(totalProfit)}
          subtitle={`Koordinator ${formatCurrencyCompact(totalCoordShare)} • Koperasi ${formatCurrencyCompact(totalKopiShare)}`}
          icon={TrendingUpRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
          onClick={() => navigate("/retail/master/sales")}
        />
        <RetailKPICard
          title="Nilai Inventori"
          value={formatCurrencyCompact(totalInventoryValue)}
          subtitle={`${formatNumber(activeProducts)}/${formatNumber(totalProducts)} aktif • Belanja ${months} bln: ${formatCurrencyCompact(totalPurchaseSpent)}`}
          icon={Inventory2Rounded}
          color={CHART_COLORS.blue}
          lightColor={CHART_COLORS.blueLight}
          loading={loading}
          onClick={() => navigate("/retail/master/inventory")}
        />
        <RetailKPICard
          title="Prioritas Restok"
          value={`${formatNumber(priorityCount)} Produk`}
          subtitle={
            hasPredictionSummary
              ? `Kritis ${kritisCount} • Restok ${restokCount} • Stok ≤ min: ${lowStockCount}`
              : "Stok di bawah batas minimum"
          }
          icon={WarningAmberRounded}
          color={CHART_COLORS.warning}
          lightColor={CHART_COLORS.warningLight}
          loading={loading}
          onClick={() => navigate("/retail/master/predictions")}
        />
      </Box>

      {/* Row 2: Sales Trend Chart & Top 5 Products */}
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
        }}
      >
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Tren Penjualan & Profit Ritel ({months === 1 ? "Mingguan" : "Bulanan"})
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ) : trend.length > 0 ? (
            <ComposedSalesProfitChart
              id="retailSalesTrend"
              data={trend}
              barColor={CHART_COLORS.retail}
              lineColor={CHART_COLORS.profit}
              height={300}
            />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
              <Typography variant="body2" color="text.secondary">
                Belum ada data tren penjualan
              </Typography>
            </Box>
          )}
        </AppCard>

        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Top 5 Produk Terlaris ({months} bln)
          </Typography>
          {loading ? (
            <Stack spacing={1.5}>
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </Stack>
          ) : topProducts.length > 0 ? (
            <Stack spacing={1.25}>
              {topProducts.slice(0, 5).map((p, i) => (
                <TopListItem
                  key={p.product_id || i}
                  title={p.product_name}
                  subtitle={`${p.category_name || "Ritel"} • ${formatNumber(p.total_qty)} terjual`}
                  value={formatCurrencyFull(p.total_revenue)}
                  color={CHART_COLORS.retail}
                />
              ))}
            </Stack>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Belum ada data produk terlaris
              </Typography>
            </Box>
          )}
        </AppCard>
      </Box>

      {/* Row 3: Subcategory Sales, Inventory Valuation, & RF Prediction Priorities */}
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
            Penjualan per Sub-Kategori ({months} bln)
          </Typography>
          <DonutChartWithLegend
            data={subcatSalesData}
            valueFormatter={formatCurrencyCompact}
            totalLabel="Omzet"
            totalValue={formatCurrencyCompact(subcatSalesData.reduce((acc, c) => acc + c.value, 0))}
            loading={loading}
            height={200}
          />
        </AppCard>

        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
            Nilai Stok per Sub-Kategori
          </Typography>
          <DonutChartWithLegend
            data={inventorySubcatData}
            valueFormatter={formatCurrencyCompact}
            totalLabel="Nilai Stok"
            totalValue={formatCurrencyCompact(inventorySubcatData.reduce((acc, c) => acc + c.value, 0))}
            loading={loading}
            height={200}
          />
        </AppCard>

        <PredictionRestockCard
          predictions={predictions}
          lowStock={lowStock}
          loading={loading}
          onOpenPredictions={() => navigate("/retail/master/predictions")}
        />
      </Box>

      {/* Row 4: Full-Width Low Stock Alert Table */}
      <AppCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary">
            Peringatan Stok Gudang (Stok ≤ Min Stok)
          </Typography>
          <AppButton
            variant="text"
            size="small"
            onClick={() => navigate("/retail/master/inventory")}
            sx={{ fontWeight: 800, p: 0 }}
          >
            Kelola Inventori
          </AppButton>
        </Stack>

        {loading ? (
          <Stack spacing={1}>
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
                  <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Min Stok</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Stok Saat Ini</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStock.slice(0, 8).map((p, index) => {
                  const stockVal = Number(p.current_stock || 0);
                  const minStockVal = Number(p.min_stock || 0);
                  const isEmpty = stockVal === 0;
                  const isCritical = isEmpty || stockVal <= minStockVal * 0.5;
                  const unitLabel = p.unit ? ` ${p.unit}` : "";

                  return (
                    <TableRow key={p.id || index} sx={{ "&:hover": { backgroundColor: "#FFF8F9" } }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.825rem" }}>{p.product_name}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{p.category_name || "-"}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.825rem" }}>
                        {formatNumber(minStockVal)}{unitLabel}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: isCritical ? "#EF4444" : "#D97706", fontSize: "0.825rem" }}>
                        {formatNumber(stockVal)}{unitLabel}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isEmpty ? "Habis" : isCritical ? "Sangat Kritis" : "Perlu Restock"}
                          color={isCritical ? "error" : "warning"}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 3, px: 2, borderRadius: 2, backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", textAlign: "center" }}>
            <Typography variant="body2" fontWeight={700} color="#065F46">
              Kondisi stok gudang aman (tidak ada produk dengan stok di bawah minimum)
            </Typography>
          </Box>
        )}
      </AppCard>
    </Box>
  );
};

export default RetailDashboard;
