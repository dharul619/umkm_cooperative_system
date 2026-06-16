import { useMemo, useState } from "react";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import { Box, Grid, MenuItem, Stack, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  DataTable,
  PageHeader,
  StatusAlert,
  ConfirmModal,
} from "../../../shared/components";
import { useAuth } from "../../auth/hooks/useAuth";
import { useMemberJastip } from "../hooks/useMemberJastip";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T") ? stringValue.split("T")[0] : stringValue.split(" ")[0];
};

const MemberJastipPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const memberId = Number(user?.id);
  const {
    sessions,
    openSession,
    selectedSessionId,
    setSelectedSessionId,
    sessionMenus,
    myOrders,
    hasOrderedSessionIds,
    loading,
    menusLoading,
    saving,
    error,
    refresh,
    submitOrder,
  } = useMemberJastip(memberId);
  const [success, setSuccess] = useState("");
  const [orderItems, setOrderItems] = useState({});
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);

  const visibleMenus = useMemo(() => {
    return sessionMenus.map((item) => ({
      ...item,
      quantity: orderItems[item.menu_id] || 0,
    }));
  }, [orderItems, sessionMenus]);

  const selectedSession = useMemo(
    () => sessions.find((session) => String(session.id) === String(selectedSessionId)),
    [selectedSessionId, sessions],
  );

  const sessionAlreadyOrdered = hasOrderedSessionIds.has(String(selectedSessionId));
  const totalQty = Object.values(orderItems).reduce((sum, value) => sum + Number(value || 0), 0);
  const totalAmount = visibleMenus.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.jastip_price || 0),
    0,
  );

  const handleQtyChange = (menuId, value) => {
    const nextValue = Math.max(0, Number(value || 0));
    setOrderItems((current) => ({ ...current, [menuId]: nextValue }));
  };

  const handleSubmit = async () => {
    const items = Object.entries(orderItems)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([menuId, qty]) => ({ menu_id: Number(menuId), qty: Number(qty) }));

    if (!selectedSessionId || items.length === 0) return;
    if (sessionAlreadyOrdered || (selectedSession?.status || openSession?.status) !== "OPEN") {
      setBlockedModalOpen(true);
      return;
    }

    try {
      console.debug("member-jastip submitOrder payload", {
        selectedSessionId,
        items,
        selectedSession,
        openSession,
      });
      const result = await submitOrder(items);
      console.debug("member-jastip submitOrder response", result);
      setSuccess("Pesanan berhasil dikirim dan tersimpan untuk akun Anda.");
      setOrderItems({});
      navigate(`/member/payments/${result?.session_id || selectedSessionId}`, {
        state: {
          orderResponse: result,
          selectedSessionId,
          items,
        },
      });
    } catch (err) {
      console.debug("member-jastip submitOrder error", err);
      setSuccess("");
    }
  };

  const columns = [
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "jastip_price", headerName: "Harga", minWidth: 130, render: (value) => formatCurrency(value) },
    {
      field: "quantity",
      headerName: "Qty",
      minWidth: 120,
      render: (_, row) => (
        <AppTextField
          type="number"
          value={row.quantity || 0}
          onChange={(event) => handleQtyChange(row.menu_id, event.target.value)}
          inputProps={{ min: 0 }}
          sx={{ width: 100 }}
          disabled={sessionAlreadyOrdered}
        />
      ),
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      minWidth: 140,
      render: (_, row) => formatCurrency(Number(row.quantity || 0) * Number(row.jastip_price || 0)),
    },
  ];

  const canOrder = (selectedSession?.status || openSession?.status) === "OPEN";

  return (
    <>
      <PageHeader
        eyebrow="Cooperative Member"
        title="Pilih Menu Jastip"
        description="Pilih menu dari session yang dibuka coordinator, lalu lanjutkan ke pembayaran mock."
        actions={
          <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh}>
            Refresh
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Session Aktif</Typography>
              <Typography variant="h4" fontWeight={800} color="#7A2E3A">{openSession ? formatDateOnly(openSession.order_date) : "Belum ada"}</Typography>
              <Typography variant="body2" color="text.secondary">Session yang sedang dibuka coordinator.</Typography>
            </Stack>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Total Menu</Typography>
              <Typography variant="h4" fontWeight={800} color="#7A2E3A">{sessionMenus.length}</Typography>
              <Typography variant="body2" color="text.secondary">Menu yang tersedia untuk session terpilih.</Typography>
            </Stack>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Status Order</Typography>
              <Typography variant="h4" fontWeight={800} color="#7A2E3A">{sessionAlreadyOrdered ? "LOCKED" : canOrder ? "OPEN" : "LOCKED"}</Typography>
              <Typography variant="body2" color="text.secondary">{sessionAlreadyOrdered ? "Anda sudah pernah order pada session ini." : "Order hanya bisa dikirim saat session masih open."}</Typography>
            </Stack>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A">Session dan Menu</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <AppTextField
                select
                label="Pilih Session"
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                disabled={!sessions.length}
              >
                <MenuItem value="" disabled>
                  Pilih session
                </MenuItem>
                {sessions.filter((session) => session.status === "OPEN").map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {formatDateOnly(session.order_date)} - {session.status}
                  </MenuItem>
                ))}
              </AppTextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <AppTextField value={user?.name || user?.username || "-"} label="Akun Aktif" disabled />
            </Grid>
          </Grid>

          <DataTable
            columns={columns}
            rows={visibleMenus}
            loading={loading || menusLoading}
            emptyTitle="Belum ada menu di session ini"
            emptyDescription="Session yang dipilih belum memiliki menu aktif."
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total item: {totalQty}</Typography>
              <Typography variant="body2" color="text.secondary">Total nominal: {formatCurrency(totalAmount)}</Typography>
              {sessionAlreadyOrdered && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LockRounded fontSize="small" />
                  Session ini sudah pernah Anda pesan.
                </Typography>
              )}
              {!sessionAlreadyOrdered && !canOrder && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  Session sudah confirmed, order baru tidak bisa dikirim.
                </Typography>
              )}
            </Box>
            <AppButton
              startIcon={<CreditCardRounded />}
              onClick={handleSubmit}
              disabled={!selectedSessionId || totalQty === 0 || saving || !canOrder || sessionAlreadyOrdered}
            >
              Ke Pembayaran
            </AppButton>
          </Box>
        </Box>
      </AppCard>

      <ConfirmModal
        open={blockedModalOpen}
        title={sessionAlreadyOrdered ? "Sudah pernah order" : "Session sudah dikunci"}
        description={sessionAlreadyOrdered ? "Member sudah memiliki order pada session ini, jadi tidak bisa memesan lagi di session yang sama." : "Session ini sudah confirmed atau lewat dari status OPEN, sehingga member tidak bisa menambah pesanan baru."}
        confirmText="Tutup"
        onConfirm={() => setBlockedModalOpen(false)}
        onClose={() => setBlockedModalOpen(false)}
      />
    </>
  );
};

export default MemberJastipPage;
