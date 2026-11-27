import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import QrCodeScannerRounded from "@mui/icons-material/QrCodeScannerRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PauseCircleOutlineRounded from "@mui/icons-material/PauseCircleOutlineRounded";
import ShoppingCartCheckoutRounded from "@mui/icons-material/ShoppingCartCheckoutRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import LocalOfferRounded from "@mui/icons-material/LocalOfferRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import { salesService } from "../services/salesService";
import { computeCartSummary, formatDateTime, money } from "../utils/posFormatters";

const PosWorkspace = ({
  activeShift,
  products = [],
  heldCarts = [],
  cartItems = [],
  selectedMember = null,
  orderDiscount = { type: "NONE", value: 0 },
  notes = "",
  saving = false,
  searchInputRef: externalSearchRef,
  onAddProduct,
  onUpdateQty,
  onUpdateItemDiscount,
  onRemoveItem,
  onClearCart,
  onSelectMember,
  onChangeOrderDiscount,
  onChangeNotes,
  onOpenHeldCarts,
  onOpenCheckout,
  onGoToShiftTab,
}) => {
  const internalSearchRef = useRef(null);
  const searchInputRef = externalSearchRef || internalSearchRef;

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [memberOptions, setMemberOptions] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const cartSummary = useMemo(
    () => computeCartSummary(cartItems, orderDiscount),
    [cartItems, orderDiscount]
  );

  const productByBarcode = useMemo(
    () =>
      new Map(
        products
          .filter((p) => p.barcode)
          .map((p) => [String(p.barcode).trim(), p])
      ),
    [products]
  );

  const categories = useMemo(() => {
    const names = Array.from(
      new Set(products.map((p) => p.category_name).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ["ALL", ...names];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== "ALL" && p.category_name !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.barcode || "").toLowerCase().includes(q) ||
        String(p.brand_name || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, selectedCategory]);

  // Debounced search for Cooperative Members
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setMemberLoading(true);
        const rows = await salesService.searchMembers(memberInput.trim());
        if (active) setMemberOptions(rows);
      } catch {
        if (active) setMemberOptions([]);
      } finally {
        if (active) setMemberLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [memberInput]);

  // Keyboard shortcuts: F2 focus search, F4 checkout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4" && cartItems.length > 0 && !saving) {
        e.preventDefault();
        onOpenCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartItems.length, saving, onOpenCheckout, searchInputRef]);

  const handleScanOrSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const exact = productByBarcode.get(trimmed);
    if (exact) {
      if (Number(exact.stock || 0) <= 0) {
        setLocalError(`Stok "${exact.name}" sedang habis.`);
        return;
      }
      setLocalError("");
      onAddProduct(exact);
      setQuery("");
      return;
    }

    if (filteredProducts.length === 1) {
      const single = filteredProducts[0];
      if (Number(single.stock || 0) <= 0) {
        setLocalError(`Stok "${single.name}" sedang habis.`);
        return;
      }
      setLocalError("");
      onAddProduct(single);
      setQuery("");
      return;
    }

    setLocalError(`Barcode "${trimmed}" tidak ditemukan pada produk aktif.`);
  };

  const handleCardClick = (product) => {
    if (Number(product.stock || 0) <= 0) {
      setLocalError(`Stok "${product.name}" sedang habis.`);
      return;
    }
    const inCart = cartItems.find((c) => Number(c.product_id) === Number(product.id));
    if (inCart && inCart.qty >= Number(product.stock || 0)) {
      setLocalError(`Qty "${product.name}" sudah mencapai batas stok (${product.stock}).`);
      return;
    }
    setLocalError("");
    onAddProduct(product);
  };

  return (
    <Stack spacing={2}>
      {/* Top Shift & Quick Action Strip */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: "1px solid #F9D5DC",
          backgroundColor: "#FFF9FB",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            color="success"
            icon={<AccessTimeRounded />}
            label={`Shift Aktif: ${activeShift?.shift_code || "-"}`}
            sx={{ fontWeight: 800 }}
          />
          <Typography variant="caption" color="text.secondary">
            Dibuka: {formatDateTime(activeShift?.opened_at)} • Modal Awal:{" "}
            <strong>{money(activeShift?.opening_cash)}</strong>
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", lg: "block" } }}>
            Shortcut: <strong>F2</strong> Scan/Cari • <strong>F4</strong> Bayar
          </Typography>
          <Badge badgeContent={heldCarts.length} color="primary">
            <AppButton
              size="small"
              variant="outlined"
              startIcon={<PauseCircleOutlineRounded />}
              onClick={onOpenHeldCarts}
            >
              Hold / Antrean
            </AppButton>
          </Badge>
          <AppButton size="small" variant="outlined" onClick={onGoToShiftTab}>
            Kelola Shift
          </AppButton>
        </Stack>
      </Paper>

      {localError ? (
        <Alert severity="warning" onClose={() => setLocalError("")}>
          {localError}
        </Alert>
      ) : null}

      {/* 2-Column Main POS Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.35fr 1fr" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: Scan / Search & Product Catalog */}
        <Paper
          elevation={0}
          sx={{ p: 2, borderRadius: 2.5, border: "1px solid #F9D5DC", backgroundColor: "#FFFFFF" }}
        >
          <Stack spacing={1.5}>
            <AppTextField
              label="Scan Barcode / Cari Produk (F2)"
              placeholder="Scan barcode atau ketik nama produk..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (localError) setLocalError("");
              }}
              onKeyDown={handleScanOrSearchKeyDown}
              inputRef={searchInputRef}
              autoComplete="off"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScannerRounded sx={{ color: "#C93F58" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchRounded color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Category Chips */}
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  size="small"
                  label={cat === "ALL" ? `Semua (${products.length})` : cat}
                  clickable
                  color={selectedCategory === cat ? "primary" : "default"}
                  variant={selectedCategory === cat ? "filled" : "outlined"}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Box>

            {/* Product Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.25,
                maxHeight: { xs: 420, lg: 560 },
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              {filteredProducts.map((product) => {
                const stock = Number(product.stock || 0);
                const minStock = Number(product.min_stock || 0);
                const outOfStock = stock <= 0;
                const lowStock = stock > 0 && stock <= minStock;
                const cartItem = cartItems.find(
                  (item) => Number(item.product_id) === Number(product.id)
                );

                return (
                  <Paper
                    key={product.id}
                    elevation={0}
                    onClick={() => handleCardClick(product)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      opacity: outOfStock ? 0.55 : 1,
                      border: cartItem ? "2px solid #C93F58" : "1px solid #E2E8F0",
                      backgroundColor: cartItem ? "#FFF9FB" : "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 1,
                      transition: "all 0.15s",
                      "&:hover": outOfStock
                        ? {}
                        : {
                            borderColor: "#E85D75",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(201, 63, 88, 0.08)",
                          },
                    }}
                  >
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.75 }}>
                        <Typography variant="body2" fontWeight={800} color="#1E293B" sx={{ lineHeight: 1.25 }}>
                          {product.name}
                        </Typography>
                        {cartItem ? (
                          <Chip
                            size="small"
                            color="primary"
                            label={`x${cartItem.qty}`}
                            sx={{ height: 20, fontWeight: 800, fontSize: 11 }}
                          />
                        ) : null}
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {product.barcode || "-"} • {product.category_name || "Ritel"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={900} color="#7A2E3A">
                        {money(product.selling_price)}
                      </Typography>
                      <Chip
                        size="small"
                        label={outOfStock ? "Habis" : `Stok ${stock} ${product.unit || "pcs"}`}
                        color={outOfStock ? "error" : lowStock ? "warning" : "success"}
                        variant="outlined"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 700 }}
                      />
                    </Box>
                  </Paper>
                );
              })}

              {!filteredProducts.length ? (
                <Box sx={{ gridColumn: "1 / -1", py: 5, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    Tidak ada produk aktif yang cocok dengan pencarian.
                  </Typography>
                </Box>
              ) : null}
            </Box>
          </Stack>
        </Paper>

        {/* RIGHT COLUMN: Cart, Member, Discounts & Summary */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: "1px solid #F9D5DC",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Stack spacing={1.75}>
            {/* Buyer / Member Selector */}
            <Autocomplete
              size="small"
              options={memberOptions}
              loading={memberLoading}
              value={selectedMember}
              onChange={(_, newValue) => onSelectMember(newValue)}
              onInputChange={(_, value) => setMemberInput(value)}
              getOptionLabel={(opt) =>
                opt ? `${opt.name} (${opt.phone_number || opt.username || "-"})` : ""
              }
              isOptionEqualToValue={(opt, val) => Number(opt?.id) === Number(val?.id)}
              noOptionsText="Tidak ditemukan member approved"
              renderInput={(params) => (
                <AppTextField
                  {...params}
                  label="Pembeli (Default: Pembeli Umum)"
                  placeholder="Cari nama / no. HP anggota koperasi..."
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps?.input,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonOutlineRounded fontSize="small" sx={{ color: "#7A2E3A" }} />
                          </InputAdornment>
                          {params.slotProps?.input?.startAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />

            <Divider />

            {/* Cart Item List */}
            <Box sx={{ maxHeight: 310, overflowY: "auto", pr: 0.5 }}>
              {!cartSummary.items.length ? (
                <Box sx={{ py: 4, textAlign: "center", border: "1px dashed #F9D5DC", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Keranjang kosong
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.1}>
                  {cartSummary.items.map((item) => {
                    const maxStock = Number(item.stock || 0);
                    return (
                      <Paper
                        key={item.product_id}
                        elevation={0}
                        sx={{ p: 1.25, borderRadius: 2, border: "1px solid #F1F5F9", backgroundColor: "#FFFDFE" }}
                      >
                        <Stack spacing={1}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={800} noWrap>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {money(item.selling_price)} / {item.unit || "pcs"} • Stok: {maxStock}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onRemoveItem(item.product_id)}
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Qty Stepper */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => onUpdateQty(item.product_id, item.qty - 1)}
                                disabled={item.qty <= 1}
                                sx={{ border: "1px solid #E2E8F0", borderRadius: 1 }}
                              >
                                <RemoveRounded fontSize="small" />
                              </IconButton>
                              <AppTextField
                                type="number"
                                size="small"
                                value={item.qty}
                                onChange={(e) =>
                                  onUpdateQty(item.product_id, Math.round(Number(e.target.value || 1)))
                                }
                                slotProps={{ htmlInput: { min: 1, max: maxStock, style: { textAlign: "center", padding: "4px 6px" } } }}
                                sx={{ width: 60 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => onUpdateQty(item.product_id, item.qty + 1)}
                                disabled={item.qty >= maxStock}
                                sx={{ border: "1px solid #E2E8F0", borderRadius: 1 }}
                              >
                                <AddRounded fontSize="small" />
                              </IconButton>
                            </Box>

                            {/* Per-Item Discount */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <AppTextField
                                select
                                slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                                size="small"
                                value={item.discount_type || "NONE"}
                                onChange={(e) =>
                                  onUpdateItemDiscount(item.product_id, {
                                    discount_type: e.target.value,
                                    discount_value: e.target.value === "NONE" ? 0 : item.discount_value || 0,
                                  })
                                }
                                sx={{ width: 88 }}
                              >
                                <option value="NONE">Disc -</option>
                                <option value="AMOUNT">Rp</option>
                                <option value="PERCENT">%</option>
                              </AppTextField>
                              {item.discount_type && item.discount_type !== "NONE" ? (
                                <AppTextField
                                  type="number"
                                  size="small"
                                  value={item.discount_value || 0}
                                  onChange={(e) =>
                                    onUpdateItemDiscount(item.product_id, {
                                      discount_type: item.discount_type,
                                      discount_value: Math.max(0, Number(e.target.value || 0)),
                                    })
                                  }
                                  slotProps={{
                                    htmlInput: {
                                      min: 0,
                                      max: item.discount_type === "PERCENT" ? 100 : item.line_gross,
                                      style: { padding: "4px 6px" },
                                    },
                                  }}
                                  sx={{ width: 76 }}
                                />
                              ) : null}
                            </Box>

                            {/* Line Subtotal */}
                            <Box sx={{ textAlign: "right", ml: "auto" }}>
                              {item.discount_amount > 0 ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ textDecoration: "line-through", display: "block" }}
                                >
                                  {money(item.line_gross)}
                                </Typography>
                              ) : null}
                              <Typography variant="body2" fontWeight={900} color="#7A2E3A">
                                {money(item.line_subtotal)}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Order-level Discount & Notes */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <AppTextField
                select
                size="small"
                label="Diskon Transaksi"
                value={orderDiscount.type || "NONE"}
                onChange={(e) =>
                  onChangeOrderDiscount({
                    type: e.target.value,
                    value: e.target.value === "NONE" ? 0 : orderDiscount.value || 0,
                  })
                }
                slotProps={{
                  select: { native: true },
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalOfferRounded fontSize="small" sx={{ color: "#C93F58" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                <option value="NONE">Tanpa Diskon</option>
                <option value="AMOUNT">Nominal (Rp)</option>
                <option value="PERCENT">Persen (%)</option>
              </AppTextField>

              <AppTextField
                size="small"
                type="number"
                label={orderDiscount.type === "PERCENT" ? "Nilai Diskon (%)" : "Nilai Diskon (Rp)"}
                disabled={!orderDiscount.type || orderDiscount.type === "NONE"}
                value={orderDiscount.value || 0}
                onChange={(e) =>
                  onChangeOrderDiscount({
                    ...orderDiscount,
                    value: Math.max(0, Number(e.target.value || 0)),
                  })
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    max: orderDiscount.type === "PERCENT" ? 100 : undefined,
                  },
                }}
              />
            </Box>

            <AppTextField
              size="small"
              label="Catatan Transaksi (Opsional)"
              placeholder="Mis. Titip di meja kasir"
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
            />

            {/* Totals Breakdown */}
            <Paper
              elevation={0}
              sx={{
                p: 1.75,
                borderRadius: 2,
                backgroundColor: "#FFF8F9",
                border: "1px solid #F9D5DC",
              }}
            >
              <Stack spacing={0.6}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal ({cartSummary.totalQty} item)
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {money(cartSummary.subtotalAmount)}
                  </Typography>
                </Box>
                {cartSummary.totalDiscount > 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="error.main">
                      Total Diskon
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      -{money(cartSummary.totalDiscount)}
                    </Typography>
                  </Box>
                ) : null}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" fontWeight={850} color="#7A2E3A">
                    Grand Total
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="#7A2E3A">
                    {money(cartSummary.totalAmount)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Bottom Action Buttons */}
            <Box sx={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: 1 }}>
              <AppButton
                variant="outlined"
                color="error"
                disabled={!cartItems.length || saving}
                onClick={onClearCart}
              >
                Kosongkan
              </AppButton>
              <AppButton
                variant="outlined"
                startIcon={<PauseCircleOutlineRounded />}
                disabled={!cartItems.length || saving}
                onClick={onOpenHeldCarts}
              >
                Hold
              </AppButton>
              <AppButton
                size="large"
                startIcon={<ShoppingCartCheckoutRounded />}
                disabled={!cartItems.length || saving}
                onClick={onOpenCheckout}
              >
                {saving ? "Menyimpan..." : "Bayar (F4)"}
              </AppButton>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
};

export default PosWorkspace;
