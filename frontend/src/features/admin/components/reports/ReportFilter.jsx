import { useState, useEffect } from "react";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import LayersRounded from "@mui/icons-material/LayersRounded";
import BusinessRounded from "@mui/icons-material/BusinessRounded";
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
  CircularProgress,
} from "@mui/material";
import AppButton from "../../../../shared/components/AppButton";
import AppTextField from "../../../../shared/components/AppTextField";
import axiosInstance from "../../../../services/axiosInstace";

const ReportFilter = ({
  onFilterChange,
  loading = false,
  hideCategory = false,
  showJastipFilters = false,
}) => {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    vendor_id: "",
    session_id: "",
  });

  // Fetch master data (Retail)
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Fetch jastip metadata (Jastip)
  const [vendors, setVendors] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (showJastipFilters) {
      fetchJastipMetadata();
    } else {
      fetchMasterData();
    }
  }, [showJastipFilters]);

  const fetchJastipMetadata = async () => {
    try {
      const res = await axiosInstance.get("/admin/reports/jastip-metadata");
      if (res.data.success) {
        setVendors(res.data.data.vendors || []);
        setSessions(res.data.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch jastip metadata:", err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [catRes, subRes, brandRes] = await Promise.all([
        axiosInstance.get("/categories"),
        axiosInstance.get("/subcategories"),
        axiosInstance.get("/brands"),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data || []);
      if (subRes.data.success) setSubcategories(subRes.data.data || []);
      if (brandRes.data.success) setBrands(brandRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch master data:", err);
    }
  };

  const handleChange = (name, value) => {
    const updated = { ...filters, [name]: value };

    // Clear dependent fields
    if (name === "category_id") {
      updated.subcategory_id = "";
    }

    setFilters(updated);
    onFilterChange?.(updated);
  };

  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter(
    (sub) => !filters.category_id || sub.category_id === Number(filters.category_id)
  );

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        p: 3,
        mb: 3,
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <FilterListRounded color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Filter Laporan
        </Typography>
        {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Stack>

      {/* Filter Fields */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="flex-start"
        sx={{ mb: 3 }}
      >
        {/* Date Range */}
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            Dari Tanggal
          </Typography>
          <AppTextField
            name="from"
            type="date"
            value={filters.from}
            onChange={(e) => handleChange("from", e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 160 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthRounded fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            Ke Tanggal
          </Typography>
          <AppTextField
            name="to"
            type="date"
            value={filters.to}
            onChange={(e) => handleChange("to", e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 160 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthRounded fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Category */}
        {!showJastipFilters && !hideCategory && categories.length > 0 && (
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Kategori
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filters.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Kategori</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Subcategory */}
        {!showJastipFilters && subcategories.length > 0 && (
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Sub Kategori
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }} disabled={!filters.category_id && filters.category_id !== ""}>
              <Select
                value={filters.subcategory_id}
                onChange={(e) => handleChange("subcategory_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Sub Kategori</MenuItem>
                {filteredSubcategories.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Brand */}
        {!showJastipFilters && brands.length > 0 && (
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Brand
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filters.brand_id}
                onChange={(e) => handleChange("brand_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Brand</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Vendor Filter */}
        {showJastipFilters && vendors.length > 0 && (
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Vendor
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filters.vendor_id}
                onChange={(e) => handleChange("vendor_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Vendor</MenuItem>
                {vendors.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Sesi Jastip Filter */}
        {showJastipFilters && sessions.length > 0 && (
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Sesi Jastip
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={filters.session_id}
                onChange={(e) => handleChange("session_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Sesi</MenuItem>
                {sessions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    Sesi #{s.id} ({new Date(s.order_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}) - {s.coordinator_name || "Koordinator"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default ReportFilter;
