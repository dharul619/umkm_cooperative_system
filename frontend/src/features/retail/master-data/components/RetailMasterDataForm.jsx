import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from "@mui/material";
import { AppButton, AppTextField } from "../../../../shared/components";

const initialStateByType = {
  category: { name: "" },
  subcategory: { name: "", category_id: "" },
  brand: { name: "" },
  product: {
    name: "",
    subcategory_id: "",
    barcode: "",
    unit: "pcs",
    brand_id: "",
    cost_price: "",
    selling_price: "",
    min_stock: 0,
    is_active: 1,
  },
  supplier: { name: "", phone: "", address: "", is_active: 1 },
};

const titleMap = {
  category: "Kategori",
  subcategory: "Subkategori",
  brand: "Brand",
  product: "Produk",
  supplier: "Supplier",
};

const RetailMasterDataForm = ({
  open,
  type,
  item,
  categories = [],
  subcategories = [],
  brands = [],
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(
    initialStateByType[type] || { name: "" },
  );

  useEffect(() => {
    const base = initialStateByType[type] || { name: "" };
    setFormData({
      ...base,
      ...Object.keys(base).reduce((acc, key) => {
        acc[key] = item?.[key] ?? base[key];
        return acc;
      }, {}),
    });
  }, [item, open, type]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = { ...formData };
    if (payload.name) payload.name = payload.name.trim();
    if (type === "subcategory")
      payload.category_id = Number(payload.category_id);
    if (type === "product") {
      payload.subcategory_id = Number(payload.subcategory_id);
      payload.brand_id = payload.brand_id ? Number(payload.brand_id) : null;
      payload.cost_price =
        payload.cost_price === "" ? null : Number(payload.cost_price);
      payload.selling_price =
        payload.selling_price === "" ? null : Number(payload.selling_price);
      payload.min_stock = Number(payload.min_stock || 0);
      payload.is_active = Number(payload.is_active ?? 1);
    }
    if (type === "supplier") {
      payload.phone = payload.phone?.trim?.() || "";
      payload.address = payload.address?.trim?.() || "";
      payload.is_active = Number(payload.is_active ?? 1);
    }

    await onSubmit(payload);
  };

  const title = titleMap[type] || "Master Data";
  const isSubcategory = type === "subcategory";
  const isProduct = type === "product";
  const isSupplier = type === "supplier";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>
        {item ? "Edit" : "Tambah"} {title}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="retail-master-data-form"
          onSubmit={handleSubmit}
          sx={{ display: "grid", gap: 2, mt: 0.5 }}
        >
          <AppTextField
            label={
              isSubcategory
                ? "Nama Subkategori"
                : isProduct
                  ? "Nama Produk"
                  : isSupplier
                    ? "Nama Supplier"
                    : "Nama Kategori"
            }
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          {type === "subcategory" && (
            <AppTextField
              select
              label="Kategori"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) =>
                  categories.find((item) => item.id === Number(selected))
                    ?.name || "Pilih Kategori",
              }}
            >
              <MenuItem value="" disabled>
                Pilih Kategori
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </AppTextField>
          )}

          {type === "product" && (
            <>
              <AppTextField
                select
                label="Subkategori"
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) =>
                    subcategories.find((item) => item.id === Number(selected))
                      ?.name || "Pilih Subkategori",
                }}
              >
                <MenuItem value="" disabled>
                  Pilih Subkategori
                </MenuItem>
                {subcategories.map((subcategory) => (
                  <MenuItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </MenuItem>
                ))}
              </AppTextField>
              <AppTextField
                label="Barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
              />
              <AppTextField
                label="Satuan"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              />
              <AppTextField
                select
                label="Brand"
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) =>
                    brands.find((item) => item.id === Number(selected))?.name ||
                    "Tanpa Brand",
                }}
              >
                <MenuItem value="">Tanpa Brand</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </AppTextField>
              <AppTextField
                label="Harga Modal"
                name="cost_price"
                type="number"
                value={formData.cost_price}
                onChange={handleChange}
              />
              <AppTextField
                label="Harga Jual"
                name="selling_price"
                type="number"
                value={formData.selling_price}
                onChange={handleChange}
              />
              <AppTextField
                label="Minimal Stok"
                name="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={handleChange}
              />
            </>
          )}

          {type === "supplier" && (
            <>
              <AppTextField
                label="Nomor Telepon"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              <AppTextField
                label="Alamat"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                minRows={3}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>
          Batal
        </AppButton>
        <AppButton
          type="submit"
          form="retail-master-data-form"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default RetailMasterDataForm;
