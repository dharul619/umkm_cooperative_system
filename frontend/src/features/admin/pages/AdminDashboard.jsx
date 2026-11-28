import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
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
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { AppButton, AppCard, PageHeader } from "../../../shared/components";
import { useDashboard } from "../hooks/useDashboard";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const formatCurrency = (value) =>
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

const formatMonthYear = (value) => {
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

const CHART_COLORS = {
  retail: "#E85D75",
  jastip: "#2563EB",
  profit: "#059669",
  retailLight: "#FFF1F3",
  jastipLight: "#DBEAFE",
  profitLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
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
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 2.5,
        p: 1.5,
        boxShadow: "0 16px 24px -6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.75, color: "#94A3B8" }}>
        {formatMonthYear(label)}
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

const KPICard = ({ title, value, subtitle, icon: Icon, color = "#7A2E3A", lightColor = "#FFF1F3", loading, onClick }) => {
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
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={100} height={34} sx={{ mt: 0.25 }} />
          ) : (
            <Typography variant="h5" fontWeight={850} color={color} sx={{ mt: 0.25 }}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
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

const ComposedRevenueSHUChart = ({ id, data, barKey, lineKey, barName, lineName, barColor, lineColor, height = 300 }) => (
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
        tickFormatter={formatMonthYear}
        axisLine={{ stroke: "#E2E8F0" }}
        tickLine={false}
      />
      <YAxis
        tickFormatter={formatCurrency}
        tick={{ fontSize: 10, fill: CHART_COLORS.slateText, fontWeight: 600 }}
        width={75}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 10 }} />
      <Bar dataKey={barKey} name={barName} fill={`url(#${id}Grad)`} radius={[6, 6, 0, 0]} barSize={28} />
      <Line
        type="monotone"
        dataKey={lineKey}
        name={lineName}
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
  valueFormatter = formatNumber,
  totalLabel,
  totalValue,
  loading = false,
  height = 180,
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
          <Tooltip formatter={(value) => valueFormatter(value)} />
        </PieChart>
        <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none", px: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.6rem", textTransform: "uppercase" }}>
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

