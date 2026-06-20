import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { AppButton, AppTextField } from "../../../../shared/components";

const createEmptyItem = () => ({ barcode: "", product_id: "", qty: 1, price: "" });

const PurchaseForm = ({ open, loading, suppliers = [], products = [], onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ supplier_id: "", purchase_date: new Date().toISOString().slice(0, 10), items: [createEmptyItem()] });

  useEffect(() => {
    if (open) {
      setFormData({ supplier_id: "", purchase_date: new Date().toISOString().slice(0, 10), items: [createEmptyItem()] });
    }
  }, [open]);

  const productOptions = useMemo(
    () => products.map((product) => ({ ...product, label: `${product.name}${product.barcode ? ` | ${product.barcode}` : ""}` })),
    [products],
  );

  const productById = useMemo(() => new Map(products.map((product) => [Number(product.id), product])), [products]);
  const productByBarcode = useMemo(() => new Map(products.map((product) => [String(product.barcode || "").trim(), product])), [products]);

  const totalAmount = useMemo(() => formData.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0), [formData.items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyProduct = (item, product) => {
    if (!product) return { ...item, product_id: "", barcode: "", price: "" };
    return { ...item, product_id: String(product.id), barcode: product.barcode || "", price: product.selling_price ?? "" };
  };

  const handleBarcodeChange = (index, value) => {
    const barcode = String(value || "").trim();
    const product = productByBarcode.get(barcode) || null;
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = applyProduct({ ...nextItems[index], barcode }, product);
      return { ...prev, items: nextItems };
    });
  };

  const handleProductSelect = (index, product) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = applyProduct(nextItems[index], product);
      return { ...prev, items: nextItems };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };

      if (field === "product_id") {
        const product = productById.get(Number(value)) || null;
        nextItems[index] = applyProduct(nextItems[index], product);
      }

      if (field === "barcode") {
        const product = productByBarcode.get(String(value || "").trim()) || null;
        nextItems[index] = applyProduct(nextItems[index], product);
      }

      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  const removeItem = (index) => setFormData((prev) => ({ ...prev, items: prev.items.length === 1 ? prev.items : prev.items.filter((_, itemIndex) => itemIndex !== index) }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const items = formData.items
      .map((item) => ({ product_id: Number(item.product_id), qty: Number(item.qty), price: Number(item.price) }))
      .filter((item) => item.product_id > 0 && item.qty > 0 && Number.isFinite(item.price) && item.price >= 0);

    if (!items.length) {
      throw new Error("Isi minimal satu item pembelian yang valid");
    }

    await onSubmit({ supplier_id: Number(formData.supplier_id), purchase_date: formData.purchase_date, items });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>Tambah Pembelian</DialogTitle>
      <DialogContent>
        <Box component="form" id="purchase-form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2, mt: 0.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <AppTextField select required label="Supplier" name="supplier_id" value={formData.supplier_id} onChange={handleChange} InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true, renderValue: (selected) => suppliers.find((item) => item.id === Number(selected))?.name || "Pilih Supplier" }}>
              <MenuItem value="" disabled>Pilih Supplier</MenuItem>
              {suppliers.map((supplier) => <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>)}
            </AppTextField>
            <AppTextField label="Tanggal Pembelian" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.5fr 0.9fr 0.9fr auto" }, gap: 1.25, px: 1.5, color: "text.secondary", fontSize: 12, fontWeight: 700 }}>
              <Box>Barcode</Box>
              <Box>Produk</Box>
              <Box>Qty</Box>
              <Box>Harga Beli</Box>
              <Box />
            </Box>
            {formData.items.map((item, index) => {
              const selectedProduct = productById.get(Number(item.product_id)) || null;
              return (
                <Paper key={index} elevation={0} sx={{ p: 1.5, border: "1px solid #F9D5DC", borderRadius: 2 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.5fr 0.9fr 0.9fr auto" }, gap: 1.25, alignItems: "center" }}>
                    <AppTextField label="Barcode" value={item.barcode} onChange={(e) => handleBarcodeChange(index, e.target.value)} />
                    <Autocomplete
                      options={productOptions}
                      value={selectedProduct ? productOptions.find((option) => option.id === selectedProduct.id) || null : null}
                      onChange={(_, newValue) => handleProductSelect(index, newValue)}
                      getOptionLabel={(option) => option?.label || ""}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => <AppTextField {...params} label="Produk" />}
                    />
                    <AppTextField label="Qty" type="number" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} inputProps={{ min: 1 }} />
                    <AppTextField label="Harga Beli" type="number" value={item.price} onChange={(e) => handleItemChange(index, "price", e.target.value)} inputProps={{ min: 0 }} />
                    <IconButton color="error" onClick={() => removeItem(index)} sx={{ mt: { xs: 0, md: 1 } }}><DeleteRounded /></IconButton>
                  </Box>
                </Paper>
              );
            })}
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <AppButton variant="outlined" startIcon={<AddRounded />} onClick={addItem}>Tambah Item</AppButton>
            <Typography fontWeight={800} color="#7A2E3A">Total: Rp {totalAmount.toLocaleString("id-ID")}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>Batal</AppButton>
        <AppButton type="submit" form="purchase-form" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseForm;
