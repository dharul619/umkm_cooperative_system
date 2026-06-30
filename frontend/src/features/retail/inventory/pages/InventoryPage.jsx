import { useMemo, useState } from "react";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import AddRounded from "@mui/icons-material/AddRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { Box, Chip, MenuItem, Tab, Tabs, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  PageHeader,
  SectionToolbar,
  StatusAlert,
} from "../../../../shared/components";
import { useRetailMasterData } from "../../master-data/hooks/useRetailMasterData";
import { useInventory } from "../hooks/useInventory";
import StockTable from "../components/StockTable";
import InventoryDetailDialog from "../components/InventoryDetailDialog";

const InventoryPage = () => {
  const { categories, subcategories, brands, products, loading: masterLoading } = useRetailMasterData();
  const {
    stocks,
    loading,
    saving,
    error,
    refresh,
    createBeginningStock,
    createAdjustment,
    getStockCard,
  } = useInventory();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [rowMode, setRowMode] = useState("PRODUCT");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [stockState, setStockState] = useState("ALL");
  const [beginningForm, setBeginningForm] = useState({ product_id: "", qty: "", note: "Stok awal" });
  const [adjustmentForm, setAdjustmentForm] = useState({ product_id: "", type: "IN", qty: "", note: "" });

  const enrichedRows = useMemo(() => {
    const map = new Map();
    const productLookup = new Map(products.map((product) => [product.id, product]));

    const getMeta = (productId) => {
      const product = productLookup.get(productId);
      const subcategory = subcategories.find((item) => item.id === product?.subcategory_id) || null;
      const category = categories.find((item) => item.id === subcategory?.category_id) || null;
      const brand = brands.find((item) => item.id === product?.brand_id) || null;
      return { product, subcategory, category, brand };
    };

    stocks.forEach((stock) => {
      const { product, subcategory, category, brand } = getMeta(stock.id);
      if (rowMode === "PRODUCT") {
        map.set(stock.id, {
          id: stock.id,
          name: stock.name,
          barcode: stock.barcode,
          category_name: category?.name || "-",
          subcategory_name: subcategory?.name || "-",
          brand_name: brand?.name || "-",
          stock: Number(stock.stock || 0),
          min_stock: Number(stock.min_stock || 0),
          cost_price: stock.cost_price,
          subtitle: stock.barcode || "-",
        });
        return;
      }

      const groupId =
        rowMode === "CATEGORY"
          ? `cat-${category?.id ?? "none"}`
          : rowMode === "SUBCATEGORY"
            ? `sub-${subcategory?.id ?? "none"}`
            : `brand-${brand?.id ?? "none"}`;
      const label =
        rowMode === "CATEGORY"
          ? category?.name || "Tanpa Kategori"
          : rowMode === "SUBCATEGORY"
            ? subcategory?.name || "Tanpa Subkategori"
            : brand?.name || "Tanpa Brand";

      const current = map.get(groupId) || {
        id: groupId,
        label,
        product_count: 0,
        stock: 0,
        subtitle: rowMode === "CATEGORY" ? "Kategori" : rowMode === "SUBCATEGORY" ? "Subkategori" : "Brand",
      };
      current.product_count += 1;
      current.stock += Number(stock.stock || 0);
      map.set(groupId, current);
    });

    return Array.from(map.values());
  }, [stocks, products, categories, subcategories, brands, rowMode]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedRows.filter((item) => {
      const matchesQuery =
        !q ||
        [item.name, item.label, item.barcode, item.category_name, item.subcategory_name, item.brand_name, item.subtitle]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      const matchesState =
        stockState === "ALL" ||
        (stockState === "LOW" && Number(item.stock || 0) <= Number(item.min_stock || 0)) ||
        (stockState === "SAFE" && Number(item.stock || 0) > Number(item.min_stock || 0));
      const matchesCategory = !categoryId || String(item.category_id || "") === String(categoryId);
      const matchesSubcategory = !subcategoryId || String(item.subcategory_id || "") === String(subcategoryId);
      const matchesBrand = !brandId || String(item.brand_id || "") === String(brandId);
      return matchesQuery && matchesState && matchesCategory && matchesSubcategory && matchesBrand;
    });
  }, [enrichedRows, search, stockState, categoryId, subcategoryId, brandId]);

  const summary = useMemo(() => {
    const totalProducts = filteredRows.length;
    const totalStock = filteredRows.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const lowStockCount = filteredRows.filter((item) => Number(item.stock || 0) <= Number(item.min_stock || 0)).length;
    return { totalProducts, totalStock, lowStockCount };
  }, [filteredRows]);

  const subcategoryOptions = useMemo(
    () => subcategories.filter((item) => !categoryId || String(item.category_id) === String(categoryId)),
    [subcategories, categoryId],
  );

  const productOptions = useMemo(
    () =>
      products.filter((product) => {
        const subcategory = subcategories.find((item) => item.id === product.subcategory_id) || null;
        const categoryMatch = !categoryId || String(subcategory?.category_id || "") === String(categoryId);
        const subcategoryMatch = !subcategoryId || String(product.subcategory_id) === String(subcategoryId);
        const brandMatch = !brandId || String(product.brand_id || "") === String(brandId);
        return categoryMatch && subcategoryMatch && brandMatch;
      }),
    [products, subcategories, categoryId, subcategoryId, brandId],
  );

  const handleOpenDetail = async (row) => {
    const response = await getStockCard(row.id);
    setDetailData(response);
    setDetailOpen(true);
  };

  const handleBeginningSubmit = async (event) => {
    event.preventDefault();
    const response = await createBeginningStock({
      product_id: Number(beginningForm.product_id),
      qty: Number(beginningForm.qty),
      note: beginningForm.note,
    });
    setSuccess(response?.message || "Stok awal berhasil disimpan");
    setBeginningForm({ product_id: "", qty: "", note: "Stok awal" });
    await refresh();
  };

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault();
    const response = await createAdjustment({
      product_id: Number(adjustmentForm.product_id),
      type: adjustmentForm.type,
      qty: Number(adjustmentForm.qty),
      note: adjustmentForm.note,
    });
    setSuccess(response?.message || "Adjustment berhasil disimpan");
    setAdjustmentForm({ product_id: "", type: "IN", qty: "", note: "" });
    await refresh();
  };

  const renderFilterBar = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip clickable label="Produk" color={rowMode === "PRODUCT" ? "primary" : "default"} onClick={() => setRowMode("PRODUCT")} />
        <Chip clickable label="Kategori" color={rowMode === "CATEGORY" ? "primary" : "default"} onClick={() => setRowMode("CATEGORY")} />
        <Chip clickable label="Subkategori" color={rowMode === "SUBCATEGORY" ? "primary" : "default"} onClick={() => setRowMode("SUBCATEGORY")} />
        <Chip clickable label="Brand" color={rowMode === "BRAND" ? "primary" : "default"} onClick={() => setRowMode("BRAND")} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.25 }}>
        <AppTextField select label="Kategori" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }} SelectProps={{ displayEmpty: true }}>
          <MenuItem value="">Semua Kategori</MenuItem>
          {categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </AppTextField>
        <AppTextField select label="Subkategori" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} SelectProps={{ displayEmpty: true }}>
          <MenuItem value="">Semua Subkategori</MenuItem>
          {subcategoryOptions.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </AppTextField>
        <AppTextField select label="Brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} SelectProps={{ displayEmpty: true }}>
          <MenuItem value="">Semua Brand</MenuItem>
          {brands.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </AppTextField>
        <AppTextField select label="Status Stok" value={stockState} onChange={(e) => setStockState(e.target.value)} SelectProps={{ displayEmpty: true }}>
          <MenuItem value="ALL">Semua Status</MenuItem>
          <MenuItem value="LOW">Low Stock</MenuItem>
          <MenuItem value="SAFE">Aman</MenuItem>
        </AppTextField>
      </Box>
      <AppTextField label={rowMode === "PRODUCT" ? "Cari produk / barcode" : "Cari baris agregat"} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: "100%", sm: 420 } }} />
    </Box>
  );

  const renderSummary = () => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
      <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, p: 2, backgroundColor: "#FFF9FB" }}>
        <Typography variant="body2" color="text.secondary">Baris Terlihat</Typography>
        <Typography variant="h5" fontWeight={900} color="#7A2E3A">{summary.totalProducts}</Typography>
      </Box>
      <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, p: 2, backgroundColor: "#FFF9FB" }}>
        <Typography variant="body2" color="text.secondary">Total Stok</Typography>
        <Typography variant="h5" fontWeight={900} color="#7A2E3A">{summary.totalStock}</Typography>
      </Box>
      <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, p: 2, backgroundColor: "#FFF9FB" }}>
        <Typography variant="body2" color="text.secondary">Low Stock</Typography>
        <Typography variant="h5" fontWeight={900} color="#7A2E3A">{summary.lowStockCount}</Typography>
      </Box>
    </Box>
  );

  const renderStockTab = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {renderFilterBar()}
      {renderSummary()}
      <SectionToolbar
        right={
          <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh}>
            Refresh
          </AppButton>
        }
      />
      <StockTable rows={filteredRows} loading={loading} onDetail={handleOpenDetail} rowMode={rowMode} />
    </Box>
  );

  const renderBeginningTab = () => (
    <Box component="form" onSubmit={handleBeginningSubmit} sx={{ display: "grid", gap: 2 }}>
      <AppTextField select label="Produk" value={beginningForm.product_id} onChange={(e) => setBeginningForm((prev) => ({ ...prev, product_id: e.target.value }))} SelectProps={{ displayEmpty: true }}>
        <MenuItem value="" disabled>Pilih Produk</MenuItem>
        {productOptions.map((product) => (
          <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>
        ))}
      </AppTextField>
      <AppTextField label="Qty Stok Awal" type="number" value={beginningForm.qty} onChange={(e) => setBeginningForm((prev) => ({ ...prev, qty: e.target.value }))} inputProps={{ min: 1 }} />
      <AppTextField label="Catatan" value={beginningForm.note} onChange={(e) => setBeginningForm((prev) => ({ ...prev, note: e.target.value }))} />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <AppButton type="submit" disabled={saving || masterLoading} startIcon={<AddRounded />}>Simpan Stok Awal</AppButton>
      </Box>
    </Box>
  );

  const renderAdjustmentTab = () => (
    <Box component="form" onSubmit={handleAdjustmentSubmit} sx={{ display: "grid", gap: 2 }}>
      <AppTextField select label="Produk" value={adjustmentForm.product_id} onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, product_id: e.target.value }))} SelectProps={{ displayEmpty: true }}>
        <MenuItem value="" disabled>Pilih Produk</MenuItem>
        {productOptions.map((product) => (
          <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>
        ))}
      </AppTextField>
      <AppTextField select label="Tipe" value={adjustmentForm.type} onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, type: e.target.value }))} SelectProps={{ displayEmpty: true }}>
        <MenuItem value="IN">Tambah</MenuItem>
        <MenuItem value="OUT">Kurang</MenuItem>
      </AppTextField>
      <AppTextField label="Qty" type="number" value={adjustmentForm.qty} onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, qty: e.target.value }))} inputProps={{ min: 1 }} />
      <AppTextField label="Alasan / Catatan" value={adjustmentForm.note} onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, note: e.target.value }))} multiline minRows={3} />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <AppButton type="submit" disabled={saving || masterLoading} startIcon={<TuneRounded />}>Simpan Adjustment</AppButton>
      </Box>
    </Box>
  );

  return (
    <>
      <PageHeader eyebrow="Inventory" title="Stok dan Mutasi" description="Kelola stok berjalan, stok awal, dan adjustment pada modul inventory." />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <AppCard contentSx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 3, pt: 1.5, borderBottom: "1px solid #F9D5DC" }}>
          <Tab icon={<Inventory2Rounded />} iconPosition="start" label="Stok" />
          <Tab icon={<AddRounded />} iconPosition="start" label="Stok Awal" />
          <Tab icon={<TuneRounded />} iconPosition="start" label="Adjustment" />
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 ? renderStockTab() : tab === 1 ? renderBeginningTab() : renderAdjustmentTab()}
        </Box>
      </AppCard>

      <InventoryDetailDialog open={detailOpen} data={detailData} onClose={() => setDetailOpen(false)} />
    </>
  );
};

export default InventoryPage;
