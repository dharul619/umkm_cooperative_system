import { useMemo, useState } from "react";
import TuneRounded from "@mui/icons-material/TuneRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  PageHeader,
  Pagination,
  StatusAlert,
} from "../../../../shared/components";
import { useRetailMasterData } from "../../master-data/hooks/useRetailMasterData";
import { useInventory } from "../hooks/useInventory";
import StockTable from "../components/StockTable";
import InventoryDetailDialog from "../components/InventoryDetailDialog";
import { getStockStatusMeta } from "../utils/stockStatus";

const PAGE_SIZE = 20;

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

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

const ROW_MODE_LABELS = {
  PRODUCT: "Produk",
  CATEGORY: "Kategori",
  SUBCATEGORY: "Subkategori",
  BRAND: "Brand",
};

const InventoryPage = () => {
  const { categories, subcategories, brands, products, loading: masterLoading } = useRetailMasterData();
  const {
    stocks,
    loading,
    saving,
    error,
    refresh,
    createAdjustment,
    getStockCard,
  } = useInventory();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailProductId, setDetailProductId] = useState(null);
  const [detailRefType, setDetailRefType] = useState("");

  const [rowMode, setRowMode] = useState("PRODUCT");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [stockState, setStockState] = useState("ALL");

  const [adjustmentForm, setAdjustmentForm] = useState({ product_id: "", type: "IN", qty: "", note: "" });

  const productRows = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const subcatMap = new Map(subcategories.map((s) => [s.id, s]));
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    return stocks.map((stock) => {
      const product = productMap.get(stock.id);
      const subId = stock.subcategory_id ?? product?.subcategory_id ?? null;
      const sub = subId ? subcatMap.get(subId) : null;
      const catId = stock.category_id ?? sub?.category_id ?? null;
      const cat = catId ? catMap.get(catId) : null;
      const brId = stock.brand_id ?? product?.brand_id ?? null;
      const brand = brId ? brandMap.get(brId) : null;

      const qty = Number(stock.stock || 0);
      const minStock = Number(stock.min_stock || 0);
      const costPrice = Number(stock.cost_price || 0);
      const statusMeta = getStockStatusMeta(qty, minStock);

      return {
        id: stock.id,
        name: stock.name,
        barcode: stock.barcode,
        unit: stock.unit || "pcs",
        is_active: stock.is_active ?? 1,
        category_id: catId,
        subcategory_id: subId,
        brand_id: brId,
        category_name: stock.category_name || cat?.name || "-",
        subcategory_name: stock.subcategory_name || sub?.name || "-",
        brand_name: stock.brand_name || brand?.name || "-",
        stock: qty,
        min_stock: minStock,
        cost_price: costPrice,
        stock_value: qty * costPrice,
        stock_status: statusMeta.key,
      };
    });
  }, [stocks, products, subcategories, categories, brands]);

  const filteredProductRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productRows.filter((item) => {
      const matchesQuery =
        !q ||
        [item.name, item.barcode, item.category_name, item.subcategory_name, item.brand_name]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q));
      const matchesState = stockState === "ALL" || item.stock_status === stockState;
      const matchesCategory = !categoryId || String(item.category_id ?? "") === String(categoryId);
      const matchesSubcategory = !subcategoryId || String(item.subcategory_id ?? "") === String(subcategoryId);
      const matchesBrand = !brandId || String(item.brand_id ?? "") === String(brandId);
      return matchesQuery && matchesState && matchesCategory && matchesSubcategory && matchesBrand;
    });
  }, [productRows, search, stockState, categoryId, subcategoryId, brandId]);

  const displayRows = useMemo(() => {
    if (rowMode === "PRODUCT") return filteredProductRows;

    const groups = new Map();
    for (const item of filteredProductRows) {
      const rawId =
        rowMode === "CATEGORY"
          ? item.category_id
          : rowMode === "SUBCATEGORY"
            ? item.subcategory_id
            : item.brand_id;
      const groupId =
        rowMode === "CATEGORY"
          ? `cat-${rawId ?? "none"}`
          : rowMode === "SUBCATEGORY"
            ? `sub-${rawId ?? "none"}`
            : `brand-${rawId ?? "none"}`;
      const label =
        rowMode === "CATEGORY"
          ? item.category_name === "-" ? "Tanpa Kategori" : item.category_name
          : rowMode === "SUBCATEGORY"
            ? item.subcategory_name === "-" ? "Tanpa Subkategori" : item.subcategory_name
            : item.brand_name === "-" ? "Tanpa Brand" : item.brand_name;

      const current = groups.get(groupId) || {
        id: groupId,
        group_raw_id: rawId ?? "none",
        label,
        product_count: 0,
        stock: 0,
        low_stock_count: 0,
        stock_value: 0,
      };

      current.product_count += 1;
      current.stock += Number(item.stock || 0);
      current.stock_value += Number(item.stock_value || 0);
      if (Number(item.stock || 0) <= Number(item.min_stock || 0)) {
        current.low_stock_count += 1;
      }
      groups.set(groupId, current);
    }

    return Array.from(groups.values()).sort((a, b) => b.stock_value - a.stock_value);
  }, [filteredProductRows, rowMode]);

  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => displayRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [displayRows, safePage],
  );

  const summary = useMemo(() => {
    const count = displayRows.length;
    const totalStock = filteredProductRows.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const totalValue = filteredProductRows.reduce((sum, item) => sum + Number(item.stock_value || 0), 0);
    const lowStockCount = filteredProductRows.filter(
      (item) => Number(item.stock || 0) <= Number(item.min_stock || 0),
    ).length;
    return { count, totalStock, totalValue, lowStockCount };
  }, [displayRows.length, filteredProductRows]);

  const subcategoryOptions = useMemo(
    () => subcategories.filter((item) => !categoryId || String(item.category_id) === String(categoryId)),
    [subcategories, categoryId],
  );

  const allProductOptions = useMemo(
    () => [...productRows].sort((a, b) => String(a.name).localeCompare(String(b.name), "id-ID")),
    [productRows],
  );

  const selectedAdjustProduct = useMemo(
    () => productRows.find((p) => String(p.id) === String(adjustmentForm.product_id)) || null,
    [productRows, adjustmentForm.product_id],
  );

  const adjustQtyNum = Number(adjustmentForm.qty || 0);
  const adjustPreviewStock = selectedAdjustProduct
    ? adjustmentForm.type === "IN"
      ? selectedAdjustProduct.stock + (Number.isFinite(adjustQtyNum) && adjustQtyNum > 0 ? adjustQtyNum : 0)
      : selectedAdjustProduct.stock - (Number.isFinite(adjustQtyNum) && adjustQtyNum > 0 ? adjustQtyNum : 0)
    : null;
  const adjustExceedsStock =
    Boolean(selectedAdjustProduct) &&
    adjustmentForm.type === "OUT" &&
    adjustQtyNum > selectedAdjustProduct.stock;

  const hasActiveFilter = Boolean(categoryId || subcategoryId || brandId || stockState !== "ALL" || search.trim());

  const handleResetFilters = () => {
    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setStockState("ALL");
    setSearch("");
    setPage(1);
  };

  const handleRowModeChange = (mode) => {
    setRowMode(mode);
    setPage(1);
  };

  const handleDrillDown = (groupRow) => {
    const rawId = groupRow?.group_raw_id;
    if (rawId && rawId !== "none") {
      if (rowMode === "CATEGORY") {
        setCategoryId(String(rawId));
        setSubcategoryId("");
      } else if (rowMode === "SUBCATEGORY") {
        const sub = subcategories.find((s) => String(s.id) === String(rawId));
        if (sub?.category_id) setCategoryId(String(sub.category_id));
        setSubcategoryId(String(rawId));
      } else if (rowMode === "BRAND") {
        setBrandId(String(rawId));
      }
    }
    setRowMode("PRODUCT");
    setPage(1);
  };

  const loadStockCard = async (productId, { nextPage = 1, refType = detailRefType } = {}) => {
    setDetailLoading(true);
    setFormError("");
    try {
      const response = await getStockCard(productId, {
        page: nextPage,
        limit: 20,
        ...(refType ? { reference_type: refType } : {}),
      });
      setDetailData(response);
    } catch (err) {
      setFormError(err.message || "Gagal memuat kartu stok");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetail = async (row) => {
    setDetailProductId(row.id);
    setDetailRefType("");
    setDetailOpen(true);
    await loadStockCard(row.id, { nextPage: 1, refType: "" });
  };

  const handleStockCardPageChange = async (newPage) => {
    if (!detailProductId) return;
    await loadStockCard(detailProductId, { nextPage: newPage, refType: detailRefType });
  };

  const handleReferenceTypeChange = async (nextRefType) => {
    setDetailRefType(nextRefType);
    if (!detailProductId) return;
    await loadStockCard(detailProductId, { nextPage: 1, refType: nextRefType });
  };

  const openAdjustmentModal = (productId = "") => {
    setFormError("");
    setSuccess("");
    setAdjustmentForm({ product_id: productId ? String(productId) : "", type: "IN", qty: "", note: "" });
    setAdjustmentOpen(true);
  };

  const handleQuickAdjust = (row) => {
    openAdjustmentModal(row.id);
  };

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const productId = Number(adjustmentForm.product_id);
    const qty = Number(adjustmentForm.qty);
    const note = adjustmentForm.note.trim();

    if (!productId) {
      setFormError("Pilih produk terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Qty adjustment harus bilangan bulat lebih dari 0.");
      return;
    }
    if (adjustExceedsStock) {
      setFormError("Qty pengurangan melebihi stok saat ini.");
      return;
    }
    if (!note) {
      setFormError("Alasan / catatan wajib diisi.");
      return;
    }

    try {
      const response = await createAdjustment({
        product_id: productId,
        type: adjustmentForm.type,
        qty,
        note,
      });
      setSuccess(response?.message || "Adjustment berhasil disimpan.");
      setAdjustmentForm({ product_id: "", type: "IN", qty: "", note: "" });
      setAdjustmentOpen(false);
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan adjustment.");
    }
  };

  const isModalOpen = adjustmentOpen;

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Stok & Mutasi"
        description="Pantau stok berjalan, kartu mutasi, dan penyesuaian."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton variant="contained" startIcon={<TuneRounded />} onClick={() => openAdjustmentModal()}>
              Adjustment
            </AppButton>
            <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh} disabled={loading}>
              Refresh
            </AppButton>
          </Stack>
        }
      />

      <StatusAlert
        severity="error"
        show={Boolean(error || (!isModalOpen && formError))}
        onClose={() => setFormError("")}
      >
        {(!isModalOpen && formError) || error}
      </StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>
        {success}
      </StatusAlert>

      <AppCard>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2.5, p: 2, background: "linear-gradient(135deg, #FFFFFF 0%, #FFF1F3 100%)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                {ROW_MODE_LABELS[rowMode]}
              </Typography>
              <Typography variant="h5" fontWeight={850} color="#7A2E3A" sx={{ mt: 0.25 }}>
                {formatNumber(summary.count)}
              </Typography>
            </Box>

            <Box sx={{ border: "1px solid #DBEAFE", borderRadius: 2.5, p: 2, background: "linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                Total Stok
              </Typography>
              <Typography variant="h5" fontWeight={850} color="#2563EB" sx={{ mt: 0.25 }}>
                {formatNumber(summary.totalStock)}
              </Typography>
            </Box>

            <Box
              title={formatCurrencyFull(summary.totalValue)}
              sx={{ border: "1px solid #D1FAE5", borderRadius: 2.5, p: 2, background: "linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)" }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                Nilai Aset
              </Typography>
              <Typography variant="h5" fontWeight={850} color="#059669" sx={{ mt: 0.25 }}>
                {formatCurrencyCompact(summary.totalValue)}
              </Typography>
            </Box>

            <Box
              sx={{
                border: `1px solid ${summary.lowStockCount > 0 ? "#FDE68A" : "#E5E7EB"}`,
                borderRadius: 2.5,
                p: 2,
                background: summary.lowStockCount > 0
                  ? "linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)"
                  : "#FAFAFA",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                Stok Rendah
              </Typography>
              <Typography variant="h5" fontWeight={850} color={summary.lowStockCount > 0 ? "#D97706" : "text.primary"} sx={{ mt: 0.25 }}>
                {formatNumber(summary.lowStockCount)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(ROW_MODE_LABELS).map(([modeKey, label]) => (
                  <Chip
                    key={modeKey}
                    clickable
                    label={label}
                    color={rowMode === modeKey ? "primary" : "default"}
                    onClick={() => handleRowModeChange(modeKey)}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
              </Stack>

              {hasActiveFilter && (
                <AppButton variant="text" size="small" startIcon={<RestartAltRounded />} onClick={handleResetFilters}>
                  Reset
                </AppButton>
              )}
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.25 }}>
              <AppTextField
                select
                label="Kategori"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                  setPage(1);
                }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">Semua Kategori</MenuItem>
                {categories.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
                ))}
              </AppTextField>

              <AppTextField
                select
                label="Subkategori"
                value={subcategoryId}
                onChange={(e) => {
                  setSubcategoryId(e.target.value);
                  setPage(1);
                }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">Semua Subkategori</MenuItem>
                {subcategoryOptions.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
                ))}
              </AppTextField>

              <AppTextField
                select
                label="Brand"
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setPage(1);
                }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">Semua Brand</MenuItem>
                {brands.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
                ))}
              </AppTextField>

              <AppTextField
                select
                label="Status Stok"
                value={stockState}
                onChange={(e) => {
                  setStockState(e.target.value);
                  setPage(1);
                }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="ALL">Semua Status</MenuItem>
                <MenuItem value="LOW">Habis / Kritis</MenuItem>
                <MenuItem value="WARNING">Menipis</MenuItem>
                <MenuItem value="SAFE">Aman</MenuItem>
              </AppTextField>
            </Box>

            <AppTextField
              label={rowMode === "PRODUCT" ? "Cari nama produk atau barcode" : "Filter nama produk"}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              sx={{ width: { xs: "100%", sm: 380 } }}
            />
          </Box>

          <StockTable
            rows={paginatedRows}
            loading={loading}
            onDetail={handleOpenDetail}
            onQuickAdjust={handleQuickAdjust}
            onDrillDown={handleDrillDown}
            rowMode={rowMode}
          />

          {displayRows.length > PAGE_SIZE && (
            <Pagination
              page={safePage}
              count={totalPages}
              total={displayRows.length}
              rowsPerPage={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </Box>
      </AppCard>

      {/* Dialog Adjustment Stok */}
      <Dialog open={adjustmentOpen} onClose={() => setAdjustmentOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleAdjustmentSubmit}>
          <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>
            Adjustment Stok
          </DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
            <StatusAlert severity="error" show={adjustmentOpen && !!formError} onClose={() => setFormError("")}>
              {formError}
            </StatusAlert>
            <AppTextField
              select
              label="Produk"
              value={adjustmentForm.product_id}
              onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, product_id: e.target.value }))}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>Pilih Produk</MenuItem>
              {allProductOptions.map((product) => (
                <MenuItem key={product.id} value={String(product.id)}>
                  {product.name} (Stok: {formatNumber(product.stock)} {product.unit})
                </MenuItem>
              ))}
            </AppTextField>

            {selectedAdjustProduct && (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${adjustExceedsStock ? "#FECACA" : "#E5E7EB"}`,
                  backgroundColor: adjustExceedsStock ? "#FEF2F2" : "#F8FAFC",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Stok saat ini: <strong>{formatNumber(selectedAdjustProduct.stock)} {selectedAdjustProduct.unit}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color={adjustExceedsStock ? "#DC2626" : "#059669"}
                >
                  Estimasi akhir: {formatNumber(adjustPreviewStock)} {selectedAdjustProduct.unit}
                </Typography>
              </Stack>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              <AppTextField
                select
                label="Tipe"
                value={adjustmentForm.type}
                onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="IN">Tambah (+)</MenuItem>
                <MenuItem value="OUT">Kurang (-)</MenuItem>
              </AppTextField>
              <AppTextField
                label="Qty"
                type="number"
                value={adjustmentForm.qty}
                onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, qty: e.target.value }))}
                inputProps={{ min: 1 }}
              />
            </Box>

            <AppTextField
              label="Alasan / Catatan"
              value={adjustmentForm.note}
              onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, note: e.target.value }))}
              multiline
              minRows={3}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <AppButton variant="outlined" onClick={() => setAdjustmentOpen(false)} disabled={saving}>
              Batal
            </AppButton>
            <AppButton type="submit" disabled={saving || masterLoading || adjustExceedsStock} startIcon={<TuneRounded />}>
              Simpan
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      <InventoryDetailDialog
        open={detailOpen}
        data={detailData}
        loading={detailLoading}
        referenceType={detailRefType}
        onReferenceTypeChange={handleReferenceTypeChange}
        onPageChange={handleStockCardPageChange}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
};

export default InventoryPage;
