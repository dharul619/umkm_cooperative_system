import { useEffect, useMemo, useState } from "react";
import { Box, IconButton, MenuItem, Paper, Stack, Typography } from "@mui/material";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { AppButton, AppTextField } from "../../../../shared/components";

const createEmptyItem = () => ({ product_id: "", qty: 1, price: "" });

const PurchaseForm = ({
  suppliers = [],
  products = [],
  loading = false,
  submitError = "",
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    supplier_id: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    items: [createEmptyItem()],
  });

  useEffect(() => {
    setFormData({
      supplier_id: "",
      purchase_date: new Date().toISOString().slice(0, 10),
      items: [createEmptyItem()],
    });
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  );

  const totalAmount = useMemo(
    () =>
      formData.items.reduce(
        (sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0),
        0,
      ),
    [formData.items],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, productId) => {
    const product = productMap.get(Number(productId)) || null;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              product_id: productId,
              price: product?.cost_price ?? item.price,
            }
          : item,
      ),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () =>
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));

  const removeItem = (index) =>
    setFormData((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const supplierId = Number(formData.supplier_id);
    if (!supplierId) {
      throw new Error("Supplier wajib diisi");
    }

    const items = formData.items
      .map((item) => ({
        product_id: Number(item.product_id),
        qty: Number(item.qty),
        price: Number(item.price),
      }))
      .filter(
        (item) =>
          item.product_id > 0 &&
          item.qty > 0 &&
          Number.isFinite(item.price) &&
          item.price >= 0,
      );

    if (!items.length) {
      throw new Error("Isi minimal satu item pembelian yang valid");
    }

    await onSubmit({
      supplier_id: supplierId,
      purchase_date: formData.purchase_date,
      items,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
      {submitError ? (
        <Typography color="error" fontSize={14} fontWeight={700}>
          {submitError}
        </Typography>
      ) : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <AppTextField
          select
          required
          label="Supplier"
          name="supplier_id"
          value={formData.supplier_id}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          SelectProps={{
            displayEmpty: true,
            renderValue: (selected) =>
              suppliers.find((item) => item.id === Number(selected))?.name || "Pilih Supplier",
          }}
        >
          <MenuItem value="" disabled>
            Pilih Supplier
          </MenuItem>
          {suppliers.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </MenuItem>
          ))}
        </AppTextField>
        <AppTextField
          label="Tanggal Pembelian"
          name="purchase_date"
          type="date"
          value={formData.purchase_date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <Stack spacing={1.5}>
        {formData.items.map((item, index) => (
          <Paper key={index} elevation={0} sx={{ p: 2, border: "1px solid #F9D5DC", borderRadius: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr auto" }, gap: 1.5, alignItems: "start" }}>
              <AppTextField
                select
                label="Produk"
                value={item.product_id}
                onChange={(e) => handleProductChange(index, e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) =>
                    products.find((product) => product.id === Number(selected))?.name || "Pilih Produk",
                }}
              >
                <MenuItem value="" disabled>
                  Pilih Produk
                </MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </AppTextField>
              <AppTextField
                label="Qty"
                type="number"
                value={item.qty}
                onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                inputProps={{ min: 1 }}
              />
              <AppTextField
                label="Harga Beli"
                type="number"
                value={item.price}
                onChange={(e) => handleItemChange(index, "price", e.target.value)}
                inputProps={{ min: 0 }}
              />
              <IconButton color="error" onClick={() => removeItem(index)} sx={{ mt: { xs: 0, md: 1 } }}>
                <DeleteRounded />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <AppButton variant="outlined" startIcon={<AddRounded />} onClick={addItem}>
          Tambah Item
        </AppButton>
        <Typography fontWeight={800} color="#7A2E3A">Total: Rp {totalAmount.toLocaleString("id-ID")}</Typography>
        <AppButton type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </AppButton>
      </Box>
    </Box>
  );
};

export default PurchaseForm;