const TopListItem = ({ title, subtitle, value, color = "#2563EB" }) => {
  const initials = String(title || "?")
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

const PredictionRestockCard = ({
  predictions,
  retailLowStock = [],
  loading,
  onOpenPredictions,
  title = "Prediksi & Prioritas Restok",
  maxItems = 4,
}) => {
  const predItems = predictions?.items || [];
  const priorityPred = predItems.filter((item) => item.stock_status !== "AMAN");
  const displayItems = (priorityPred.length ? priorityPred : predItems).slice(0, maxItems);
  const accuracy = predictions?.metrics?.accuracy;
  const priorityCount = predictions?.summary
    ? Number(predictions.summary.kritis_count || 0) + Number(predictions.summary.perlu_restok_count || 0)
    : retailLowStock.length;

  return (
    <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={800} color="text.primary">
          {title}
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
          label={`${priorityCount} Perlu Restok`}
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
      ) : retailLowStock.length > 0 ? (
        <Stack spacing={1.1}>
          {retailLowStock.slice(0, maxItems).map((item) => (
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

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 1.5, width: "100%" }}>
    {value === index && children}
  </Box>
);

// ===================== OVERVIEW TAB =====================
const OverviewTab = ({ shu, stats, retail, jastip, predictions, usersByDivision, months, loading, onNavigateToRoute }) => {
  const totalSHU = shu?.overview?.combined?.kopi_share || 0;

  const categoryChartData = (retail?.byCategory || []).map((c, idx) => ({
    name: c.category_name,
    value: Number(c.total_revenue),
    color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length],
  }));

  const jastipDivChartData = (jastip?.byDivision || []).map((d, idx) => ({
    name: d.division_name,
    value: Number(d.total_orders),
    color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length],
  }));

  const usersDivChartData = (usersByDivision || []).map((d, idx) => ({
    name: d.division_name,
    value: Number(d.user_count),
    color: CHART_COLORS.categories[(idx + 4) % CHART_COLORS.categories.length],
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <KPICard
          title="Total Penjualan"
          value={formatCurrency(shu?.overview?.combined?.total_penjualan || 0)}
          subtitle={`${months} bulan terakhir`}
          icon={ShoppingCartRounded}
          color="#7A2E3A"
          lightColor="#FFF1F3"
          loading={loading}
        />
        <KPICard
          title="Total Profit"
          value={formatCurrency(shu?.overview?.combined?.total_profit || 0)}
          subtitle={`Ritel + Jastip (${months} bln)`}
          icon={PointOfSaleRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
        />
        <KPICard
          title="SHU Ritel"
          value={formatCurrency(shu?.overview?.retail?.kopi_share || 0)}
          subtitle={`${formatNumber(shu?.overview?.retail?.total_transactions || 0)} transaksi ritel`}
          icon={TrendingUpRounded}
          color={CHART_COLORS.jastip}
          lightColor={CHART_COLORS.jastipLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/shu")}
        />
        <KPICard
          title="Total SHU"
          value={formatCurrency(totalSHU)}
          subtitle="80% profit ritel + bagi hasil jastip"
          icon={PointOfSaleRounded}
          color={CHART_COLORS.purple}
          lightColor={CHART_COLORS.purpleLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/shu")}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
        }}
      >
        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Profit {months === 1 ? "Mingguan" : "Bulanan"} (Ritel & Jastip)
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
          ) : shu?.comparison?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={shu.comparison} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="retailProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.retail} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={CHART_COLORS.retail} stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="jastipProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.jastip} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={CHART_COLORS.jastip} stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: CHART_COLORS.slateText, fontWeight: 700 }}
                  tickFormatter={formatMonthYear}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: CHART_COLORS.slateText, fontWeight: 700 }}
                  width={75}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 10 }} />
                <Bar dataKey="retail_profit" name="Ritel" fill="url(#retailProfitGrad)" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="jastip_profit" name="Jastip" fill="url(#jastipProfitGrad)" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>

        <PredictionRestockCard
          predictions={predictions}
          retailLowStock={retail?.lowStock}
          loading={loading}
          onOpenPredictions={() => onNavigateToRoute("/admin/predictions")}
        />
      </Box>

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
            Penjualan Ritel per Kategori
          </Typography>
          <DonutChartWithLegend
            data={categoryChartData}
            valueFormatter={formatCurrency}
            totalLabel="Omzet"
            totalValue={formatCurrency(categoryChartData.reduce((acc, c) => acc + c.value, 0))}
            loading={loading}
          />
        </AppCard>

        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
            Pesanan Jastip per Divisi
          </Typography>
          <DonutChartWithLegend
            data={jastipDivChartData}
            valueFormatter={(v) => `${formatNumber(v)} order`}
            totalLabel="Order"
            totalValue={formatNumber(jastipDivChartData.reduce((acc, d) => acc + d.value, 0))}
            loading={loading}
          />
        </AppCard>

        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
            Anggota per Divisi
          </Typography>
          <DonutChartWithLegend
            data={usersDivChartData}
            valueFormatter={(v) => `${formatNumber(v)} org`}
            totalLabel="Anggota"
            totalValue={formatNumber(usersDivChartData.reduce((acc, d) => acc + d.value, 0))}
            loading={loading}
          />
        </AppCard>
      </Box>

      <Box sx={{ width: "100%" }}>
        <AppCard>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              Log Aktivitas Terbaru
            </Typography>
            <AppButton variant="text" onClick={() => onNavigateToRoute("/admin/activity-logs")} sx={{ fontWeight: 800, p: 0 }}>
              Lihat Semua
            </AppButton>
          </Stack>
          {loading ? (
            <Stack spacing={1.5}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Stack>
          ) : stats?.recentActivity?.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableBody>
                  {stats.recentActivity.slice(0, 5).map((a, i) => (
                    <TableRow key={i} sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}>
                      <TableCell sx={{ py: 1.25, width: "25%", borderBottom: "1px solid #F1F5F9" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: CHART_COLORS.retailLight,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              color: CHART_COLORS.retail,
                              fontSize: "0.8rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {(a.user_name || "S").charAt(0)}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={750} color="text.primary">
                              {a.user_name || "Sistem"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{a.username || "sys"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, borderBottom: "1px solid #F1F5F9" }}>
                        <Typography variant="body2" color="text.primary" fontWeight={600}>
                          {a.activity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, width: "20%", borderBottom: "1px solid #F1F5F9" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {new Date(a.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              Belum ada aktivitas
            </Typography>
          )}
        </AppCard>
      </Box>
    </Box>
  );
};

// ===================== JASTIP TAB =====================
const JastipTab = ({ jastip, months, loading, onNavigateToRoute }) => {
  const statusData = (jastip?.overview?.sessionsByStatus || []).map((s, idx) => ({
    name: s.status,
    value: Number(s.count),
    color: [CHART_COLORS.jastip, CHART_COLORS.warning, CHART_COLORS.profit, CHART_COLORS.retail][idx % 4],
  }));

  const divisionData = (jastip?.byDivision || []).map((d, idx) => ({
    name: d.division_name,
    value: Number(d.total_orders),
    color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length],
  }));

  const vendorData = (jastip?.topVendors || []).map((v, idx) => ({
    name: v.vendor_name,
    value: Number(v.total_revenue),
    color: CHART_COLORS.categories[(idx + 3) % CHART_COLORS.categories.length],
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <KPICard
          title="Sesi Selesai"
          value={formatNumber(jastip?.overview?.orderStats?.total_orders || 0)}
          subtitle={`${months} bulan terakhir`}
          icon={StorefrontRounded}
          color="#7A2E3A"
          lightColor="#FFF1F3"
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/jastip/sesi")}
        />
        <KPICard
          title="Pendapatan Jastip"
          value={formatCurrency(jastip?.overview?.revenueStats?.total_revenue || 0)}
          subtitle={`Omzet ${months} bulan terakhir`}
          icon={ShoppingCartRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/jastip/sesi")}
        />
        <KPICard
          title="Profit Jastip"
          value={formatCurrency(jastip?.overview?.revenueStats?.total_profit || 0)}
          subtitle={`SHU ${formatCurrency(jastip?.overview?.revenueStats?.total_kopi_share || 0)}`}
          icon={PointOfSaleRounded}
          color={CHART_COLORS.jastip}
          lightColor={CHART_COLORS.jastipLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/jastip/shu")}
        />
      </Box>

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
            Tren Pendapatan & SHU Jastip ({months === 1 ? "Harian" : "Bulanan"})
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ) : jastip?.trend?.length > 0 ? (
            <ComposedRevenueSHUChart
              id="jastipRevenue"
              data={jastip.trend}
              barKey="revenue"
              lineKey="kopi_share"
              barName="Pendapatan"
              lineName="SHU Koperasi"
              barColor={CHART_COLORS.jastip}
              lineColor={CHART_COLORS.purple}
              height={300}
            />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>

        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Status Sesi Jastip
          </Typography>
          <DonutChartWithLegend
            data={statusData}
            valueFormatter={(v) => `${formatNumber(v)} sesi`}
            totalLabel="Sesi"
            totalValue={formatNumber(statusData.reduce((acc, s) => acc + s.value, 0))}
            loading={loading}
            height={220}
          />
        </AppCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Pemesanan per Divisi
          </Typography>
          <DonutChartWithLegend
            data={divisionData}
            valueFormatter={(v) => `${formatNumber(v)} order`}
            totalLabel="Divisi"
            totalValue={formatNumber(divisionData.length)}
            loading={loading}
            height={190}
          />
        </AppCard>

        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Kontribusi Vendor Jastip
          </Typography>
          <DonutChartWithLegend
            data={vendorData}
            valueFormatter={formatCurrency}
            totalLabel="Omzet"
            totalValue={formatCurrency(vendorData.reduce((acc, v) => acc + v.value, 0))}
            loading={loading}
            height={190}
          />
        </AppCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Top 5 Member Aktif
          </Typography>
          {loading ? (
            <Stack spacing={1.5}><Skeleton height={42} /><Skeleton height={42} /><Skeleton height={42} /></Stack>
          ) : jastip?.topMembers?.length > 0 ? (
            <Stack spacing={1.25}>
              {jastip.topMembers.slice(0, 5).map((m, i) => (
                <TopListItem
                  key={i}
                  title={m.member_name}
                  subtitle={`${formatNumber(m.total_orders)} pesanan`}
                  value={formatCurrency(m.total_spending)}
                  color={CHART_COLORS.retail}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>

        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Top 5 Menu Pilihan
          </Typography>
          {loading ? (
            <Stack spacing={1.5}><Skeleton height={42} /><Skeleton height={42} /><Skeleton height={42} /></Stack>
          ) : jastip?.topMenus?.length > 0 ? (
            <Stack spacing={1.25}>
              {jastip.topMenus.slice(0, 5).map((m, i) => (
                <TopListItem
                  key={i}
                  title={m.menu_name}
                  subtitle={m.vendor_name || "Vendor"}
                  value={formatCurrency(m.total_revenue)}
                  color={CHART_COLORS.purple}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>
      </Box>
    </Box>
  );
};

// ===================== RETAIL TAB =====================
const RetailTab = ({ retail, predictions, months, loading, onNavigateToRoute }) => {
  const priorityCount = predictions?.summary
    ? Number(predictions.summary.kritis_count || 0) + Number(predictions.summary.perlu_restok_count || 0)
    : Number(retail?.overview?.lowStockCount || 0);

  const restockSubtitle = predictions?.summary
    ? `Kritis ${predictions.summary.kritis_count} • Restok ${predictions.summary.perlu_restok_count}`
    : "Cek prediksi stok";

  const subcatSalesData = (retail?.bySubcategory || []).map((c, idx) => ({
    name: c.subcategory_name,
    value: Number(c.total_revenue),
    color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length],
  }));

  const inventorySubcatData = (retail?.inventoryBySubcategory || []).map((c, idx) => ({
    name: c.subcategory_name,
    value: Number(c.total_value),
    color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length],
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <KPICard
          title="Produk Terjual"
          value={formatNumber(retail?.overview?.salesStats?.sold_products || 0)}
          subtitle={`Dari ${formatNumber(retail?.overview?.productStats?.active_products || 0)} produk aktif`}
          icon={Inventory2Rounded}
          color="#7A2E3A"
          lightColor="#FFF1F3"
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/stok")}
        />
        <KPICard
          title="Penjualan Ritel"
          value={formatCurrency(retail?.overview?.salesStats?.total_revenue || 0)}
          subtitle={`${formatNumber(retail?.overview?.salesStats?.total_transactions || 0)} transaksi (${months} bln)`}
          icon={ShoppingCartRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/penjualan")}
        />
        <KPICard
          title="Profit Ritel"
          value={formatCurrency(retail?.overview?.salesStats?.total_profit || 0)}
          subtitle={`SHU ${formatCurrency(retail?.overview?.salesStats?.total_kopi_share || 0)}`}
          icon={PointOfSaleRounded}
          color={CHART_COLORS.jastip}
          lightColor={CHART_COLORS.jastipLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/shu")}
        />
        <KPICard
          title="Perlu Restok"
          value={`${formatNumber(priorityCount)} Produk`}
          subtitle={restockSubtitle}
          icon={WarningAmberRounded}
          color={CHART_COLORS.warning}
          lightColor={CHART_COLORS.warningLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/predictions")}
        />
      </Box>

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
            Tren Penjualan & SHU Ritel ({months === 1 ? "Mingguan" : "Bulanan"})
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ) : retail?.trend?.length > 0 ? (
            <ComposedRevenueSHUChart
              id="retailRevenue"
              data={retail.trend}
              barKey="revenue"
              lineKey="kopi_share"
              barName="Penjualan"
              lineName="SHU Koperasi"
              barColor={CHART_COLORS.retail}
              lineColor={CHART_COLORS.profit}
              height={300}
            />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>

        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Top 5 Produk Terlaris
          </Typography>
          {loading ? (
            <Stack spacing={1.5}><Skeleton height={42} /><Skeleton height={42} /><Skeleton height={42} /></Stack>
          ) : retail?.topProducts?.length > 0 ? (
            <Stack spacing={1.25}>
              {retail.topProducts.slice(0, 5).map((p, i) => (
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
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
            Penjualan per Sub-Kategori
          </Typography>
          <DonutChartWithLegend
            data={subcatSalesData}
            valueFormatter={formatCurrency}
            totalLabel="Sub-Kat"
            totalValue={formatNumber(subcatSalesData.length)}
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
            valueFormatter={formatCurrency}
            totalLabel="Nilai Stok"
            totalValue={formatCurrency(inventorySubcatData.reduce((acc, c) => acc + c.value, 0))}
            loading={loading}
            height={200}
          />
        </AppCard>

        <PredictionRestockCard
          predictions={predictions}
          retailLowStock={retail?.lowStock}
          loading={loading}
          onOpenPredictions={() => onNavigateToRoute("/admin/predictions")}
          title="Prioritas Restok (RF)"
        />
      </Box>
    </Box>
  );
};

// ===================== USER TAB =====================
const UserTab = ({ stats, pendingUsers = [], approveUser, rejectUser, months, loading, onNavigateToRoute }) => {
  const approvedUsers = Math.max(1, Number(stats?.users?.approved || 0));

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <KPICard
          title="Total Anggota"
          value={formatNumber(stats?.users?.total || 0)}
          subtitle="Semua user terdaftar"
          icon={PeopleAltRounded}
          color="#7A2E3A"
          lightColor="#FFF1F3"
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/users")}
        />
        <KPICard
          title="Anggota Aktif"
          value={formatNumber(stats?.users?.approved || 0)}
          subtitle="Status approved"
          icon={PeopleAltRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/users")}
        />
        <KPICard
          title="Pending Approval"
          value={formatNumber(stats?.users?.pending || 0)}
          subtitle="Menunggu verifikasi"
          icon={PeopleAltRounded}
          color={CHART_COLORS.warning}
          lightColor={CHART_COLORS.warningLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/users")}
        />
        <KPICard
          title="Registrasi Baru"
          value={formatNumber(stats?.periodRegistrations ?? stats?.todayRegistrations ?? 0)}
          subtitle={`${months} bulan terakhir`}
          icon={PeopleAltRounded}
          color={CHART_COLORS.jastip}
          lightColor={CHART_COLORS.jastipLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/users")}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <AppCard>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Anggota Aktif per Peran
          </Typography>
          {loading ? (
            <Stack spacing={2.5}><Skeleton height={42} /><Skeleton height={42} /><Skeleton height={42} /></Stack>
          ) : stats?.byRole?.length > 0 ? (
            <Stack spacing={2.25} sx={{ py: 0.5 }}>
              {stats.byRole.map((r, i) => {
                const percentage = Math.min(100, (Number(r.count || 0) / approvedUsers) * 100);
                const colors = ["#7A2E3A", "#2563EB", "#D97706", "#059669"];
                const themeColor = colors[i % colors.length];

                return (
                  <Box key={r.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {r.role_name}
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color={themeColor}>
                        {formatNumber(r.count)} ({percentage.toFixed(0)}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#F1F5F9",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: themeColor,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>

        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Persetujuan Anggota ({pendingUsers.length})
          </Typography>
          {loading ? (
            <Stack spacing={1.5}><Skeleton height={50} /><Skeleton height={50} /><Skeleton height={50} /></Stack>
          ) : pendingUsers.length > 0 ? (
            <Stack spacing={1.5} sx={{ maxHeight: 280, overflowY: "auto", pr: 0.5 }}>
              {pendingUsers.slice(0, 5).map((u, i) => (
                <Stack
                  key={i}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ p: 1.5, borderRadius: 2, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
                >
                  <Box sx={{ minWidth: 0, mr: 1.5 }}>
                    <Typography variant="body2" fontWeight={750} color="text.primary" noWrap>
                      {u.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      @{u.username} • {u.phone_number}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <AppButton
                      variant="contained"
                      size="small"
                      onClick={() => approveUser(u.id)}
                      sx={{ bgcolor: CHART_COLORS.profit, color: "white", fontWeight: 800, fontSize: "0.7rem", py: 0.25, px: 1.5 }}
                    >
                      Setujui
                    </AppButton>
                    <AppButton
                      variant="outlined"
                      size="small"
                      onClick={() => rejectUser(u.id)}
                      sx={{ color: "#EF4444", borderColor: "#EF4444", fontWeight: 800, fontSize: "0.7rem", py: 0.25, px: 1.5 }}
                    >
                      Tolak
                    </AppButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
              <Typography variant="body2" color="text.secondary">Tidak ada pendaftaran pending</Typography>
            </Box>
          )}
        </AppCard>
      </Box>
    </Box>
  );
};

// ===================== MAIN COMPONENT =====================
const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const {
    stats,
    jastip,
    retail,
    shu,
    predictions,
    pendingUsers,
    usersByDivision,
    approveUser,
    rejectUser,
    loading,
    error,
    months,
    setMonths,
    refresh,
  } = useDashboard(tab);
  const navigate = useNavigate();

  const periodFilterActions = (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <Select
          value={months}
          onChange={(e) => setMonths(e.target.value)}
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
        onClick={refresh}
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

  return (
    <Box sx={{ minHeight: "100%", width: "100%" }}>
      <PageHeader title="Dashboard Admin" actions={periodFilterActions} />

      {error && (
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, pb: 0.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            backgroundColor: "#F1F5F9",
            p: 0.75,
            borderRadius: 3,
            display: "inline-flex",
            minHeight: 44,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTab-root": {
              borderRadius: 2.5,
              minHeight: 36,
              py: 0.5,
              px: 3,
              fontWeight: 800,
              fontSize: "0.875rem",
              textTransform: "none",
              color: "#64748B",
              gap: 1,
              "&.Mui-selected": {
                color: "#FFFFFF",
                backgroundColor: CHART_COLORS.retail,
              },
            },
          }}
        >
          <Tab icon={<DashboardRounded fontSize="small" />} iconPosition="start" label="Overview" />
          <Tab icon={<StorefrontRounded fontSize="small" />} iconPosition="start" label="Jastip" />
          <Tab icon={<ShoppingCartRounded fontSize="small" />} iconPosition="start" label="Ritel" />
          <Tab icon={<PeopleAltRounded fontSize="small" />} iconPosition="start" label="User" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <OverviewTab
          shu={shu}
          stats={stats}
          retail={retail}
          jastip={jastip}
          predictions={predictions}
          usersByDivision={usersByDivision}
          months={months}
          loading={loading}
          onNavigateToRoute={navigate}
        />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <JastipTab jastip={jastip} months={months} loading={loading} onNavigateToRoute={navigate} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <RetailTab retail={retail} predictions={predictions} months={months} loading={loading} onNavigateToRoute={navigate} />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <UserTab
          stats={stats}
          pendingUsers={pendingUsers}
          approveUser={approveUser}
          rejectUser={rejectUser}
          months={months}
          loading={loading}
          onNavigateToRoute={navigate}
        />
      </TabPanel>
    </Box>
  );
};

export default AdminDashboard;
