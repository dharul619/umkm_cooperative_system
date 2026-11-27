import { useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PauseCircleOutlineRounded from "@mui/icons-material/PauseCircleOutlineRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import { computeCartSummary, formatDateTime, money } from "../utils/posFormatters";

const HeldCartsDialogContent = ({
  heldCarts = [],
  hasCurrentItems = false,
  loading = false,
  onClose,
  onHoldCurrent,
  onResumeCart,
  onDeleteCart,
}) => {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await onHoldCurrent({ label: label.trim(), notes: notes.trim() });
      setLabel("");
      setNotes("");
    } catch (err) {
      setErrorMsg(err?.message || "Gagal menahan keranjang");
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PauseCircleOutlineRounded sx={{ color: "#C93F58" }} />
          <Box>
            <Typography variant="h6" fontWeight={850} color="#7A2E3A">
              Antrean Hold
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

          {hasCurrentItems ? (
            <Paper
              elevation={0}
              component="form"
              onSubmit={handleHoldSubmit}
              sx={{ p: 2, borderRadius: 2, border: "1px solid #F9D5DC", backgroundColor: "#FFF9FB" }}
            >
              <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.25 }}>
                Tahan Keranjang Aktif Saat Ini
              </Typography>
              <Stack spacing={1.25}>
                <AppTextField
                  label="Label / Nama Antrean (Opsional)"
                  placeholder="Mis. Pak Budi - tambah barang"
                  size="small"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <AppTextField
                  label="Catatan (Opsional)"
                  size="small"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <AppButton
                    type="submit"
                    size="small"
                    startIcon={<PauseCircleOutlineRounded />}
                    disabled={loading}
                  >
                    {loading ? "Menyimpan..." : "Tahan Keranjang Ini"}
                  </AppButton>
                </Box>
              </Stack>
            </Paper>
          ) : null}

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1 }}>
              Daftar Keranjang Tertahan ({heldCarts.length})
            </Typography>

            {!heldCarts.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                Belum ada transaksi yang ditahan.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {heldCarts.map((cart) => {
                  const summary = computeCartSummary(cart.items || [], cart.discount);
                  return (
                    <Paper
                      key={cart.id}
                      elevation={0}
                      sx={{ p: 1.5, borderRadius: 2, border: "1px solid #E2E8F0" }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography fontWeight={800} color="#7A2E3A">
                              {cart.label}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${summary.totalQty} item`}
                              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                            />
                            {cart.member_name ? (
                              <Chip
                                size="small"
                                color="secondary"
                                variant="outlined"
                                label={cart.member_name}
                                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                              />
                            ) : null}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDateTime(cart.created_at)} • Estimasi: {money(summary.totalAmount)}
                          </Typography>
                          {cart.notes ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Catatan: {cart.notes}
                            </Typography>
                          ) : null}
                        </Box>

                        <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
                          <AppButton
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrowRounded />}
                            onClick={() => onResumeCart(cart)}
                            disabled={loading}
                          >
                            Lanjutkan
                          </AppButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteCart(cart.id)}
                            disabled={loading}
                          >
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>
          Tutup
        </AppButton>
      </DialogActions>
    </>
  );
};

const HeldCartsDialog = ({ open, loading = false, onClose, ...props }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
    {open ? <HeldCartsDialogContent loading={loading} onClose={onClose} {...props} /> : null}
  </Dialog>
);

export default HeldCartsDialog;
