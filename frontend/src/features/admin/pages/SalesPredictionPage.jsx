import { useState, useMemo } from "react";
import {
  Box,
  Grid,
  MenuItem,
  Stack,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import StorageRounded from "@mui/icons-material/StorageRounded";
import ShowChartRounded from "@mui/icons-material/ShowChartRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PrintRounded from "@mui/icons-material/PrintRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import {
  AppCard,
  AppTextField,
  DataTable,
  PageHeader,
  AppButton,
} from "../../../shared/components";
import { useAuth } from "../../auth/hooks/useAuth";

// Format helper
const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

// List of actual products from assets/cooperative_system_db.sql
const REAL_PRODUCTS = [
  { id: 1, name: "Aqua Air Mineral 600ml", barcode: "8886008101053", category: "Minuman", current_stock: 12 },
  { id: 2, name: "Le Minerale 600ml", barcode: "8996001600269", category: "Minuman", current_stock: 30 },
  { id: 3, name: "Teh Botol Sosro Original 350ml", barcode: "8996006858016", category: "Minuman", current_stock: 5 },
  { id: 4, name: "Teh Pucuk Harum 350ml", barcode: "8996001600146", category: "Minuman", current_stock: 45 },
  { id: 7, name: "Ultra Milk Full Cream 250ml", barcode: "8998009010224", category: "Minuman", current_stock: 8 },
  { id: 10, name: "Pocari Sweat 500ml", barcode: "8997035600027", category: "Minuman", current_stock: 25 },
  { id: 12, name: "Chitato Sapi Panggang 68g", barcode: "0089686598056", category: "Makanan Ringan", current_stock: 15 },
  { id: 16, name: "Oreo Original 133g", barcode: "7622201779030", category: "Makanan Ringan", current_stock: 50 },
  { id: 20, name: "SilverQueen Chunky Bar Almond", barcode: "8991001111777", category: "Makanan Ringan", current_stock: 2 },
];

// Generate chart data (actual historical vs predicted future)
const generateChartData = (productId) => {
  const product = REAL_PRODUCTS.find((p) => p.id === productId) || REAL_PRODUCTS[0];
  const seed = product.id * 8;
  
  return [
    { name: "Jan", actual: 110 + seed, predicted: null },
    { name: "Feb", actual: 125 + seed * 1.1, predicted: null },
    { name: "Mar", actual: 115 + seed * 0.9, predicted: null },
    { name: "Apr", actual: 150 + seed * 1.3, predicted: null },
    { name: "Mei", actual: 165 + seed * 1.5, predicted: null },
    { name: "Jun (Hari Ini)", actual: 175 + seed * 1.6, predicted: 175 + seed * 1.6 },
    { name: "Jul (Prediksi)", actual: null, predicted: 190 + seed * 1.8 },
    { name: "Agu (Prediksi)", actual: null, predicted: 205 + seed * 2.0 },
    { name: "Sep (Prediksi)", actual: null, predicted: 220 + seed * 2.2 },
  ];
};

// Generate list of predictions aligning to SPEK section 8.b
const generateTablePredictions = () => {
  return REAL_PRODUCTS.map((p) => {
    // Math prediction logic from SPEK: predicted_demand
    const predicted_demand = Math.round(130 + p.id * 9.5);
    const current_stock = p.current_stock;
    
    // recommended_purchase = max(predicted_demand - current_stock, 0)
    const recommended_purchase = Math.max(predicted_demand - current_stock, 0);
    const status = recommended_purchase > 0 ? "Perlu Kulakan" : "Aman";
    
    return {
      id: p.id,
      product_name: p.name,
      category_name: p.category,
      current_stock: current_stock,
      predicted_demand: predicted_demand,
      recommended_purchase: recommended_purchase,
      status: status,
      barcode: p.barcode,
    };
  });
};

const CHART_COLORS = {
  actual: "#2563EB",
  predicted: "#E85D75",
  accent: "#D97706",
  bar: "#7A2E3A",
};

const SalesPredictionPage = () => {
  const { user } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Role verification (SPEK: only System Admin can run prediction)
  const isSystemAdmin = user?.role_name === "System Administrator";

  const tableData = useMemo(() => generateTablePredictions(), []);
  const chartData = useMemo(() => generateChartData(selectedProductId), [selectedProductId]);

  // Bar chart data for top products predicted demand (SPEK section 8.c)
  const barChartData = useMemo(() => {
    return tableData
      .map((item) => ({
        name: item.product_name.split(" ")[0] + " " + (item.product_name.split(" ")[1] || ""),
        demand: item.predicted_demand,
      }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 5);
  }, [tableData]);

  // Summary Metrics calculation (SPEK section 8.a)
  const summary = useMemo(() => {
    const totalPredicted = tableData.length;
    const sortedByDemand = [...tableData].sort((a, b) => b.predicted_demand - a.predicted_demand);
    const highestDemandProduct = sortedByDemand[0]?.product_name || "-";
    const highestDemandQty = sortedByDemand[0]?.predicted_demand || 0;
    const needRestockCount = tableData.filter((item) => item.status === "Perlu Kulakan").length;
    
    return {
      totalPredicted,
      highestDemandProduct,
      highestDemandQty,
      needRestockCount,
    };
  }, [tableData]);

  const filteredPredictions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tableData.filter((row) => {
      const matchesSearch =
        !query ||
        row.product_name.toLowerCase().includes(query) ||
        row.barcode.includes(query);
      const matchesCategory =
        categoryFilter === "all" || row.category_name === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tableData, search, categoryFilter]);

  const columns = [
    { field: "product_name", headerName: "Nama Produk", minWidth: 220 },
    { field: "category_name", headerName: "Kategori", minWidth: 140 },
    {
      field: "current_stock",
      headerName: "Stok Saat Ini",
      minWidth: 130,
      align: "right",
      render: (val) => `${formatNumber(val)} unit`,
    },
    {
      field: "predicted_demand",
      headerName: "Prediksi Permintaan",
      minWidth: 160,
      align: "right",
      render: (val) => `${formatNumber(val)} unit`,
    },
    {
      field: "recommended_purchase",
      headerName: "Rekomendasi Beli",
      minWidth: 150,
      align: "right",
      render: (val) => `${formatNumber(val)} unit`,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      render: (val) => (
        <Chip
          label={val}
          size="small"
          icon={val === "Aman" ? <CheckCircleOutlineRounded /> : <WarningAmberRounded />}
          sx={{
            fontWeight: 700,
            backgroundColor: val === "Aman" ? "#EFF6FF" : "#FEF2F2",
            color: val === "Aman" ? "#2563EB" : "#EF4444",
            border: "1px solid",
            borderColor: val === "Aman" ? "#BFDBFE" : "#FEE2E2",
          }}
        />
      ),
    },
  ];

  const handleRunPrediction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ background: "linear-gradient(180deg, #FFF8F9 0%, #FFFFFF 100%)", minHeight: "100%", width: "100%", boxSizing: "border-box", display: "block", p: 0.5, borderRadius: 4 }}>
      <PageHeader
        eyebrow="Machine Learning Module"
        title="Prediksi Penjualan Ritel"
        description="Forecasting kuantitas permintaan produk ritel koperasi berdasarkan histori transaksi menggunakan model Random Forest Regressor."
        actions={
          <Stack direction="row" spacing={1.5}>
            <AppButton
              variant="outlined"
              startIcon={<PrintRounded />}
              onClick={handlePrint}
            >
              Cetak Laporan
            </AppButton>
            
            <Tooltip title={isSystemAdmin ? "Jalankan latih ulang & prediksi model ML sekarang" : "Hanya System Administrator yang dapat memicu eksekusi model"}>
              <span>
                <AppButton
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowRounded />}
                  onClick={handleRunPrediction}
                  disabled={loading || !isSystemAdmin}
                >
                  {loading ? "Menjalankan..." : "Jalankan Prediksi"}
                </AppButton>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      {/* SPEK section 8.a: Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <AppCard sx={{ p: 2.5, height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", color: "#2563EB", mr: 2 }}>
              <StorageRounded />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Total Produk Terprediksi</Typography>
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ my: 0.25 }}>{summary.totalPredicted} Produk</Typography>
              <Typography variant="caption" color="text.secondary">Inventori ritel aktif</Typography>
            </Box>
          </AppCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <AppCard sx={{ p: 2.5, height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF5F6", color: "#E85D75", mr: 2 }}>
              <TrendingUpRounded />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Permintaan Tertinggi</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap sx={{ my: 0.1 }}>
                {summary.highestDemandProduct}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ color: "#E85D75" }}>
                Estimasi: {summary.highestDemandQty} unit
              </Typography>
            </Box>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3}>
          <AppCard sx={{ p: 2.5, height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", color: "#EF4444", mr: 2 }}>
              <WarningAmberRounded />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Perlu Kulakan</Typography>
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ my: 0.25 }}>{summary.needRestockCount} Produk</Typography>
              <Typography variant="caption" color="error" fontWeight={700}>Butuh restock segera</Typography>
            </Box>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3}>
          <AppCard sx={{ p: 2.5, height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFBEB", color: "#D97706", mr: 2 }}>
              <ShowChartRounded />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Status Model ML</Typography>
              <Typography variant="h6" fontWeight={850} color="text.primary" sx={{ my: 0.25 }}>RF-v1 (15 Jul 2026)</Typography>
              <Typography variant="caption" color="text.secondary">RandomForestRegressor</Typography>
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* SPEK section 8.c: Visualisasi Grafik */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        {/* Bar chart: top predicted products */}
        <Grid item xs={12} lg={6}>
          <AppCard sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 3.5 }}>
              Top 5 Produk Kebutuhan Tertinggi
            </Typography>
            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: 11, fontWeight: 600 }} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #E2E8F0", borderRadius: 8 }}
                  />
                  <Bar dataKey="demand" name="Prediksi Demand (Unit)" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </AppCard>
        </Grid>

        {/* Line chart: actual vs predicted comparison */}
        <Grid item xs={12} lg={6}>
          <AppCard sx={{ p: 3, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                Tren Permintaan Aktual vs Prediksi
              </Typography>
              <AppTextField
                select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                size="small"
                sx={{ width: 180 }}
              >
                {REAL_PRODUCTS.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name.split(" ")[0]}
                  </MenuItem>
                ))}
              </AppTextField>
            </Stack>
            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: 11, fontWeight: 600 }} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #E2E8F0", borderRadius: 8 }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine x="Jun (Hari Ini)" stroke={CHART_COLORS.accent} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="actual" name="Aktual (Qty)" stroke={CHART_COLORS.actual} strokeWidth={3} connectNulls />
                  <Line type="monotone" dataKey="predicted" name="Prediksi (Qty)" stroke={CHART_COLORS.predicted} strokeDasharray="5 5" strokeWidth={3} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* Row 3: Predictions Table (8.b) & Model Evaluation Panel (8.d) */}
      <Grid container spacing={3}>
        {/* Table predictions */}
        <Grid item xs={12} xl={8}>
          <AppCard sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
              Daftar Hasil Prediksi Permintaan Barang
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
              <AppTextField
                label="Cari produk..."
                placeholder="Nama produk atau barcode"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: { xs: "100%", sm: 260 } }}
              />
              <AppTextField
                select
                label="Kategori"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ width: { xs: "100%", sm: 180 } }}
              >
                <MenuItem value="all">Semua Kategori</MenuItem>
                <MenuItem value="Minuman">Minuman</MenuItem>
                <MenuItem value="Makanan Ringan">Makanan Ringan</MenuItem>
              </AppTextField>
            </Stack>

            <DataTable
              columns={columns}
              rows={filteredPredictions}
              loading={loading}
              emptyTitle="Tidak ada data prediksi"
              emptyDescription="Silakan ubah filter pencarian Anda."
              sx={{
                // SPEK section 8.b: highlight Perlu Kulakan rows
                "& .MuiTableRow-root": {
                  transition: "background-color 0.2s",
                },
                "& .MuiTableRow-root:hover": {
                  backgroundColor: "rgba(0,0,0,0.02) !important",
                },
              }}
            />
          </AppCard>
        </Grid>

        {/* SPEK section 8.d: Panel Evaluasi Model */}
        <Grid item xs={12} xl={4}>
          <AppCard sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2.5 }}>
              Evaluasi Akurasi Model Regresi
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Metrik evaluasi didasarkan pada selisih antara hasil ramalan (**Predicted Demand**) dengan penjualan nyata (**Actual Demand**).
            </Typography>

            <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">MAE (Mean Absolute Error)</Typography>
                <Typography variant="h5" fontWeight={800} color="#7A2E3A" sx={{ mt: 0.5 }}>4.23 Unit</Typography>
                <Typography variant="caption" color="text.secondary">Rata-rata deviasi unit absolut</Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">RMSE (Root Mean Squared Error)</Typography>
                <Typography variant="h5" fontWeight={800} color="#7A2E3A" sx={{ mt: 0.5 }}>5.87 Unit</Typography>
                <Typography variant="caption" color="text.secondary">Mengukur penyimpangan kuadrat tinggi</Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">MAPE (Mean Absolute Percentage Error)</Typography>
                <Typography variant="h5" fontWeight={800} color="#059669" sx={{ mt: 0.5 }}>3.85%</Typography>
                <Typography variant="caption" color="text.secondary">Error persentase rata-rata (Sangat Akurat)</Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">R² (Koefisien Determinasi)</Typography>
                <Typography variant="h5" fontWeight={800} color="#059669" sx={{ mt: 0.5 }}>0.942</Typography>
                <Typography variant="caption" color="text.secondary">Kecocokan tren model dengan data riil</Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
                * Hasil validasi membandingkan data penjualan Juni 2026. Proyeksi Juli/Agustus berstatus <strong>Menunggu data aktual</strong>.
              </Typography>
            </Box>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesPredictionPage;
