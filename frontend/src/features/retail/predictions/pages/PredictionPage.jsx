import { useCallback, useEffect, useMemo, useState } from "react";
import AutoGraphRounded from "@mui/icons-material/AutoGraphRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Box,
  Chip,
  MenuItem,
  Paper,
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
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AppButton,
  AppCard,
  AppTextField,
  PageHeader,
  StatusAlert,
} from "../../../../shared/components";
import { predictionService } from "../services/predictionService";

const formatNumber = (val) => new Intl.NumberFormat("id-ID").format(Number(val || 0));

const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
};

const formatWeekLabel = (dateStr) => {
  if (!dateStr) return "-";
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const HORIZON_OPTIONS = [
  { value: 1, label: "1 Minggu" },
  { value: 2, label: "2 Minggu" },
  { value: 4, label: "4 Minggu" },
  { value: 8, label: "8 Minggu" },
];

const BACKTEST_PERIOD_OPTIONS = [
  { value: "LAST_4", label: "4 Minggu Terakhir" },
  { value: "CUSTOM", label: "Custom Tanggal" },
];

const filterBacktestSlice = (backtestList = [], period, customFrom, customTo) => {
  if (period === "CUSTOM") {
    return backtestList.filter(
      (b) => (!customFrom || b.week >= customFrom) && (!customTo || b.week <= customTo),
    );
  }
  return backtestList.slice(-4);
};

const statusChipProps = (status) => {
  if (status === "KRITIS") return { label: "Kritis", color: "error" };
  if (status === "PERLU RESTOK") return { label: "Perlu Restok", color: "warning" };
  return { label: "Aman", color: "success" };
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color, bgLight, loading }) => (
  <AppCard
    sx={{
      height: "100%",
      background: `linear-gradient(135deg, #FFFFFF 0%, ${bgLight} 100%)`,
      border: "1px solid #F1F5F9",
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          backgroundColor: `${color}15`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
          {title}
        </Typography>
        {loading ? (
          <Skeleton width={90} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={850} color={color}>
            {value}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  </AppCard>
);

const PredictionPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [horizon, setHorizon] = useState(4);
  const [backtestPeriod, setBacktestPeriod] = useState("LAST_4");
  const [customFromWeek, setCustomFromWeek] = useState("");
  const [customToWeek, setCustomToWeek] = useState("");

  const syncDefaultsFromPayload = useCallback((result) => {
    if (result?.items?.length) {
      setSelectedProductId((prev) => prev || String(result.items[0].product_id));
    }
    const weeks = result?.available_weeks || [];
    if (weeks.length) {
      setCustomFromWeek((prev) => (prev && weeks.includes(prev) ? prev : weeks[Math.max(0, weeks.length - 12)]));
      setCustomToWeek((prev) => (prev && weeks.includes(prev) ? prev : weeks[weeks.length - 1]));
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await predictionService.getSummary();
      setData(result);
      syncDefaultsFromPayload(result);
    } catch (err) {
      setError(err?.message || "Gagal memuat data prediksi");
    } finally {
      setLoading(false);
    }
  }, [syncDefaultsFromPayload]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleRunPipeline = async () => {
    try {
      setRunning(true);
      setError("");
      setSuccess("");
      const res = await predictionService.runPipeline();
      if (res?.data) {
        setData(res.data);
        syncDefaultsFromPayload(res.data);
      }
      setSuccess(res?.message || "Prediksi Random Forest berhasil diperbarui");
    } catch (err) {
      setError(err?.message || "Gagal memperbarui prediksi Random Forest");
    } finally {
      setRunning(false);
    }
  };

  const items = useMemo(() => data?.items || [], [data]);
  const availableWeeks = useMemo(() => data?.available_weeks || [], [data]);
  const latestBacktestWeek = availableWeeks[availableWeeks.length - 1] || "";

  const activeMetrics = useMemo(() => {
    let totalAbsError = 0;
    let totalActual = 0;
    let count = 0;
    const weekSet = new Set();

    items.forEach((item) => {
      const slice = filterBacktestSlice(item.backtest, backtestPeriod, customFromWeek, customToWeek);
      slice.forEach((row) => {
        const actual = Number(row.actual_qty || 0);
        const predicted = Number(row.predicted_qty || 0);
        totalAbsError += Math.abs(actual - predicted);
        totalActual += Math.abs(actual);
        count += 1;
        if (row.week) weekSet.add(row.week);
      });
    });

    if (!count && backtestPeriod === "LAST_4" && data?.metrics) {
      return {
        ...data.metrics,
        weeks_count: 4,
      };
    }

    const mae = count > 0 ? totalAbsError / count : 0;
    const wape = totalActual > 0 ? (totalAbsError / totalActual) * 100 : 0;
    const accuracy = Math.max(0, 100 - wape);

    return {
      mae: Number(mae.toFixed(2)),
      wape: Number(wape.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      test_rows: count,
      weeks_count: weekSet.size,
    };
  }, [items, backtestPeriod, customFromWeek, customToWeek, data]);

  const itemsWithHorizon = useMemo(
    () =>
      items.map((item) => {
        const forecastSlice = (item.forecast || []).slice(0, horizon);
        const predHorizon = forecastSlice.reduce(
          (sum, entry) => sum + Number(entry.predicted_qty || 0),
          0,
        );
        const currentStock = Number(item.current_stock || 0);
        const minStock = Number(item.min_stock || 0);
        const predWeek1 = Number(forecastSlice[0]?.predicted_qty ?? item.pred_week_1 ?? 0);
        const restock1Week = Math.max(0, predWeek1 + minStock - currentStock);
        const restockHorizon = Math.max(0, predHorizon + minStock - currentStock);

        let stockStatus = "AMAN";
        if (currentStock <= minStock) {
          stockStatus = "KRITIS";
        } else if ((horizon === 1 ? restockHorizon : restock1Week) > 0) {
          stockStatus = "PERLU RESTOK";
        }

        return {
          ...item,
          pred_horizon: predHorizon,
          restock_horizon: restockHorizon,
          stock_status: stockStatus,
        };
      }),
    [items, horizon],
  );

  const horizonSummary = useMemo(
    () => ({
      total_products: itemsWithHorizon.length,
      kritis_count: itemsWithHorizon.filter((i) => i.stock_status === "KRITIS").length,
      perlu_restok_count: itemsWithHorizon.filter((i) => i.stock_status === "PERLU RESTOK").length,
      aman_count: itemsWithHorizon.filter((i) => i.stock_status === "AMAN").length,
    }),
    [itemsWithHorizon],
  );

  const totalPredHorizon = useMemo(
    () => itemsWithHorizon.reduce((sum, item) => sum + Number(item.pred_horizon || 0), 0),
    [itemsWithHorizon],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return itemsWithHorizon.filter((item) => {
      const matchesSearch =
        !q ||
        [item.product_name, item.category_name, item.subcategory_name, item.brand_name, item.barcode]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PRIORITAS" && (item.stock_status === "KRITIS" || item.stock_status === "PERLU RESTOK")) ||
        item.stock_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [itemsWithHorizon, search, statusFilter]);

  const selectedProduct = useMemo(() => {
    if (!itemsWithHorizon.length) return null;
    return itemsWithHorizon.find((i) => String(i.product_id) === String(selectedProductId)) || itemsWithHorizon[0];
  }, [itemsWithHorizon, selectedProductId]);

  const chartIncludesForecast = useMemo(
    () =>
      backtestPeriod === "LAST_4" ||
      (backtestPeriod === "CUSTOM" && (!customToWeek || !latestBacktestWeek || customToWeek >= latestBacktestWeek)),
    [backtestPeriod, customToWeek, latestBacktestWeek],
  );

  const chartData = useMemo(() => {
    if (!selectedProduct) return [];
    const backtestSlice = filterBacktestSlice(
      selectedProduct.backtest || [],
      backtestPeriod,
      customFromWeek,
      customToWeek,
    );
    const backtestPoints = backtestSlice.map((b) => ({
      label: formatShortDate(b.week),
      phase: "Uji",
      actual_qty: b.actual_qty,
      predicted_qty: b.predicted_qty,
    }));
    const forecastSlice = (selectedProduct.forecast || []).slice(0, horizon);
    const forecastPoints = forecastSlice.map((f, idx) => ({
      label: `${formatShortDate(f.week)} (+${idx + 1})`,
      phase: "Prediksi",
      actual_qty: null,
      predicted_qty: f.predicted_qty,
    }));
    return chartIncludesForecast ? [...backtestPoints, ...forecastPoints] : backtestPoints;
  }, [selectedProduct, backtestPeriod, customFromWeek, customToWeek, horizon, chartIncludesForecast]);

  const weekIndices = useMemo(
    () => Array.from({ length: horizon }, (_, idx) => idx + 1),
    [horizon],
  );

  const tableColSpan = 6 + horizon + (horizon > 1 ? 1 : 0);

  return (
    <Box>
      <PageHeader
        title="Prediksi Penjualan"
        actions={
          <>
            <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={fetchData} disabled={loading || running}>
              Refresh
            </AppButton>
            <AppButton startIcon={<PlayArrowRounded />} onClick={handleRunPipeline} disabled={running}>
              {running ? "Memproses..." : "Hitung Prediksi"}
            </AppButton>
          </>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>
        {success}
      </StatusAlert>

      {/* Ringkasan KPI */}
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <MetricCard
          title="Akurasi"
          value={`${activeMetrics.accuracy}%`}
          subtitle={`WAPE ${activeMetrics.wape}% • MAE ${activeMetrics.mae}`}
          icon={AutoGraphRounded}
          color="#C93F58"
          bgLight="#FFF1F3"
          loading={loading}
        />
        <MetricCard
          title="Perlu Restok"
          value={`${horizonSummary.kritis_count + horizonSummary.perlu_restok_count} Produk`}
          subtitle={`Kritis ${horizonSummary.kritis_count} • Restok ${horizonSummary.perlu_restok_count}`}
          icon={WarningAmberRounded}
          color="#D97706"
          bgLight="#FEF3C7"
          loading={loading}
        />
        <MetricCard
          title="Stok Aman"
          value={`${horizonSummary.aman_count} Produk`}
          subtitle={`Total ${horizonSummary.total_products} produk`}
          icon={CheckCircleRounded}
          color="#059669"
          bgLight="#D1FAE5"
          loading={loading}
        />
        <MetricCard
          title="Total Prediksi"
          value={`${formatNumber(totalPredHorizon)} pcs`}
          subtitle={`${horizon} minggu ke depan`}
          icon={Inventory2Rounded}
          color="#2563EB"
          bgLight="#DBEAFE"
          loading={loading}
        />
      </Box>

      {/* Grafik Perbandingan Aktual vs Prediksi per Produk */}
      <AppCard sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 2 }}>
          Grafik Aktual vs Prediksi
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            mb: 2.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md:
                backtestPeriod === "CUSTOM"
                  ? "minmax(0, 2fr) repeat(4, minmax(0, 1fr))"
                  : "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)",
            },
          }}
        >
          <AppTextField
            select
            fullWidth
            label="Produk"
            value={selectedProduct ? String(selectedProduct.product_id) : ""}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            {itemsWithHorizon.map((item) => (
              <MenuItem key={item.product_id} value={String(item.product_id)}>
                {item.product_name}
              </MenuItem>
            ))}
          </AppTextField>
          <AppTextField
            select
            fullWidth
            label="Horizon"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
          >
            {HORIZON_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </AppTextField>
          <AppTextField
            select
            fullWidth
            label="Periode"
            value={backtestPeriod}
            onChange={(e) => setBacktestPeriod(e.target.value)}
          >
            {BACKTEST_PERIOD_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </AppTextField>
          {backtestPeriod === "CUSTOM" && (
            <>
              <AppTextField
                select
                fullWidth
                label="Dari"
                value={customFromWeek}
                onChange={(e) => {
                  const nextFrom = e.target.value;
                  setCustomFromWeek(nextFrom);
                  if (customToWeek && nextFrom > customToWeek) {
                    setCustomToWeek(nextFrom);
                  }
                }}
              >
                {availableWeeks.map((week) => (
                  <MenuItem key={week} value={week}>
                    {formatWeekLabel(week)}
                  </MenuItem>
                ))}
              </AppTextField>
              <AppTextField
                select
                fullWidth
                label="Sampai"
                value={customToWeek}
                onChange={(e) => {
                  const nextTo = e.target.value;
                  setCustomToWeek(nextTo);
                  if (customFromWeek && nextTo < customFromWeek) {
                    setCustomFromWeek(nextTo);
                  }
                }}
              >
                {availableWeeks.map((week) => (
                  <MenuItem key={week} value={week}>
                    {formatWeekLabel(week)}
                  </MenuItem>
                ))}
              </AppTextField>
            </>
          )}
        </Box>

        {loading ? (
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="actual_qty" name="Aktual" fill="#94A3B8" radius={[6, 6, 0, 0]} barSize={28} />
              <Line
                type="monotone"
                dataKey="predicted_qty"
                name="Prediksi"
                stroke="#C93F58"
                strokeWidth={3}
                dot={{ r: 5, fill: "#FFFFFF", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Belum ada data prediksi.
            </Typography>
          </Box>
        )}
      </AppCard>

      {/* Tabel Prediksi & Rekomendasi Restok */}
      <AppCard>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <AppTextField
            label="Cari produk / kategori / brand"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: "100%", md: 340 } }}
          />
          <AppTextField
            select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 220 } }}
          >
            <MenuItem value="ALL">Semua Status ({itemsWithHorizon.length})</MenuItem>
            <MenuItem value="PRIORITAS">
              Prioritas Restok ({horizonSummary.kritis_count + horizonSummary.perlu_restok_count})
            </MenuItem>
            <MenuItem value="KRITIS">Kritis ({horizonSummary.kritis_count})</MenuItem>
            <MenuItem value="PERLU RESTOK">Perlu Restok ({horizonSummary.perlu_restok_count})</MenuItem>
            <MenuItem value="AMAN">Aman ({horizonSummary.aman_count})</MenuItem>
          </AppTextField>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #F1F5F9", borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#FFF1F3" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>Produk</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#7A2E3A" }}>Stok</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#7A2E3A" }}>Min Stok</TableCell>
                {weekIndices.map((weekNum) => (
                  <TableCell key={weekNum} align="right" sx={{ fontWeight: 800, color: "#7A2E3A", whiteSpace: "nowrap" }}>
                    Mg +{weekNum}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 800, color: "#7A2E3A", whiteSpace: "nowrap" }}>
                  Total {horizon} Mg
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#7A2E3A", whiteSpace: "nowrap" }}>
                  Restok 1 Mg
                </TableCell>
                {horizon > 1 && (
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#7A2E3A", whiteSpace: "nowrap" }}>
                    Restok {horizon} Mg
                  </TableCell>
                )}
                <TableCell align="center" sx={{ fontWeight: 800, color: "#7A2E3A" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={tableColSpan}>
                      <Skeleton height={28} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((row) => {
                  const chip = statusChipProps(row.stock_status);
                  const isSelected = selectedProduct?.product_id === row.product_id;
                  return (
                    <TableRow
                      key={row.product_id}
                      hover
                      selected={isSelected}
                      onClick={() => setSelectedProductId(String(row.product_id))}
                      sx={{
                        cursor: "pointer",
                        "&.Mui-selected": { backgroundColor: "#FFF6F8" },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {row.product_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.subcategory_name} • {row.brand_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatNumber(row.current_stock)}</TableCell>
                      <TableCell align="right">{formatNumber(row.min_stock)}</TableCell>
                      {weekIndices.map((weekNum) => (
                        <TableCell key={weekNum} align="right">
                          {formatNumber(row[`pred_week_${weekNum}`])}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#2563EB" }}>
                        {formatNumber(row.pred_horizon)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 800, color: row.restock_1_week > 0 ? "#D97706" : "text.secondary" }}
                      >
                        {formatNumber(row.restock_1_week)}
                      </TableCell>
                      {horizon > 1 && (
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: row.restock_horizon > 0 ? "#7A2E3A" : "text.secondary" }}
                        >
                          {formatNumber(row.restock_horizon)}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Chip label={chip.label} color={chip.color} size="small" sx={{ fontWeight: 800, fontSize: 11 }} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColSpan} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada produk yang sesuai filter pencarian.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>
    </Box>
  );
};

export default PredictionPage;
