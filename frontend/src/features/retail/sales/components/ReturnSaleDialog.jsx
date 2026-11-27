import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AssignmentReturnRounded from "@mui/icons-material/AssignmentReturnRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import { money } from "../utils/posFormatters";

const buildInitialReturnRows = (details = []) =>
  details.map((d) => ({
    sale_detail_id: d.id,
    product_name: d.product_name,
    bought_qty: Number(d.qty || 0),
    returned_qty: Number(d.returned_qty || 0),
    remaining_qty: Math.max(0, Number(d.qty || 0) - Number(d.returned_qty || 0)),
    subtotal: Number(d.subtotal || 0),
    return_qty: 0,
    restock: true,
  }));

const ReturnSaleDialogContent = ({
  sale,
  details = [],
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [rows, setRows] = useState(() => buildInitialReturnRows(details));
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [reason, setReason] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const netRatio = useMemo(() => {
    const afterItemTotal = details.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
    if (afterItemTotal <= 0) return 1;
    return Number(sale?.total_amount || 0) / afterItemTotal;
  }, [details, sale]);

  const estimatedRefund = useMemo(() => {
    const active = rows.filter((r) => r.return_qty > 0);
    if (!active.length) return 0;
    const allRemainingReturned = rows.every((r) => r.return_qty >= r.remaining_qty);
    const maxRemaining = Math.max(
      0,
      Number(sale?.total_amount || 0) - Number(sale?.returned_amount || 0)
    );
    if (allRemainingReturned) return maxRemaining;

    const sum = active.reduce((acc, r) => {
      const perUnit = r.bought_qty > 0 ? r.subtotal / r.bought_qty : 0;
      return acc + Math.round(perUnit * r.return_qty * netRatio);
    }, 0);
    return Math.min(sum, maxRemaining);
  }, [rows, netRatio, sale]);

  const updateRow = (detailId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.sale_detail_id === detailId ? { ...r, ...patch } : r))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const selectedItems = rows
      .filter((r) => Number(r.return_qty) > 0)
      .map((r) => ({
        sale_detail_id: r.sale_detail_id,
        qty: Math.round(Number(r.return_qty)),
        restock: r.restock,
      }));

    if (!selectedItems.length) {
      setErrorMsg("Pilih minimal satu item dengan jumlah retur > 0");
      return;
    }
    if (reason.trim().length < 3) {
      setErrorMsg("Alasan retur wajib diisi minimal 3 karakter");
      return;
    }
    if (!adminUsername.trim() || !adminPassword) {
      setErrorMsg("Otorisasi System Administrator (username dan password) wajib diisi");
      return;
    }

    try {
      await onConfirm({
        items: selectedItems,
        refund_method: refundMethod,
        reason: reason.trim(),
        admin_username: adminUsername.trim(),
        admin_password: adminPassword,
      });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal memproses retur");
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AssignmentReturnRounded color="warning" />
          <Box>
            <Typography variant="h6" fontWeight={850} color="#7A2E3A">
              Retur Penjualan ({sale?.invoice_number || `#${sale?.id}`})
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

            <Stack spacing={1.25}>
              {rows.map((row) => {
                const disabled = row.remaining_qty <= 0;
                return (
                  <Paper
                    key={row.sale_detail_id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid #F9D5DC",
                      opacity: disabled ? 0.55 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1.6fr 0.9fr 1.1fr" },
                        gap: 1.25,
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={800}>{row.product_name || "-"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dibeli: {row.bought_qty} • Sudah diretur: {row.returned_qty} • Sisa:{" "}
                          {row.remaining_qty}
                        </Typography>
                      </Box>

                      <AppTextField
                        label="Qty Retur"
                        type="number"
                        size="small"
                        disabled={disabled}
                        value={row.return_qty}
                        onChange={(e) => {
                          const raw = Math.round(Number(e.target.value || 0));
                          const clamped = Math.max(0, Math.min(row.remaining_qty, raw));
                          updateRow(row.sale_detail_id, { return_qty: clamped });
                        }}
                        slotProps={{ htmlInput: { min: 0, max: row.remaining_qty } }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={row.restock}
                            disabled={disabled || row.return_qty <= 0}
                            onChange={(e) =>
                              updateRow(row.sale_detail_id, { restock: e.target.checked })
                            }
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={600}>
                            {row.restock ? "Masuk Stok Jual" : "Barang Rusak (Tanpa Restock)"}
                          </Typography>
                        }
                      />
                    </Box>
                  </Paper>
                );
              })}
            </Stack>

            <Divider />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1.5fr" }, gap: 1.5 }}>
              <AppTextField
                select
                slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                label="Metode Pengembalian Dana (Refund)"
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
              >
                <option value="CASH">Tunai dari Laci Kas (CASH)</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer Bank</option>
              </AppTextField>

              <AppTextField
                label="Alasan Retur (Wajib)"
                placeholder="Mis. Kemasan penyok / salah ukuran / kadaluarsa"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </Box>

            <Divider />

            <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A">
              Otorisasi System Administrator
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
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
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "#FFF7E8",
                border: "1px solid #FDE68A",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" fontWeight={700} color="#92400E">
                Estimasi Total Refund
              </Typography>
              <Typography variant="h6" fontWeight={900} color="#B45309">
                {money(estimatedRefund)}
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton variant="outlined" onClick={onClose} disabled={loading}>
            Batal
          </AppButton>
          <AppButton type="submit" color="warning" disabled={loading || estimatedRefund <= 0 && !rows.some((r) => r.return_qty > 0)}>
            {loading ? "Memproses..." : "Proses Retur"}
          </AppButton>
        </DialogActions>
      </Box>
    </>
  );
};

const ReturnSaleDialog = ({ open, loading = false, onClose, ...props }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
    {open ? <ReturnSaleDialogContent loading={loading} onClose={onClose} {...props} /> : null}
  </Dialog>
);

export default ReturnSaleDialog;
