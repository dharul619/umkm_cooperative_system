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
  BarChart,
} from "recharts";
import {
  Box,
  Grid,
  Skeleton,
  Stack,
  Typography,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import { AppCard, PageHeader, AppButton } from "../../../shared/components";
import { useDashboard } from "../hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

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

// Beautiful Glassmorphic Card representing high-end aesthetics
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
          <Box
            sx={{
              color: color,
              display: "flex",
              alignItems: "center",
              animation: "fadeIn 0.2s ease-in-out",
              opacity: 0.7,
            }}
          >
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
          const [, m] = v.split("-");
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
  const initials = title.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
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

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 1.5, width: "100%" }}>
    {value === index && children}
  </Box>
);

// ===================== OVERVIEW TAB =====================
const OverviewTab = ({ shu, stats, retail, jastip, usersByDivision, loading, onNavigateToRoute }) => {
  const totalSHU = (shu?.overview?.combined?.kopi_share || 0);

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Total Penjualan"
            value={formatCurrency(shu?.overview?.combined?.total_penjualan || 0)}
            subtitle="Ritel + Jastip"
            icon={ShoppingCartRounded}
            color="#7A2E3A"
            lightColor="#FFF1F3"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Total Profit"
            value={formatCurrency(shu?.overview?.combined?.total_profit || 0)}
            subtitle="Semua unit usaha"
            icon={PointOfSaleRounded}
            color={CHART_COLORS.profit}
            lightColor={CHART_COLORS.profitLight}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="SHU Bulan Ini"
            value={formatCurrency(shu?.overview?.thisMonth?.kopi_share || 0)}
            subtitle={`Profit: ${formatCurrency(shu?.overview?.thisMonth?.profit || 0)}`}
            icon={TrendingUpRounded}
            color={CHART_COLORS.jastip}
            lightColor={CHART_COLORS.jastipLight}
            loading={loading}
            onClick={() => onNavigateToRoute("/admin/reports/retail/shu")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Total SHU"
            value={formatCurrency(totalSHU)}
            subtitle="50% dari profit bersih"
            icon={PointOfSaleRounded}
            color={CHART_COLORS.purple}
            lightColor={CHART_COLORS.purpleLight}
            loading={loading}
            onClick={() => onNavigateToRoute("/admin/reports/retail/shu")}
          />
        </Grid>
      </Grid>

      {/* Row 2: Bar Chart + 2 Donut Charts (md=8, md=2, md=2) */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        {/* 1. Bar Chart (md={8}) */}
        <Grid item xs={12} md={8}>
          <AppCard sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" fontWeight={850} color="text.primary" sx={{ mb: 2.5, px: 1 }}>
              Profit per Bulan (Gabungan Ritel & Jastip)
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : shu?.comparison?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={shu.comparison} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="retailProfitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.retail} stopOpacity={0.85}/>
                      <stop offset="100%" stopColor={CHART_COLORS.retail} stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="jastipProfitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.jastip} stopOpacity={0.85}/>
                      <stop offset="100%" stopColor={CHART_COLORS.jastip} stopOpacity={0.15}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: CHART_COLORS.slateText, fontWeight: 700 }}
                    tickFormatter={(v) => {
                      const [, m] = v.split("-");
                      const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
                      return months[parseInt(m) - 1] || v;
                    }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fontSize: 11, fill: CHART_COLORS.slateText, fontWeight: 700 }}
                    width={75}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800, paddingTop: 10 }} />
                  <Bar dataKey="retail_profit" name="Retail" fill="url(#retailProfitGrad)" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="jastip_profit" name="Jastip" fill="url(#jastipProfitGrad)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>

        {/* 2. Donut Chart: Penjualan Ritel per Kategori (md={2}) */}
        <Grid item xs={12} sm={6} md={2}>
          <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1, fontSize: "0.75rem", lineHeight: 1.2 }}>
              Penjualan Ritel Kategori
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : retail?.byCategory?.length > 0 ? (
              <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 280, flexGrow: 1 }}>
                <PieChart width={150} height={150}>
                  <Pie
                    data={retail.byCategory
                      .map((c, idx) => ({
                        name: c.category_name,
                        value: Number(c.total_revenue),
                        color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {retail.byCategory
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
                <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.5rem", textTransform: "uppercase" }}>
                    Omzet
                  </Typography>
                  <Typography variant="body2" fontWeight={850} color="text.primary" sx={{ fontSize: "0.7rem" }}>
                    {formatCurrency(retail.byCategory.reduce((acc, curr) => acc + Number(curr.total_revenue), 0))}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>

        {/* 3. Donut Chart: Pemesanan Jastip per Divisi (md={2}) */}
        <Grid item xs={12} sm={6} md={2}>
          <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1, fontSize: "0.75rem", lineHeight: 1.2 }}>
              Pemesanan Jastip Divisi
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : jastip?.byDivision?.length > 0 ? (
              <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 280, flexGrow: 1 }}>
                <PieChart width={150} height={150}>
                  <Pie
                    data={jastip.byDivision
                      .map((d, idx) => ({
                        name: d.division_name,
                        value: d.total_orders,
                        color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {jastip.byDivision
                      .map((d, idx) => ({
                        name: d.division_name,
                        value: d.total_orders,
                        color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)
                      .map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${formatNumber(value)} Pesanan`} />
                </PieChart>
                <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.5rem", textTransform: "uppercase" }}>
                    Order
                  </Typography>
                  <Typography variant="body2" fontWeight={850} color="text.primary" sx={{ fontSize: "0.75rem" }}>
                    {formatNumber(jastip.byDivision.reduce((acc, curr) => acc + Number(curr.total_orders), 0))}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>

      {/* Row 3: Donut Chart + Log Aktivitas (md=2, md=10) */}
      <Grid container spacing={3}>
        {/* 1. Donut Chart: Anggota per Divisi (md={2}) */}
        <Grid item xs={12} sm={6} md={2}>
          <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1, fontSize: "0.75rem", lineHeight: 1.2 }}>
              Anggota per Divisi
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : usersByDivision?.length > 0 ? (
              <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 280, flexGrow: 1 }}>
                <PieChart width={150} height={150}>
                  <Pie
                    data={usersByDivision
                      .map((d, idx) => ({
                        name: d.division_name,
                        value: Number(d.user_count),
                        color: CHART_COLORS.categories[(idx + 4) % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {usersByDivision
                      .map((d, idx) => ({
                        name: d.division_name,
                        value: Number(d.user_count),
                        color: CHART_COLORS.categories[(idx + 4) % CHART_COLORS.categories.length] || "#6B7280"
                      }))
                      .filter((d) => d.value > 0)
                      .map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${formatNumber(value)} Anggota`} />
                </PieChart>
                <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.5rem", textTransform: "uppercase" }}>
                    Anggota
                  </Typography>
                  <Typography variant="body2" fontWeight={850} color="text.primary" sx={{ fontSize: "0.75rem" }}>
                    {formatNumber(usersByDivision.reduce((acc, curr) => acc + Number(curr.user_count), 0))}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>

        {/* 2. Log Aktivitas Koperasi (Melebar md={10}) */}
        <Grid item xs={12} md={10}>
          <AppCard sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={855} color="text.primary">
                Log Aktivitas Koperasi Terbaru
              </Typography>
              <AppButton
                variant="text"
                onClick={() => onNavigateToRoute("/admin/activity-logs")}
                sx={{ fontWeight: 800, p: 0 }}
              >
                Semua Aktivitas
              </AppButton>
            </Stack>
            {loading ? (
              <Stack spacing={1.5}><Skeleton height={42} /><Skeleton height={42} /><Skeleton height={42} /></Stack>
            ) : stats?.recentActivity?.length > 0 ? (
              <Box sx={{ overflowX: "auto", flexGrow: 1, maxHeight: 280 }}>
                <Table size="medium">
                  <TableBody>
                    {stats.recentActivity.slice(0, 5).map((a, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          "&:hover": { backgroundColor: "#F8FAFC" },
                          transition: "background-color 0.15s"
                        }}
                      >
                        <TableCell sx={{ py: 1, pl: 2, width: "25%", borderBottom: "1px solid #F1F5F9" }}>
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
                                textTransform: "uppercase"
                              }}
                            >
                              {(a.user_name || "S").charAt(0)}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ fontSize: "0.85rem" }}>
                                {a.user_name || "Sistem"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                @{a.username || "sys"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: "1px solid #F1F5F9" }}>
                          <Typography variant="body2" color="text.primary" fontWeight={700} sx={{ fontSize: "0.85rem" }}>
                            {a.activity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5, pr: 2, width: "20%", borderBottom: "1px solid #F1F5F9" }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: "0.8rem" }}>
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
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3, flexGrow: 1 }}>
                Belum ada aktivitas
              </Typography>
            )}
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ===================== JASTIP TAB =====================
const JastipTab = ({ jastip, loading, onNavigateToRoute }) => (
  <Box sx={{ width: "100%" }}>
    <Grid container spacing={3} sx={{ mb: 4.5 }}>
      <Grid item xs={12} sm={6} md={4}>
        <PremiumKPICard
          title="Total Sesi Selesai"
          value={formatNumber(jastip?.overview?.orderStats?.total_orders || 0)}
          subtitle="Sesi kuliner DONE"
          icon={StorefrontRounded}
          color="#7A2E3A"
          lightColor="#FFF1F3"
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/jastip/sesi")}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <PremiumKPICard
          title="Total Pendapatan"
          value={formatCurrency(jastip?.overview?.revenueStats?.total_revenue || 0)}
          subtitle="Layanan Titip Beli"
          icon={ShoppingCartRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/jastip/sesi")}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <PremiumKPICard
          title="Total Profit Koperasi"
          value={formatCurrency(jastip?.overview?.revenueStats?.total_profit || 0)}
          subtitle="Porsi bagi hasil SHU"
          icon={PointOfSaleRounded}
          color={CHART_COLORS.jastip}
          lightColor={CHART_COLORS.jastipLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/jastip/shu")}
        />
      </Grid>
    </Grid>

    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <AppCard sx={{ p: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 3, px: 1 }}>
            Tren Pendapatan & Bagi Hasil Jastip Bulanan
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ) : jastip?.trend?.length > 0 ? (
            <ComposedRevenueSHUChart
              id="jastipRevenue"
              data={jastip.trend}
              barKey="revenue"
              lineKey="kopi_share"
              barName="Revenue"
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
      </Grid>

      <Grid item xs={12} md={4}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
            Status Sesi Jastip
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ) : jastip?.overview?.sessionsByStatus?.length > 0 ? (
            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 220, mt: 2 }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={jastip.overview.sessionsByStatus
                    .map((s, idx) => ({
                      name: s.status,
                      value: s.count,
                      color: [CHART_COLORS.jastip, CHART_COLORS.warning, CHART_COLORS.profit, CHART_COLORS.retail][idx % 4] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {jastip.overview.sessionsByStatus
                    .map((s, idx) => ({
                      name: s.status,
                      value: s.count,
                      color: [CHART_COLORS.jastip, CHART_COLORS.warning, CHART_COLORS.profit, CHART_COLORS.retail][idx % 4] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
              </PieChart>
              <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750}>
                  Total Sesi
                </Typography>
                <Typography variant="h6" fontWeight={850} color="text.primary">
                  {formatNumber(jastip?.overview?.sessionsByStatus?.reduce((acc, curr) => acc + curr.count, 0) || 0)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>
      </Grid>
    </Grid>

    <Grid container spacing={3} sx={{ mt: 1.5 }}>
      <Grid item xs={12} sm={6} md={3}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
            Pemesanan per Divisi
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ) : jastip?.byDivision?.length > 0 ? (
            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={jastip.byDivision
                    .map((d, idx) => ({
                      name: d.division_name,
                      value: d.total_orders,
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
                  {jastip.byDivision
                    .map((d, idx) => ({
                      name: d.division_name,
                      value: d.total_orders,
                      color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => `${formatNumber(value)} Pesanan`} />
              </PieChart>
              <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750}>
                  Divisi
                </Typography>
                <Typography variant="h6" fontWeight={850} color="text.primary">
                  {formatNumber(jastip?.byDivision?.length || 0)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
            Kontribusi Vendor Jastip
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          ) : jastip?.topVendors?.length > 0 ? (
            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={jastip.topVendors
                    .map((v, idx) => ({
                      name: v.vendor_name,
                      value: Number(v.total_revenue),
                      color: CHART_COLORS.categories[(idx + 3) % CHART_COLORS.categories.length] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {jastip.topVendors
                    .map((v, idx) => ({
                      name: v.vendor_name,
                      value: Number(v.total_revenue),
                      color: CHART_COLORS.categories[(idx + 3) % CHART_COLORS.categories.length] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
              <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750}>
                  Total Revenue
                </Typography>
                <Typography variant="caption" display="block" fontWeight={850} color="text.primary" sx={{ fontSize: "0.75rem" }}>
                  {formatCurrency(jastip?.topVendors?.reduce((acc, curr) => acc + Number(curr.total_revenue), 0) || 0)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
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
                  subtitle="Pesanan kuliner"
                  value={formatCurrency(m.total_spending)}
                  color={CHART_COLORS.retail}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
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
                  subtitle="Unit Layanan Kuliner"
                  value={formatCurrency(m.total_revenue)}
                  color={CHART_COLORS.purple}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>
      </Grid>
    </Grid>
  </Box>
);

// ===================== RETAIL TAB =====================
const RetailTab = ({ retail, loading, onNavigateToRoute }) => (
  <Box sx={{ width: "100%" }}>
    <Grid container spacing={3} sx={{ mb: 4.5 }}>
      <Grid item xs={12} sm={6} md={4}>
        <PremiumKPICard
          title="Total Produk Aktif"
          value={formatNumber(retail?.overview?.productStats?.active_products || 0)}
          subtitle={`Dari total ${formatNumber(retail?.overview?.productStats?.total_products || 0)} produk`}
          icon={Inventory2Rounded}
          color="#7A2E3A"
          lightColor="#FFF1F3"
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/stok")}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <PremiumKPICard
          title="Revenue Warung Ritel"
          value={formatCurrency(retail?.overview?.salesStats?.total_revenue || 0)}
          subtitle={`${formatNumber(retail?.overview?.salesStats?.total_transactions || 0)} transaksi`}
          icon={ShoppingCartRounded}
          color={CHART_COLORS.profit}
          lightColor={CHART_COLORS.profitLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/penjualan")}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <PremiumKPICard
          title="Profit Warung Ritel"
          value={formatCurrency(retail?.overview?.salesStats?.total_profit || 0)}
          subtitle="Porsi bagi hasil SHU"
          icon={PointOfSaleRounded}
          color={CHART_COLORS.jastip}
          lightColor={CHART_COLORS.jastipLight}
          loading={loading}
          onClick={() => onNavigateToRoute("/admin/reports/retail/shu")}
        />
      </Grid>
    </Grid>

    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <AppCard sx={{ p: 0.5, height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 3, px: 1 }}>
            Tren Transaksi Penjualan & SHU Ritel Bulanan
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
      </Grid>
      <Grid item xs={12} md={4}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
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
                  subtitle={`${p.category_name || 'Ritel'} - ${formatNumber(p.total_qty)} terjual`}
                  value={formatCurrency(p.total_revenue)}
                  color={CHART_COLORS.retail}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>Belum ada data</Typography>
          )}
        </AppCard>
      </Grid>
    </Grid>

    <Grid container spacing={3} sx={{ mt: 1.5 }}>
      <Grid item xs={12} md={6}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
            Penjualan per Sub-Kategori
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          ) : retail?.bySubcategory?.length > 0 ? (
            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 220 }}>
              <PieChart width={220} height={220}>
                <Pie
                  data={retail.bySubcategory
                    .map((c, idx) => ({
                      name: c.subcategory_name,
                      value: Number(c.total_revenue),
                      color: CHART_COLORS.categories[idx % CHART_COLORS.categories.length] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {retail.bySubcategory
                    .map((c, idx) => ({
                      name: c.subcategory_name,
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
              <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750}>
                  Sub-Kategori
                </Typography>
                <Typography variant="h6" fontWeight={855} color="text.primary">
                  {formatNumber(retail?.bySubcategory?.length || 0)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <AppCard sx={{ height: "100%" }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2 }}>
            Aset Inventori per Sub-Kategori
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          ) : retail?.inventoryBySubcategory?.length > 0 ? (
            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 220 }}>
              <PieChart width={220} height={220}>
                <Pie
                  data={retail.inventoryBySubcategory
                    .map((c, idx) => ({
                      name: c.subcategory_name,
                      value: Number(c.total_value),
                      color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {retail.inventoryBySubcategory
                    .map((c, idx) => ({
                      name: c.subcategory_name,
                      value: Number(c.total_value),
                      color: CHART_COLORS.categories[(idx + 2) % CHART_COLORS.categories.length] || "#6B7280"
                    }))
                    .filter((d) => d.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
              <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={750}>
                  Total Nilai
                </Typography>
                <Typography variant="body2" fontWeight={855} color="text.primary" sx={{ fontSize: "0.875rem" }}>
                  {formatCurrency(retail.inventoryBySubcategory.reduce((acc, curr) => acc + Number(curr.total_value), 0))}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
              <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
            </Box>
          )}
        </AppCard>
      </Grid>
    </Grid>
  </Box>
);

// ===================== USER TAB =====================
const UserTab = ({ stats, pendingUsers = [], approveUser, rejectUser, loading, onNavigateToRoute }) => {
  const totalUsers = stats?.users?.total || 1;

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Total Anggota"
            value={formatNumber(stats?.users?.total || 0)}
            subtitle="Seluruh user terdaftar"
            icon={PeopleAltRounded}
            color="#7A2E3A"
            lightColor="#FFF1F3"
            loading={loading}
            onClick={() => onNavigateToRoute("/admin/users")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Anggota Aktif"
            value={formatNumber(stats?.users?.approved || 0)}
            subtitle="Status pendaftaran approved"
            icon={PeopleAltRounded}
            color={CHART_COLORS.profit}
            lightColor={CHART_COLORS.profitLight}
            loading={loading}
            onClick={() => onNavigateToRoute("/admin/users")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Pending Approval"
            value={formatNumber(stats?.users?.pending || 0)}
            subtitle="Menunggu verifikasi admin"
            icon={PeopleAltRounded}
            color={CHART_COLORS.warning}
            lightColor={CHART_COLORS.warningLight}
            loading={loading}
            onClick={() => onNavigateToRoute("/admin/users")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PremiumKPICard
            title="Registrasi Hari Ini"
            value={formatNumber(stats?.todayRegistrations || 0)}
            subtitle="Pendaftaran baru koperasi"
            icon={PeopleAltRounded}
            color={CHART_COLORS.jastip}
            lightColor={CHART_COLORS.jastipLight}
            loading={loading}
            onClick={() => onNavigateToRoute("/admin/users")}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2.5 }}>
              Sebaran Anggota Berdasarkan Peran
            </Typography>
            {loading ? (
              <Stack spacing={2.5}><Skeleton height={42} /><Skeleton height={42} /><Skeleton height={42} /></Stack>
            ) : stats?.byRole?.length > 0 ? (
              <Stack spacing={2.5} sx={{ py: 1 }}>
                {stats.byRole.map((r, i) => {
                  const percentage = (r.count / totalUsers) * 100;
                  const colors = ["#7A2E3A", "#2563EB", "#D97706", "#059669"];
                  const themeColor = colors[i] || "#7A2E3A";

                  return (
                    <Box key={r.id}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={750} color="text.primary">
                          {r.role_name}
                        </Typography>
                        <Typography variant="body2" fontWeight={850} color={themeColor}>
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
                          }
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
        </Grid>
        <Grid item xs={12} md={6}>
          <AppCard sx={{ height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
              Persetujuan Anggota Baru ({pendingUsers.length})
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
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "scale(1.005)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0, mr: 1.5 }}>
                      <Typography variant="body2" fontWeight={800} color="text.primary" noWrap>
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
                        sx={{
                          bgcolor: CHART_COLORS.profit,
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          py: 0.25,
                          px: 1.5,
                          borderRadius: 2,
                          "&:hover": { bgcolor: "#059669" }
                        }}
                      >
                        Setujui
                      </AppButton>
                      <AppButton
                        variant="outlined"
                        size="small"
                        onClick={() => rejectUser(u.id)}
                        sx={{
                          color: "#EF4444",
                          borderColor: "#EF4444",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          py: 0.25,
                          px: 1.5,
                          borderRadius: 2,
                          "&:hover": { borderColor: "#DC2626", bgcolor: "#FEF2F2" }
                        }}
                      >
                        Tolak
                      </AppButton>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6 }}>
                <Typography variant="body2" color="text.secondary">Tidak ada pendaftaran pending</Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ===================== MAIN COMPONENT =====================
const AdminDashboard = () => {
  const { stats, jastip, retail, shu, pendingUsers, usersByDivision, approveUser, rejectUser, loading, error, months, setMonths, refresh } = useDashboard();
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  const handleRouteRedirect = (path) => {
    navigate(path);
  };

  const periodFilterActions = (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          startAdornment={<CalendarMonthRounded fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />}
          sx={{
            backgroundColor: "white",
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.875rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#E2E8F0",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: CHART_COLORS.retail,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: CHART_COLORS.retail,
            },
          }}
        >
          <MenuItem value={6} sx={{ fontWeight: 700 }}>6 Bulan Terakhir</MenuItem>
          <MenuItem value={12} sx={{ fontWeight: 700 }}>12 Bulan Terakhir</MenuItem>
        </Select>
      </FormControl>
      <AppButton
        variant="contained"
        onClick={refresh}
        startIcon={<RefreshRounded />}
        sx={{
          borderRadius: 2.5,
          fontWeight: 800,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          backgroundColor: CHART_COLORS.retail,
          "&:hover": {
            backgroundColor: "#BE123C",
          }
        }}
      >
        Refresh
      </AppButton>
    </Stack>
  );

  return (
    <Box sx={{ background: "linear-gradient(180deg, #FFF8F9 0%, #FFFFFF 100%)", minHeight: "100%", width: "100%", boxSizing: "border-box", display: "block", p: 0.5, borderRadius: 4 }}>
      <PageHeader
        title="Dashboard Admin"
        description="Pusat analisis data operasional dan SHU Koperasi Ciledug Jaya Makmur"
        actions={periodFilterActions}
      />

      {error && (
        <Box sx={{ mb: 3.5, p: 2, borderRadius: 2.5, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Segmented Pill Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3.5, pb: 0.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => handleTabChange(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            backgroundColor: "#F1F5F9",
            p: 0.75,
            borderRadius: 3.5,
            display: "inline-flex",
            minHeight: 46,
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTab-root": {
              borderRadius: 2.75,
              minHeight: 38,
              py: 0.75,
              px: 3.5,
              fontWeight: 800,
              fontSize: "0.875rem",
              textTransform: "none",
              color: "#64748B",
              gap: 1,
              transition: "all 0.25s ease",
              "&.Mui-selected": {
                color: "#FFFFFF",
                backgroundColor: CHART_COLORS.retail,
                boxShadow: "0 6px 16px -4px rgba(232, 93, 117, 0.4)",
              },
              "&:hover:not(.Mui-selected)": {
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                color: "text.primary",
              }
            },
          }}
        >
          <Tab icon={<DashboardRounded fontSize="small" />} iconPosition="start" label="Overview" />
          <Tab icon={<StorefrontRounded fontSize="small" />} iconPosition="start" label="Jastip" />
          <Tab icon={<ShoppingCartRounded fontSize="small" />} iconPosition="start" label="Retail" />
          <Tab icon={<PeopleAltRounded fontSize="small" />} iconPosition="start" label="User" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <OverviewTab
          shu={shu}
          stats={stats}
          retail={retail}
          jastip={jastip}
          usersByDivision={usersByDivision}
          loading={loading}
          onNavigateToRoute={handleRouteRedirect}
        />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <JastipTab
          jastip={jastip}
          loading={loading}
          onNavigateToRoute={handleRouteRedirect}
        />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <RetailTab
          retail={retail}
          loading={loading}
          onNavigateToRoute={handleRouteRedirect}
        />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <UserTab
          stats={stats}
          pendingUsers={pendingUsers}
          approveUser={approveUser}
          rejectUser={rejectUser}
          loading={loading}
          onNavigateToRoute={handleRouteRedirect}
        />
      </TabPanel>
    </Box>
  );
};

export default AdminDashboard;
