import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import AssignmentReturnRounded from "@mui/icons-material/AssignmentReturnRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import { Alert, Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  PageHeader,
  StatusAlert,
} from "../../../../shared/components";
import { salesService } from "../services/salesService";
import { usePosShift } from "../hooks/usePosShift";
import { useSales } from "../hooks/useSales";
import OpenShiftPanel from "../components/OpenShiftPanel";
import PosWorkspace from "../components/PosWorkspace";
import CheckoutDialog from "../components/CheckoutDialog";
import HeldCartsDialog from "../components/HeldCartsDialog";
import SaleDetailDialog from "../components/SaleDetailDialog";
import VoidSaleDialog from "../components/VoidSaleDialog";
import ReturnSaleDialog from "../components/ReturnSaleDialog";
import ShiftManagementTab from "../components/ShiftManagementTab";
import {
  computeCartSummary,
  formatDateTime,
  money,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_META,
} from "../utils/posFormatters";

const SalesPage = () => {
  const {
    saving: salesSaving,
    error: salesError,
    createSale,
    lookupByInvoice,
    getSale,
    voidSale,
    createReturn,
  } = useSales();

  const {
    activeShift,
    loadingShift,
    savingShift,
    shiftError,
    refreshActiveShift,
    openShift,
    closeShift,
  } = usePosShift();

  const [tab, setTab] = useState(0);
  const [posProducts, setPosProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heldCarts, setHeldCarts] = useState([]);
  const [loadingHeld, setLoadingHeld] = useState(false);

  // Active POS Cart State
  const [cartItems, setCartItems] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [orderDiscount, setOrderDiscount] = useState({ type: "NONE", value: 0 });
  const [notes, setNotes] = useState("");
  const [activeHeldCartId, setActiveHeldCartId] = useState(null);

  // Dialogs & Feedback
  const [success, setSuccess] = useState("");
  const [localError, setLocalError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [heldDialogOpen, setHeldDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [returnTargetData, setReturnTargetData] = useState(null);

  // Exact Invoice Lookup ("Cari Struk")
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const searchInputRef = useRef(null);

  const loadPosProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const rows = await salesService.getPosProducts();
      setPosProducts(rows);
    } catch (err) {
      setLocalError(err?.message || "Gagal memuat produk POS");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadHeldCarts = useCallback(async () => {
    try {
      const rows = await salesService.getHeldCarts();
      setHeldCarts(rows);
    } catch {
      setHeldCarts([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosProducts();
      loadHeldCarts();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPosProducts, loadHeldCarts]);

  const cartSummary = useMemo(
    () => computeCartSummary(cartItems, orderDiscount),
    [cartItems, orderDiscount]
  );

  const resetCart = () => {
    setCartItems([]);
    setSelectedMember(null);
    setOrderDiscount({ type: "NONE", value: 0 });
    setNotes("");
    setActiveHeldCartId(null);
  };

  const handleAddProduct = (product) => {
    const stock = Number(product.stock || 0);
    setCartItems((prev) => {
      const existing = prev.find((item) => Number(item.product_id) === Number(product.id));
      if (existing) {
        if (existing.qty >= stock) return prev;
        return prev.map((item) =>
          Number(item.product_id) === Number(product.id)
            ? { ...item, qty: item.qty + 1, stock }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          barcode: product.barcode || "",
          name: product.name,
          unit: product.unit || "pcs",
          selling_price: Number(product.selling_price || 0),
          stock,
          qty: 1,
          discount_type: "NONE",
          discount_value: 0,
        },
      ];
    });
  };

  const handleUpdateQty = (productId, nextQty) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (Number(item.product_id) !== Number(productId)) return item;
        const maxStock = Number(item.stock || 0);
        const clamped = Math.max(1, Math.min(maxStock || 1, nextQty));
        return { ...item, qty: clamped };
      })
    );
  };

  const handleUpdateItemDiscount = (productId, patch) => {
    setCartItems((prev) =>
      prev.map((item) =>
        Number(item.product_id) === Number(productId) ? { ...item, ...patch } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => Number(item.product_id) !== Number(productId)));
  };

  const handleConfirmCheckout = async (payments) => {
    setLocalError("");
    const payload = {
      items: cartItems.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
        discount_type: item.discount_type || "NONE",
        discount_value: Number(item.discount_value || 0),
      })),
      member_id: selectedMember?.id || null,
      order_discount_type: orderDiscount.type || "NONE",
      order_discount_value: Number(orderDiscount.value || 0),
      payments,
      notes: notes.trim() || null,
      held_cart_id: activeHeldCartId || null,
    };

    const res = await createSale(payload);
    setCheckoutOpen(false);
    resetCart();
    setSuccess(res?.message || "Transaksi POS berhasil disimpan");

    if (res?.data?.sale) {
      setDetailData(res.data);
      setDetailOpen(true);
    }

    await Promise.all([loadPosProducts(), loadHeldCarts(), refreshActiveShift()]);
  };

  const handleCloseReceipt = () => {
    setDetailOpen(false);
    if (tab === 0) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const handleHoldCurrentCart = async ({ label, notes: holdNotes }) => {
    try {
      setLoadingHeld(true);
      await salesService.createHeldCart({
        label,
        member_id: selectedMember?.id || null,
        items: cartItems,
        discount: orderDiscount,
        notes: holdNotes || notes,
      });
      resetCart();
      await loadHeldCarts();
      setHeldDialogOpen(false);
      setSuccess("Keranjang berhasil ditahan (Hold).");
    } finally {
      setLoadingHeld(false);
    }
  };

  const handleResumeHeldCart = async (heldCart) => {
    try {
      setLoadingHeld(true);
      const productMap = new Map(posProducts.map((p) => [Number(p.id), p]));
      const hydrated = (heldCart.items || [])
        .map((item) => {
          const fresh = productMap.get(Number(item.product_id));
          if (!fresh || Number(fresh.stock || 0) <= 0) return null;
          return {
            ...item,
            selling_price: Number(fresh.selling_price || item.selling_price || 0),
            stock: Number(fresh.stock || 0),
            qty: Math.min(Number(fresh.stock || 1), Math.max(1, Number(item.qty || 1))),
          };
        })
        .filter(Boolean);

      setCartItems(hydrated);
      setOrderDiscount(heldCart.discount || { type: "NONE", value: 0 });
      setNotes(heldCart.notes || "");
      setSelectedMember(
        heldCart.member_id
          ? { id: heldCart.member_id, name: heldCart.member_name, phone_number: heldCart.member_phone }
          : null
      );
      setActiveHeldCartId(null);

      await salesService.deleteHeldCart(heldCart.id);
      await loadHeldCarts();
      setHeldDialogOpen(false);
      setTab(0);
    } finally {
      setLoadingHeld(false);
    }
  };

  const handleDeleteHeldCart = async (id) => {
    try {
      setLoadingHeld(true);
      await salesService.deleteHeldCart(id);
      await loadHeldCarts();
    } finally {
      setLoadingHeld(false);
    }
  };

  const handleOpenDetail = async (row) => {
    const response = await getSale(row.id);
    setDetailData(response);
    setDetailOpen(true);
  };

  const handleOpenVoidFromRow = (sale) => {
    setVoidTarget(sale);
  };

  const handleOpenReturnFromRow = async (row) => {
    const data = row?.sale ? row : await getSale(row.id);
    setReturnTargetData(data);
  };

  const handleConfirmVoid = async (payload) => {
    if (!voidTarget) return;
    const res = await voidSale(voidTarget.id, payload);
    setVoidTarget(null);
    setSuccess(res?.message || "Transaksi berhasil di-void");
    if (res?.data) {
      if (detailOpen && detailData?.sale?.id === voidTarget.id) {
        setDetailData(res.data);
      }
      if (lookupResult?.sale?.id === voidTarget.id) {
        setLookupResult(res.data);
      }
    }
    await Promise.all([loadPosProducts(), refreshActiveShift()]);
  };

  const handleConfirmReturn = async (payload) => {
    const targetSaleId = returnTargetData?.sale?.id;
    if (!targetSaleId) return;
    const res = await createReturn(targetSaleId, payload);
    setReturnTargetData(null);
    setSuccess(res?.message || "Retur penjualan berhasil diproses");
    if (res?.data) {
      if (detailOpen && detailData?.sale?.id === targetSaleId) {
        setDetailData(res.data);
      }
      if (lookupResult?.sale?.id === targetSaleId) {
        setLookupResult(res.data);
      }
    }
    await Promise.all([loadPosProducts(), refreshActiveShift()]);
  };

  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    const trimmed = invoiceQuery.trim();
    if (!trimmed) {
      setLookupError("Masukkan nomor invoice lengkap terlebih dahulu");
      setLookupResult(null);
      return;
    }
    try {
      setLookupLoading(true);
      setLookupError("");
      const data = await lookupByInvoice(trimmed);
      setLookupResult(data);
    } catch (err) {
      setLookupResult(null);
      setLookupError(err?.message || `Struk dengan nomor invoice "${trimmed}" tidak ditemukan`);
    } finally {
      setLookupLoading(false);
    }
  };

  const renderPosTab = () => {
    if (loadingShift) {
      return (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          Memeriksa status shift kasir...
        </Typography>
      );
    }

    if (!activeShift) {
      return <OpenShiftPanel onOpenShift={openShift} loading={savingShift} />;
    }

    return (
      <PosWorkspace
        activeShift={activeShift}
        products={posProducts}
        heldCarts={heldCarts}
        cartItems={cartItems}
        selectedMember={selectedMember}
        orderDiscount={orderDiscount}
        notes={notes}
        saving={salesSaving || loadingProducts}
        searchInputRef={searchInputRef}
        onAddProduct={handleAddProduct}
        onUpdateQty={handleUpdateQty}
        onUpdateItemDiscount={handleUpdateItemDiscount}
        onRemoveItem={handleRemoveItem}
        onClearCart={resetCart}
        onSelectMember={setSelectedMember}
        onChangeOrderDiscount={setOrderDiscount}
        onChangeNotes={setNotes}
        onOpenHeldCarts={() => setHeldDialogOpen(true)}
        onOpenCheckout={() => setCheckoutOpen(true)}
        onGoToShiftTab={() => setTab(2)}
      />
    );
  };

  const renderLookupTab = () => {
    const row = lookupResult?.sale;
    const statusMeta = row ? (SALE_STATUS_META[row.status || "COMPLETED"] || SALE_STATUS_META.COMPLETED) : null;
    const payLabel = row ? (PAYMENT_METHOD_LABELS[row.payment_method || "CASH"] || row.payment_method) : "";

    return (
      <Stack spacing={2}>
        <Paper
          component="form"
          onSubmit={handleLookupSubmit}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid #F9D5DC",
            display: "flex",
            gap: 1.25,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <AppTextField
            label="Nomor Invoice Struk"
            placeholder="Contoh: POS-20261127-0001"
            size="small"
            value={invoiceQuery}
            onChange={(e) => setInvoiceQuery(e.target.value)}
            sx={{ flex: "1 1 280px", maxWidth: 420 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <AppButton
            type="submit"
            variant="contained"
            startIcon={<SearchRounded />}
            disabled={lookupLoading}
          >
            {lookupLoading ? "Mencari..." : "Cari Struk"}
          </AppButton>
          {lookupResult || lookupError ? (
            <AppButton
              variant="outlined"
              onClick={() => {
                setInvoiceQuery("");
                setLookupResult(null);
                setLookupError("");
              }}
            >
              Reset
            </AppButton>
          ) : null}
        </Paper>

        {lookupError ? <Alert severity="warning">{lookupError}</Alert> : null}

        {row ? (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #F9D5DC",
              borderRadius: 2,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography fontWeight={850} color="#7A2E3A">
                  {row.invoice_number || `#${row.id}`}
                </Typography>
                <Chip size="small" color={statusMeta.color} label={statusMeta.label} sx={{ fontWeight: 700 }} />
                <Chip size="small" variant="outlined" label={payLabel} sx={{ fontWeight: 700 }} />
                {row.member_name ? (
                  <Chip size="small" variant="outlined" color="secondary" label={`Anggota: ${row.member_name}`} />
                ) : null}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {formatDateTime(row.created_at || row.sale_date)} • Kasir: {row.operator_name || "-"}
                {row.shift_code ? ` • ${row.shift_code}` : ""}
              </Typography>
              {Number(row.discount_amount || 0) > 0 ? (
                <Typography variant="caption" color="error.main" display="block">
                  Diskon: -{money(row.discount_amount)}
                </Typography>
              ) : null}
            </Box>

            <Box sx={{ textAlign: "right", ml: "auto" }}>
              <Typography fontWeight={900} variant="h6" color="#7A2E3A">
                {money(row.total_amount)}
              </Typography>
              {Number(row.returned_amount || 0) > 0 ? (
                <Typography variant="caption" color="warning.dark" display="block" fontWeight={700}>
                  Retur: -{money(row.returned_amount)}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={0.75} justifyContent="flex-end" sx={{ mt: 0.75 }}>
                <AppButton
                  size="small"
                  variant="outlined"
                  startIcon={<ReceiptLongRounded />}
                  onClick={() => handleOpenDetail(row)}
                >
                  Struk
                </AppButton>
                {row.status === "COMPLETED" || row.status === "PARTIAL_RETURN" ? (
                  <AppButton
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<AssignmentReturnRounded />}
                    onClick={() => handleOpenReturnFromRow(lookupResult)}
                  >
                    Retur
                  </AppButton>
                ) : null}
                {row.status === "COMPLETED" ? (
                  <AppButton
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<BlockRounded />}
                    onClick={() => handleOpenVoidFromRow(row)}
                  >
                    Void
                  </AppButton>
                ) : null}
              </Stack>
            </Box>
          </Paper>
        ) : !lookupError ? (
          <Typography color="text.secondary">
            Masukkan nomor invoice lengkap untuk melihat struk, memproses retur, atau void dengan otorisasi Admin.
          </Typography>
        ) : null}
      </Stack>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Ritel"
        title="Penjualan / POS"
      />
      <StatusAlert severity="error" show={!!(salesError || shiftError || localError)} onClose={() => setLocalError("")}>
        {localError || salesError || shiftError}
      </StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>
        {success}
      </StatusAlert>

      <AppCard contentSx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ px: 3, pt: 1.5, borderBottom: "1px solid #F9D5DC" }}
        >
          <Tab icon={<PointOfSaleRounded />} iconPosition="start" label="Kasir POS" />
          <Tab icon={<SearchRounded />} iconPosition="start" label="Cari Struk" />
          <Tab icon={<AccountBalanceWalletRounded />} iconPosition="start" label="Shift Kasir" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 ? renderPosTab() : null}
          {tab === 1 ? renderLookupTab() : null}
          {tab === 2 ? (
            <ShiftManagementTab
              activeShift={activeShift}
              heldCartsCount={heldCarts.length}
              savingShift={savingShift}
              onOpenShift={openShift}
              onCloseShift={closeShift}
              onOpenHeldCarts={() => setHeldDialogOpen(true)}
            />
          ) : null}
        </Box>
      </AppCard>

      <CheckoutDialog
        open={checkoutOpen}
        summary={cartSummary}
        member={selectedMember}
        loading={salesSaving}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmCheckout}
      />

      <HeldCartsDialog
        open={heldDialogOpen}
        heldCarts={heldCarts}
        hasCurrentItems={cartItems.length > 0}
        loading={loadingHeld}
        onClose={() => setHeldDialogOpen(false)}
        onHoldCurrent={handleHoldCurrentCart}
        onResumeCart={handleResumeHeldCart}
        onDeleteCart={handleDeleteHeldCart}
      />

      <SaleDetailDialog
        open={detailOpen}
        data={detailData}
        onClose={handleCloseReceipt}
        onRequestVoid={(sale) => setVoidTarget(sale)}
        onRequestReturn={(data) => setReturnTargetData(data)}
      />

      <VoidSaleDialog
        open={!!voidTarget}
        sale={voidTarget}
        loading={salesSaving}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleConfirmVoid}
      />

      <ReturnSaleDialog
        open={!!returnTargetData}
        sale={returnTargetData?.sale}
        details={returnTargetData?.details || []}
        loading={salesSaving}
        onClose={() => setReturnTargetData(null)}
        onConfirm={handleConfirmReturn}
      />
    </>
  );
};

export default SalesPage;
