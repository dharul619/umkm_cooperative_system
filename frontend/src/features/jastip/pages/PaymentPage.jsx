import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ErrorRounded from "@mui/icons-material/ErrorRounded";
import PaymentRounded from "@mui/icons-material/PaymentRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { Box, Grid, MenuItem, Stack, Typography } from "@mui/material";
import { AppButton, AppCard, AppTextField, DataTable, PageHeader, StatusAlert } from "../../../shared/components";
import { useAuth } from "../../auth/hooks/useAuth";
import { jastipService } from "../services/jastipService";
import axiosInstance from "../../../services/axiosInstace";

const paymentMethodLabel = { CASH: "Tunai", QRIS: "QRIS" };
const stateLabel = { PENDING: "Menunggu Konfirmasi", PROCESSING: "Diproses", SETTLED: "Selesai", FAILED: "Gagal", EXPIRED: "Kedaluwarsa" };
const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateTime = (value) => (value ? String(value).replace("T", " ") : "-");
const OPERATION_FEE = 2000;

const buildMockQrRows = (reference) => {
  const seed = String(reference || "JASTIP-QRIS").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "QRIS";
  return Array.from({ length: 11 }, (_, rowIndex) => Array.from({ length: 11 }, (_, colIndex) => {
    const char = seed[(rowIndex + colIndex) % seed.length] || "0";
    const code = char.charCodeAt(0) + rowIndex * 11 + colIndex;
    return code % 3 === 0 ? 1 : 0;
  }));
};

const PaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [payment, setPayment] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stage, setStage] = useState("summary");

  const fetchPayment = async () => {
    try {
      setLoading(true);
      setError("");
      const [paymentData, orderData] = await Promise.all([axiosInstance.get("/payments/member"), jastipService.getMyOrders()]);
      const paymentList = Array.isArray(paymentData.data) ? paymentData.data : [];
      const orderList = Array.isArray(orderData) ? orderData : Array.isArray(orderData?.data) ? orderData.data : [];
      const matchingPayment = paymentList.find((item) => String(item.order_id) === String(orderId)) || null;
      const items = orderList.filter((item) => String(item.order_id) === String(orderId));
      setPayment(matchingPayment);
      setOrderItems(items);
      if (matchingPayment?.payment_method) setPaymentMethod(matchingPayment.payment_method);
      setStage(matchingPayment ? (matchingPayment.payment_method === "QRIS" ? "qris" : "status") : "summary");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal memuat payment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayment(); }, [orderId]);

  const subtotalAmount = useMemo(() => orderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0), [orderItems]);
  const totalAmount = subtotalAmount + OPERATION_FEE;

  const downloadReceipt = () => {
    const lines = [
      "BUKTI TRANSAKSI - KOPERASI 245",
      `Order ID: ${payment?.order_id || orderId}`,
      `Reference: ${payment?.external_reference || "-"}`,
      `Status: ${stateLabel[payment?.state] || payment?.state || "-"}`,
      `Metode: ${paymentMethodLabel[payment?.payment_method] || "-"}`,
      `Waktu: ${formatDateTime(payment?.paid_at || payment?.updated_at || payment?.created_at)}`,
      "",
      "Item:",
      ...orderItems.map((item) => `${item.menu_name} x${item.qty} = ${formatCurrency(item.subtotal)}`),
      "",
      `Subtotal: ${formatCurrency(subtotalAmount)}`,
      `Biaya operasional: ${formatCurrency(OPERATION_FEE)}`,
      `Total bayar: ${formatCurrency(totalAmount)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bukti-transaksi-${payment?.order_id || orderId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const goToProof = (paymentData, resultType) => {
    navigate(`/member/payments/${orderId}/proof`, {
      replace: true,
      state: {
        resultType,
        payment: { ...paymentData, amount: totalAmount },
        items: orderItems,
        orderId,
      },
    });
  };

  const resolveCurrentPayment = async () => {
    const response = await axiosInstance.get("/payments/member");
    const paymentList = Array.isArray(response.data) ? response.data : [];
    return paymentList.find((item) => String(item.order_id) === String(orderId)) || payment;
  };

  const handleCreatePayment = async () => {
    try {
      setSaving(true);
      setError("");
      const response = await axiosInstance.post("/payments/mock", {
        order_id: Number(orderId),
        payment_method: paymentMethod,
        amount: totalAmount,
      });
      const nextPayment = {
        id: response.data.id,
        order_id: Number(orderId),
        member_id: user?.id,
        amount: totalAmount,
        currency: "IDR",
        payment_method: response.data.payment_method,
        state: response.data.state,
        external_reference: response.data.external_reference,
        expires_at: response.data.expires_at,
      };
      setPayment(nextPayment);
      setSuccess("Payment berhasil dibuat.");
      setStage(paymentMethod === "QRIS" ? "qris" : "status");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal membuat payment");
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
    try {
      setSaving(true);
      setError("");
      const activePayment = await resolveCurrentPayment();
      if (!activePayment?.id) {
        setError("Payment belum siap, silakan muat ulang halaman.");
        return;
      }
      console.debug("payment settle start", { paymentId: activePayment.id, orderId, totalAmount });
      await axiosInstance.put(`/payments/${activePayment.id}/settle`);
      const settledPayment = { ...activePayment, state: "SETTLED", amount: totalAmount };
      setPayment(settledPayment);
      setSuccess("Payment settled, mengarahkan ke bukti transaksi.");
      goToProof(settledPayment, "success");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal settle payment");
    } finally {
      setSaving(false);
    }
  };

  const handleFail = async () => {
    try {
      setSaving(true);
      setError("");
      const activePayment = await resolveCurrentPayment();
      if (!activePayment?.id) {
        setError("Payment belum siap, silakan muat ulang halaman.");
        return;
      }
      console.debug("payment fail start", { paymentId: activePayment.id, orderId, totalAmount });
      await axiosInstance.put(`/payments/${activePayment.id}/fail`);
      const failedPayment = { ...activePayment, state: "FAILED", amount: totalAmount };
      setPayment(failedPayment);
      setSuccess("Payment failed, mengarahkan ke bukti transaksi.");
      goToProof(failedPayment, "failed");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal ubah status payment");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "qty", headerName: "Qty", minWidth: 90 },
    { field: "subtotal", headerName: "Subtotal", minWidth: 140, render: (value) => formatCurrency(value) },
  ];

  const qrisRows = buildMockQrRows(payment?.external_reference || `JASTIP-${orderId}`);

  return (
    <>
      <PageHeader eyebrow="Mock Payment" title={`Pembayaran Order #${orderId}`} description="Pilih metode pembayaran, lalu lanjutkan ke status tunai atau barcode QRIS mock." actions={<AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={fetchPayment}>Refresh</AppButton>} />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}><AppCard sx={{ height: "100%" }}><Stack spacing={1}><Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Status</Typography><Typography variant="h4" fontWeight={800} color="#7A2E3A">{stateLabel[payment?.state] || payment?.state || "-"}</Typography><Typography variant="body2" color="text.secondary">Reference: {payment?.external_reference || "-"}</Typography></Stack></AppCard></Grid>
        <Grid item xs={12} md={4}><AppCard sx={{ height: "100%" }}><Stack spacing={1}><Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Metode</Typography><Typography variant="h4" fontWeight={800} color="#7A2E3A">{paymentMethodLabel[payment?.payment_method] || paymentMethodLabel[paymentMethod]}</Typography><Typography variant="body2" color="text.secondary">Berlaku hingga {formatDateTime(payment?.expires_at)}</Typography></Stack></AppCard></Grid>
        <Grid item xs={12} md={4}><AppCard sx={{ height: "100%" }}><Stack spacing={1}><Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Total</Typography><Typography variant="h4" fontWeight={800} color="#7A2E3A">{formatCurrency(totalAmount)}</Typography><Typography variant="body2" color="text.secondary">{orderItems.length} item pesanan</Typography></Stack></AppCard></Grid>
      </Grid>

      <AppCard sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Ringkasan Pesanan</Typography>
        <DataTable columns={columns} rows={orderItems} loading={loading} emptyTitle="Order belum ditemukan" emptyDescription="Item order untuk payment ini belum ada." />
      </AppCard>

      {stage === "summary" && (
        <AppCard sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Pilih Metode Pembayaran</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><AppTextField select label="Metode" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} disabled={saving}>{Object.entries(paymentMethodLabel).map(([key, label]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}</AppTextField></Grid>
            <Grid item xs={12} md={8}><AppTextField label="Referensi" value={payment?.external_reference || "Akan dibuat otomatis"} disabled /></Grid>
          </Grid>
          <Box sx={{ mt: 2, p: 2, borderRadius: 1, border: "1px solid", borderColor: "divider", backgroundColor: "#FFFDFC" }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Rincian Tagihan</Typography>
            <Stack spacing={0.75}>
              <Typography variant="body2" color="text.secondary">Subtotal: {formatCurrency(subtotalAmount)}</Typography>
              <Typography variant="body2" color="text.secondary">Biaya operasional: {formatCurrency(OPERATION_FEE)}</Typography>
              <Typography variant="body1" fontWeight={800} color="#7A2E3A">Total: {formatCurrency(totalAmount)}</Typography>
            </Stack>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}>
            <AppButton startIcon={<PaymentRounded />} onClick={handleCreatePayment} disabled={saving || !orderItems.length}>Lanjutkan Pembayaran</AppButton>
            <AppButton variant="outlined" onClick={() => navigate('/member/jastip')}>Kembali</AppButton>
          </Box>
          <Box sx={{ mt: 2 }}><Typography variant="caption" color="text.secondary">Debug: subtotal={subtotalAmount} fee={OPERATION_FEE} total={totalAmount} paymentAmount={payment?.amount ?? "-"}</Typography></Box>
        </AppCard>
      )}

      {stage === "qris" && payment?.payment_method === "QRIS" && (
        <AppCard sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Scan QRIS</Typography>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={5}><Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, height: "100%", display: "grid", placeItems: "center", backgroundColor: "#fff" }}><Box sx={{ width: 240, maxWidth: "100%", aspectRatio: "1 / 1", border: "12px solid #111", borderRadius: 1, backgroundColor: "#fff", p: 1 }}><Box sx={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 0.35, width: "100%", height: "100%" }}>{qrisRows.flatMap((row, rowIndex) => row.map((cell, colIndex) => (<Box key={`${rowIndex}-${colIndex}`} sx={{ backgroundColor: cell ? "#111" : "#fff", borderRadius: 0.25 }} />)))}</Box></Box></Box></Grid>
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">Reference: {payment.external_reference}</Typography>
                <Typography variant="body2" color="text.secondary">Jumlah: {formatCurrency(payment.amount)}</Typography>
                <Typography variant="body2" color="text.secondary">Masa berlaku: {formatDateTime(payment.expires_at)}</Typography>
                <Typography variant="body2" color="text.secondary">Setelah dibayar, payment dapat diset ke settled untuk simulasi status berhasil.</Typography>
              </Stack>
              <Box sx={{ mt: 2, p: 2, borderRadius: 1, border: "1px solid", borderColor: "divider", backgroundColor: "#FFFDFC" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Rincian Tagihan</Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2" color="text.secondary">Subtotal: {formatCurrency(subtotalAmount)}</Typography>
                  <Typography variant="body2" color="text.secondary">Biaya operasional: {formatCurrency(OPERATION_FEE)}</Typography>
                  <Typography variant="body1" fontWeight={800} color="#7A2E3A">Total: {formatCurrency(totalAmount)}</Typography>
                </Stack>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}><AppButton startIcon={<CheckRounded />} onClick={handleSettle} disabled={saving}>Simulasikan Paid</AppButton><AppButton startIcon={<ErrorRounded />} variant="outlined" color="error" onClick={handleFail} disabled={saving}>Tandai Gagal</AppButton><AppButton variant="outlined" onClick={() => setStage("summary")}>Ubah Metode</AppButton></Box>
            </Grid>
          </Grid>
        </AppCard>
      )}

      {stage === "status" && payment?.payment_method === "CASH" && (
        <AppCard sx={{ mb: 2 }}><Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Pembayaran Tunai</Typography><Stack spacing={1.25}><Typography variant="body2" color="text.secondary">Member menyerahkan uang tunai sesuai total order.</Typography><Typography variant="body2" color="text.secondary">Coordinator melakukan verifikasi manual setelah uang diterima.</Typography><Typography variant="body2" color="text.secondary">Status saat ini: {stateLabel[payment.state] || payment.state}</Typography></Stack><Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}><AppButton variant="outlined" onClick={() => navigate('/member/jastip')}>Kembali ke Jastip</AppButton><AppButton variant="outlined" onClick={downloadReceipt}>Unduh Bukti</AppButton></Box></AppCard>
      )}

      {stage === "status" && payment?.payment_method === "QRIS" && (
        <AppCard sx={{ mb: 2 }}><Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Status QRIS</Typography><Stack spacing={1.25}><Typography variant="body2" color="text.secondary">QRIS siap dipindai. Status akan berubah saat simulator menandai pembayaran selesai.</Typography><Typography variant="body2" color="text.secondary">Reference: {payment.external_reference}</Typography><Typography variant="body2" color="text.secondary">Status saat ini: {stateLabel[payment.state] || payment.state}</Typography></Stack><Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}><AppButton variant="outlined" onClick={() => setStage("qris")}>Lihat Barcode</AppButton><AppButton variant="outlined" onClick={downloadReceipt}>Unduh Bukti</AppButton><AppButton variant="outlined" onClick={() => navigate('/member/jastip')}>Kembali ke Jastip</AppButton></Box></AppCard>
      )}
    </>
  );
};

export default PaymentPage;
