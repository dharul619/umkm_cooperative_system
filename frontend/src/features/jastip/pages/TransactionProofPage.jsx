import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import LocalAtmRounded from "@mui/icons-material/LocalAtmRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Stack, Typography } from "@mui/material";
import { AppButton, AppCard, DataTable } from "../../../shared/components";

const paymentMethodLabel = { CASH: "Tunai", QRIS: "QRIS" };
const stateLabel = { PENDING: "Menunggu Konfirmasi", PROCESSING: "Diproses", SETTLED: "Selesai", FAILED: "Gagal", EXPIRED: "Kedaluwarsa" };
const resultTone = {
  success: { title: "PEMBAYARAN BERHASIL", color: "#1B5E20", background: "#E8F5E9", icon: CheckCircleRounded, button: "Lihat Riwayat Order" },
  failed: { title: "PEMBAYARAN GAGAL", color: "#B71C1C", background: "#FFEBEE", icon: CancelRounded, button: "Kembali ke Jastip" },
};
const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateTime = (value) => (value ? String(value).replace("T", " ") : "-");

const TransactionProofPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const payment = state.payment || null;
  const items = Array.isArray(state.items) ? state.items : [];
  const resultType = state.resultType || (payment?.state === "SETTLED" ? "success" : "failed");
  const tone = resultTone[resultType] || resultTone.failed;
  const StatusIcon = tone.icon;
  const [popupOpen, setPopupOpen] = useState(true);

  const subtotalAmount = useMemo(() => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0), [items]);
  const totalAmount = subtotalAmount + 2000;
  const columns = [
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "qty", headerName: "Qty", minWidth: 90 },
    { field: "subtotal", headerName: "Subtotal", minWidth: 140, render: (value) => formatCurrency(value) },
  ];

  const handlePrimaryAction = () => {
    if (resultType === "success") {
      navigate("/member/orders");
      return;
    }
    navigate("/member/jastip");
  };

  const downloadReceipt = () => {
    const lines = [
      "BUKTI TRANSAKSI - KOPERASI 245",
      `Order ID: ${payment?.order_id || state.orderId || "-"}`,
      `Reference: ${payment?.external_reference || "-"}`,
      `Status: ${stateLabel[payment?.state] || payment?.state || "-"}`,
      `Metode: ${paymentMethodLabel[payment?.payment_method] || "-"}`,
      `Waktu: ${formatDateTime(payment?.paid_at || payment?.updated_at || payment?.created_at)}`,
      "",
      "Item:",
      ...items.map((item) => `${item.menu_name} x${item.qty} = ${formatCurrency(item.subtotal)}`),
      "",
      `Biaya operasional: ${formatCurrency(2000)}`,
      `Total bayar: ${formatCurrency(payment?.amount || totalAmount)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bukti-transaksi-${payment?.order_id || state.orderId || "order"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPopupOpen(true);
  }, [resultType]);

  return (
    <>
      <Dialog open={popupOpen} onClose={() => setPopupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: tone.color, fontWeight: 800 }}>
          <StatusIcon />
          {tone.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {resultType === "success" ? "Pembayaran sudah tercatat dan bukti transaksi sudah dibuat." : "Pembayaran gagal diproses. Silakan periksa metode pembayaran atau ulangi proses dari awal."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton onClick={() => setPopupOpen(false)}>Tutup</AppButton>
        </DialogActions>
      </Dialog>

      <Box sx={{ maxWidth: 860, mx: "auto", background: "linear-gradient(180deg, #f6f1eb 0%, #ffffff 16%)", borderRadius: 1, p: { xs: 2, md: 3 }, border: "1px solid #ded6cb", boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: tone.color, fontWeight: 800, letterSpacing: 0 }}>BUKTI TRANSAKSI</Typography>
            <Typography variant="h5" fontWeight={900} color="#2D2A26">Koperasi 245</Typography>
            <Typography variant="body2" color="text.secondary">{resultType === "success" ? "Transaksi sukses" : "Transaksi tidak berhasil"}</Typography>
          </Box>
          <Box sx={{ minWidth: 150, textAlign: "right", px: 2, py: 1, borderRadius: 1, backgroundColor: tone.background, color: tone.color, border: `1px solid ${tone.color}22` }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>{tone.title}</Typography>
            <Typography variant="h6" fontWeight={900}>{stateLabel[payment?.state] || payment?.state || "-"}</Typography>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 2 }} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.25}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><ReceiptLongRounded fontSize="small" /><Typography variant="subtitle2" fontWeight={800}>Informasi Transaksi</Typography></Box>
              <Typography variant="body2" color="text.secondary">Order ID: {payment?.order_id || state.orderId || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">Reference: {payment?.external_reference || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">Waktu: {formatDateTime(payment?.paid_at || payment?.updated_at || payment?.created_at)}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.25}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><StorefrontRounded fontSize="small" /><Typography variant="subtitle2" fontWeight={800}>Rincian Pembayaran</Typography></Box>
              <Typography variant="body2" color="text.secondary">Metode: {paymentMethodLabel[payment?.payment_method] || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">Status: {stateLabel[payment?.state] || payment?.state || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">Berlaku hingga: {formatDateTime(payment?.expires_at)}</Typography>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: "1px dashed #bdb4a8", borderBottom: "1px dashed #bdb4a8", py: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Detail Item</Typography>
          <DataTable columns={columns} rows={items} emptyTitle="Tidak ada item transaksi" emptyDescription="Data item tidak tersedia untuk bukti transaksi ini." />
        </Box>

        <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
          <Grid item xs={12} md={7}>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {payment?.payment_method === "QRIS" ? <QrCode2Rounded fontSize="small" /> : <LocalAtmRounded fontSize="small" />}
                <Typography variant="subtitle2" fontWeight={800}>Ringkasan Akhir</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">{resultType === "success" ? "Pembayaran berhasil diverifikasi dan transaksi tercatat pada sistem." : "Pembayaran gagal dan transaksi tidak diteruskan ke status selesai."}</Typography>
              <Typography variant="body2" color="text.secondary">Debug total subtotal: {subtotalAmount}</Typography>
              <Typography variant="body2" color="text.secondary">Debug total bayar: {totalAmount}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ p: 2, borderRadius: 1, backgroundColor: tone.background, border: `1px solid ${tone.color}22`, display: "grid", gap: 0.5, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: tone.color, fontWeight: 800 }}>TOTAL BAYAR</Typography>
              <Typography variant="h4" fontWeight={900} color={tone.color}>{formatCurrency(payment?.amount || totalAmount)}</Typography>
              <Typography variant="body2" color="text.secondary">Termasuk biaya operasional Rp 2.000</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderStyle: "dashed", my: 2 }} />

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "space-between" }}>
          <AppButton startIcon={<DownloadRounded />} variant="outlined" onClick={downloadReceipt}>Unduh Bukti</AppButton>
          <AppButton startIcon={<StatusIcon />} onClick={handlePrimaryAction}>{tone.button}</AppButton>
        </Box>
      </Box>
    </>
  );
};

export default TransactionProofPage;
