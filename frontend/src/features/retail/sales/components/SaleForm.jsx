import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { AppButton, AppTextField } from "../../../../shared/components";

const createEmptyItem = () => ({
  barcode: "",
  qty: 1,
  product_name: "",
  selling_price: null,
  unit: "pcs",
});
const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateOnly = (value) =>
  new Date(value).toLocaleDateString("id-ID", { dateStyle: "full" });

const SaleForm = ({
  open,
  loading,
  products = [],
  submitError = "",
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().slice(0, 10),
    items: [createEmptyItem()],
  });
  const barcodeInputRefs = useRef([]);
  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          String(product.barcode || "").trim(),
          product,
        ]),
      ),
    [products],
  );

  useEffect(() => {
    if (open) {
      setFormData({
        sale_date: new Date().toISOString().slice(0, 10),
        items: [createEmptyItem()],
      });
      setTimeout(() => barcodeInputRefs.current[0]?.focus(), 0);
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resolveProduct = (barcode) =>
    productMap.get(String(barcode || "").trim()) || null;

  const mergeDuplicateBarcode = (items, index, barcode) => {
    const existingIndex = items.findIndex(
      (item, itemIndex) =>
        itemIndex !== index && String(item.barcode || "").trim() === barcode,
    );
    if (existingIndex < 0) return null;
    const mergedQty =
      Number(items[existingIndex].qty || 0) + Number(items[index].qty || 0);
    return items
      .map((item, itemIndex) =>
        itemIndex === existingIndex ? { ...item, qty: mergedQty } : item,
      )
      .filter((_, itemIndex) => itemIndex !== index);
  };

  const applyBarcode = (items, index, barcodeRaw) => {
    const barcode = String(barcodeRaw || "").trim();
    const nextItems = [...items];

    if (!barcode) {
      nextItems[index] = {
        ...nextItems[index],
        barcode: "",
        product_name: "",
        selling_price: null,
        unit: "pcs",
      };
      return nextItems;
    }

    const merged = mergeDuplicateBarcode(nextItems, index, barcode);
    if (merged) return merged.length ? merged : [createEmptyItem()];

    const product = resolveProduct(barcode);
    nextItems[index] = {
      ...nextItems[index],
      barcode,
      product_name: product?.name || "",
      selling_price: product?.selling_price ?? null,
      unit: product?.unit || "pcs",
    };
    return nextItems;
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      if (field === "barcode") {
        return { ...prev, items: applyBarcode(prev.items, index, value) };
      }
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  };

  const handleBarcodeCommit = (index) => {
    const barcode = String(formData.items[index]?.barcode || "").trim();
    const product = resolveProduct(barcode);
    if (!barcode || !product) return;

    setFormData((prev) => {
      const merged = mergeDuplicateBarcode(prev.items, index, barcode);
      if (merged)
        return { ...prev, items: merged.length ? merged : [createEmptyItem()] };
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        barcode,
        product_name: product.name || "",
        selling_price: product.selling_price ?? null,
        unit: product.unit || "pcs",
      };
      if (!nextItems[index + 1]) nextItems.push(createEmptyItem());
      return { ...prev, items: nextItems };
    });

    setTimeout(() => barcodeInputRefs.current[index + 1]?.focus(), 0);
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
    const items = formData.items
      .map((item) => ({
        barcode: String(item.barcode || "").trim(),
        qty: Number(item.qty),
      }))
      .filter((item) => item.barcode && item.qty > 0);
    if (!items.length)
      throw new Error("Isi minimal satu barcode penjualan yang valid");
    await onSubmit({ sale_date: formData.sale_date, items });
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>
        Tambah Penjualan
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="sale-form"
          onSubmit={handleSubmit}
          sx={{ display: "grid", gap: 2, mt: 0.5 }}
        >
          {submitError ? (
            <Alert severity="error" sx={{ borderRadius: 1.5 }}>
              {submitError}
            </Alert>
          ) : null}
          <AppTextField
            label="Tanggal Penjualan"
            value={formatDateOnly(formData.sale_date)}
            disabled
            InputLabelProps={{ shrink: true }}
          />
          {/* <AppTextField type="hidden" name="sale_date" value={formData.sale_date} onChange={handleChange} /> */}

          <Stack spacing={1.25}>
            {/* <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1.3fr 1.6fr 1fr 0.8fr auto" },
                gap: 1.25,
                px: 1.5,
                color: "text.secondary",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Box>Barcode</Box>
              <Box>Nama Produk</Box>
              <Box>Harga Produk</Box>
              <Box>Qty</Box>
              <Box />
            </Box> */}
            {formData.items.map((item, index) => {
              const matchedProduct = resolveProduct(item.barcode);
              return (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{ p: 1.5, border: "1px solid #F9D5DC", borderRadius: 2 }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "1.3fr 1.6fr 1fr 0.8fr auto",
                      },
                      gap: 1.25,
                      alignItems: "center",
                    }}
                  >
                    <AppTextField
                      label="Barcode"
                      value={item.barcode}
                      onChange={(e) =>
                        handleItemChange(index, "barcode", e.target.value)
                      }
                      onBlur={() => handleBarcodeCommit(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleBarcodeCommit(index);
                        }
                      }}
                      autoComplete="off"
                      inputRef={(el) => (barcodeInputRefs.current[index] = el)}
                    />
                    <AppTextField
                      label="Nama Produk"
                      value={matchedProduct?.name || ""}
                      disabled
                    />
                    <AppTextField
                      label="Harga Produk"
                      value={
                        matchedProduct
                          ? money(matchedProduct.selling_price)
                          : ""
                      }
                      disabled
                    />
                    <AppTextField
                      label="Qty"
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(index, "qty", e.target.value)
                      }
                      inputProps={{ min: 1 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeItem(index)}
                      sx={{ mt: { xs: 0, md: 1 } }}
                    >
                      <DeleteRounded />
                    </IconButton>
                  </Box>
                </Paper>
              );
            })}
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <AppButton
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={addItem}
            >
              Tambah Item
            </AppButton>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>
          Batal
        </AppButton>
        <AppButton type="submit" form="sale-form" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default SaleForm;
