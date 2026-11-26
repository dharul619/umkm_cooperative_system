import { useState, useEffect, useRef } from "react";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AppTextField from "../../../../shared/components/AppTextField";
import axiosInstance from "../../../../services/axiosInstace";

const PRESET_OPTIONS = [
  { key: "1M", label: "1 Bulan Terakhir" },
  { key: "3M", label: "3 Bulan Terakhir" },
  { key: "6M", label: "6 Bulan Terakhir" },
  { key: "1Y", label: "1 Tahun Terakhir" },
  { key: "ALL", label: "Semua" },
];

const parseYmd = (ymd) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatYmd = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const computePresetRange = (presetKey, anchorStr) => {
  const endDate = parseYmd(anchorStr);
  const startDate = new Date(endDate.getTime());

  if (presetKey === "1M") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (presetKey === "3M") {
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (presetKey === "6M") {
    startDate.setMonth(startDate.getMonth() - 6);
  } else if (presetKey === "1Y") {
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else if (presetKey === "ALL") {
    startDate.setFullYear(startDate.getFullYear() - 3);
  }

  return {
    from: formatYmd(startDate),
    to: formatYmd(endDate),
  };
};

const buildFilterLabels = (nextFilters, lists = {}) => {
  const {
    cats = [],
    subs = [],
    brs = [],
    sups = [],
    vends = [],
    sess = [],
  } = lists;

  const selectedSession = sess.find((s) => String(s.id) === String(nextFilters.session_id));

  return {
    category: cats.find((c) => String(c.id) === String(nextFilters.category_id))?.name || "",
    subcategory: subs.find((s) => String(s.id) === String(nextFilters.subcategory_id))?.name || "",
    brand: brs.find((b) => String(b.id) === String(nextFilters.brand_id))?.name || "",
    supplier: sups.find((s) => String(s.id) === String(nextFilters.supplier_id))?.name || "",
    vendor: vends.find((v) => String(v.id) === String(nextFilters.vendor_id))?.name || "",
    session: selectedSession
      ? `Sesi #${selectedSession.id} (${new Date(selectedSession.order_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })})`
      : "",
  };
};

const ReportFilter = ({
  onFilterChange,
  loading = false,
  hideDateRange = false,
  hideCategory = false,
  showSupplierFilter = false,
  showJastipFilters = false,
  isJastip = false,
}) => {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    supplier_id: "",
    vendor_id: "",
    session_id: "",
  });
  const [activePreset, setActivePreset] = useState("1M");
  const [anchorDate, setAnchorDate] = useState("");
  const initializedRef = useRef(false);
  const onFilterChangeRef = useRef(onFilterChange);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  // Master data (Retail)
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Metadata (Jastip)
  const [vendors, setVendors] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      let resolvedAnchor = formatYmd(new Date());
      let metaVendors = [];
      let metaSessions = [];
      let metaSuppliers = [];
      let metaCats = [];
      let metaSubs = [];
      let metaBrands = [];

      try {
        const requests = [axiosInstance.get("/admin/reports/jastip-metadata")];

        if (!showJastipFilters && !hideCategory) {
          requests.push(
            axiosInstance.get("/categories"),
            axiosInstance.get("/subcategories"),
            axiosInstance.get("/brands")
          );
        }

        const results = await Promise.all(requests);
        if (cancelled) return;

        const metaRes = results[0];
        if (metaRes?.data?.success) {
          const meta = metaRes.data.data || {};
          metaVendors = meta.vendors || [];
          metaSessions = meta.sessions || [];
          metaSuppliers = meta.suppliers || [];

          setVendors(metaVendors);
          setSessions(metaSessions);
          setSuppliers(metaSuppliers);

          const preferredAnchor =
            isJastip || showJastipFilters ? meta.jastipMaxDate : meta.retailMaxDate;
          if (preferredAnchor) {
            resolvedAnchor = preferredAnchor;
          }
        }

        if (!showJastipFilters && !hideCategory && results.length > 1) {
          const [, catRes, subRes, brandRes] = results;
          if (catRes?.data?.success) {
            metaCats = catRes.data.data || [];
            setCategories(metaCats);
          }
          if (subRes?.data?.success) {
            metaSubs = subRes.data.data || [];
            setSubcategories(metaSubs);
          }
          if (brandRes?.data?.success) {
            metaBrands = brandRes.data.data || [];
            setBrands(metaBrands);
          }
        }
      } catch (err) {
        console.error("Failed to fetch report filter metadata:", err);
      } finally {
        if (!cancelled) {
          setAnchorDate(resolvedAnchor);
          if (!hideDateRange && !initializedRef.current) {
            initializedRef.current = true;
            const initialRange = computePresetRange("1M", resolvedAnchor);
            const nextFilters = {
              from: initialRange.from,
              to: initialRange.to,
              category_id: "",
              subcategory_id: "",
              brand_id: "",
              supplier_id: "",
              vendor_id: "",
              session_id: "",
            };
            setFilters(nextFilters);
            setActivePreset("1M");
            onFilterChangeRef.current?.({
              ...nextFilters,
              filterLabels: buildFilterLabels(nextFilters, {
                cats: metaCats,
                subs: metaSubs,
                brs: metaBrands,
                sups: metaSuppliers,
                vends: metaVendors,
                sess: metaSessions,
              }),
            });
          }
        }
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [showJastipFilters, hideCategory, hideDateRange, isJastip]);

  const emitChange = (updated) => {
    setFilters(updated);
    onFilterChange?.({
      ...updated,
      filterLabels: buildFilterLabels(updated, {
        cats: categories,
        subs: subcategories,
        brs: brands,
        sups: suppliers,
        vends: vendors,
        sess: sessions,
      }),
    });
  };

  const handleChange = (name, value) => {
    const updated = { ...filters, [name]: value };

    if (name === "category_id") {
      updated.subcategory_id = "";
    }
    if (name === "from" || name === "to") {
      setActivePreset("CUSTOM");
    }

    emitChange(updated);
  };

  const handlePresetClick = (presetKey) => {
    const range = computePresetRange(presetKey, anchorDate || formatYmd(new Date()));
    setActivePreset(presetKey);
    emitChange({
      ...filters,
      from: range.from,
      to: range.to,
    });
  };

  const filteredSubcategories = subcategories.filter(
    (sub) => !filters.category_id || sub.category_id === Number(filters.category_id)
  );

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        p: 2.5,
        mb: 3,
      }}
    >
      {/* Header + Presets */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FilterListRounded color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            Filter Laporan
          </Typography>
          {loading && <CircularProgress size={18} sx={{ ml: 1 }} />}
        </Stack>

        {!hideDateRange && (
          <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75}>
            {PRESET_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                size="small"
                color={activePreset === opt.key ? "primary" : "default"}
                variant={activePreset === opt.key ? "filled" : "outlined"}
                onClick={() => handlePresetClick(opt.key)}
                sx={{ cursor: "pointer", fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {/* Filter Fields */}
      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        spacing={2}
        alignItems="flex-start"
      >
        {!hideDateRange && (
          <>
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
                sx={{ width: { xs: "100%", sm: 165 } }}
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
                sx={{ width: { xs: "100%", sm: 165 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthRounded fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </>
        )}

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
        {!showJastipFilters && !hideCategory && subcategories.length > 0 && (
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Sub Kategori
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }} disabled={!filters.category_id}>
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
        {!showJastipFilters && !hideCategory && brands.length > 0 && (
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

        {/* Supplier Filter */}
        {showSupplierFilter && suppliers.length > 0 && (
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Supplier
            </Typography>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={filters.supplier_id}
                onChange={(e) => handleChange("supplier_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Supplier</MenuItem>
                {suppliers.map((sup) => (
                  <MenuItem key={sup.id} value={sup.id}>
                    {sup.name}
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
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Sesi Jastip
            </Typography>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select
                value={filters.session_id}
                onChange={(e) => handleChange("session_id", e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Semua Sesi</MenuItem>
                {sessions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    Sesi #{s.id} ({new Date(s.order_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}) - {s.coordinator_name || "Koordinator"}
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
