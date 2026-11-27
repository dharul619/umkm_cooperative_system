import { useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import BlockRounded from "@mui/icons-material/BlockRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import { money } from "../utils/posFormatters";

const VoidSaleDialogContent = ({ sale, loading = false, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    const trimmedAdmin = adminUsername.trim();

    if (trimmedReason.length < 3) {
      setErrorMsg("Alasan pembatalan (void) wajib diisi minimal 3 karakter");
      return;
    }
    if (!trimmedAdmin || !adminPassword) {
      setErrorMsg("Otorisasi System Administrator (username dan password) wajib diisi");
      return;
    }

    try {
      setErrorMsg("");
      await onConfirm({
        reason: trimmedReason,
        admin_username: trimmedAdmin,
        admin_password: adminPassword,
      });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal membatalkan transaksi");
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BlockRounded color="error" />
          <Typography variant="h6" fontWeight={850} color="error.main">
            Void / Batalkan Transaksi
          </Typography>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}
            <Alert severity="warning">
              Batalkan transaksi <strong>{sale?.invoice_number || `#${sale?.id}`}</strong> (
              <strong>{money(sale?.total_amount)}</strong>)? Stok akan dikembalikan ke gudang.
            </Alert>
            <AppTextField
              label="Alasan Pembatalan (Wajib)"
              placeholder="Mis. Salah input produk / pembeli batal membeli"
              multiline
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              autoFocus
            />

            <Divider />

            <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A">
              Otorisasi System Administrator
            </Typography>
            <AppTextField
              label="Username Admin"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              autoComplete="off"
              required
              size="small"
            />
            <AppTextField
              label="Password Admin"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="new-password"
              required
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton variant="outlined" onClick={onClose} disabled={loading}>
            Batal
          </AppButton>
          <AppButton type="submit" color="error" disabled={loading}>
            {loading ? "Memproses..." : "Konfirmasi Void"}
          </AppButton>
        </DialogActions>
      </Box>
    </>
  );
};

const VoidSaleDialog = ({ open, loading = false, onClose, ...props }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
    {open ? <VoidSaleDialogContent loading={loading} onClose={onClose} {...props} /> : null}
  </Dialog>
);

export default VoidSaleDialog;
