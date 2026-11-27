import { useMemo, useState } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import CallSplitRounded from "@mui/icons-material/CallSplitRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import { money } from "../utils/posFormatters";

const QUICK_CASH_NOTES = [10000, 20000, 50000, 100000, 200000];

const METHODS = [
  { key: "CASH", label: "Tunai", icon: PaymentsRounded },
  { key: "QRIS", label: "QRIS", icon: QrCode2Rounded },
  { key: "TRANSFER", label: "Transfer", icon: AccountBalanceRounded },
];

const CheckoutDialogContent = ({
  summary,
  member,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const totalAmount = Math.round(Number(summary?.totalAmount || 0));
  const [mode, setMode] = useState("SINGLE");
  const [singleMethod, setSingleMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState(String(totalAmount));
  const [referenceNo, setReferenceNo] = useState("");
  const [splitRows, setSplitRows] = useState([
    { payment_method: "CASH", amount: String(totalAmount), received_amount: String(totalAmount), reference_no: "" },
    { payment_method: "QRIS", amount: "0", received_amount: "0", reference_no: "" },
  ]);
  const [errorMsg, setErrorMsg] = useState("");

  const singleCashChange = useMemo(() => {
    if (singleMethod !== "CASH") return 0;
    const rec = Math.round(Number(cashReceived || 0));
    return rec - totalAmount;
  }, [singleMethod, cashReceived, totalAmount]);

  const splitStats = useMemo(() => {
    const allocated = splitRows.reduce(
      (sum, row) => sum + Math.max(0, Math.round(Number(row.amount || 0))),
      0
    );
    const totalReceived = splitRows.reduce((sum, row) => {
      const amt = Math.max(0, Math.round(Number(row.amount || 0)));
      if (row.payment_method === "CASH") {
        return sum + Math.max(0, Math.round(Number(row.received_amount || 0)));
      }
      return sum + amt;
    }, 0);
    const totalChange = splitRows.reduce((sum, row) => {
      if (row.payment_method !== "CASH") return sum;
      const amt = Math.max(0, Math.round(Number(row.amount || 0)));
      const rec = Math.max(0, Math.round(Number(row.received_amount || 0)));
      return sum + Math.max(0, rec - amt);
    }, 0);
    return {
      allocated,
      remaining: totalAmount - allocated,
      totalReceived,
      totalChange,
    };
  }, [splitRows, totalAmount]);

  const handleSplitRowChange = (index, field, value) => {
    setSplitRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        if (field === "amount" && next.payment_method === "CASH") {
          const prevAmt = Number(row.amount || 0);
          const prevRec = Number(row.received_amount || 0);
          if (prevRec <= prevAmt) {
            next.received_amount = value;
          }
        }
        if (field === "payment_method" && value === "CASH") {
          next.received_amount = next.amount;
          next.reference_no = "";
        }
        return next;
      })
    );
  };

  const addSplitRow = () => {
    const remaining = Math.max(0, splitStats.remaining);
    setSplitRows((prev) => [
      ...prev,
      {
        payment_method: "TRANSFER",
        amount: String(remaining),
        received_amount: String(remaining),
        reference_no: "",
      },
    ]);
  };

  const removeSplitRow = (index) => {
    setSplitRows((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  const fillRemainingOnRow = (index) => {
    const otherAllocated = splitRows.reduce(
      (sum, row, i) => (i === index ? sum : sum + Math.max(0, Math.round(Number(row.amount || 0)))),
      0
    );
    const rem = Math.max(0, totalAmount - otherAllocated);
    handleSplitRowChange(index, "amount", String(rem));
    if (splitRows[index]?.payment_method === "CASH") {
      handleSplitRowChange(index, "received_amount", String(rem));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      let payments = [];
      if (mode === "SINGLE") {
        if (singleMethod === "CASH") {
          const rec = Math.round(Number(cashReceived || 0));
          if (Number.isNaN(rec) || rec < totalAmount) {
            setErrorMsg("Uang tunai yang diterima masih kurang dari total tagihan");
            return;
          }
          payments = [
            {
              payment_method: "CASH",
              amount: totalAmount,
              received_amount: rec,
            },
          ];
        } else {
          payments = [
            {
              payment_method: singleMethod,
              amount: totalAmount,
              received_amount: totalAmount,
              reference_no: referenceNo.trim() || null,
            },
          ];
        }
      } else {
        const activeRows = splitRows.filter((row) => Math.round(Number(row.amount || 0)) > 0);
        if (totalAmount > 0 && activeRows.length < 2) {
          setErrorMsg("Split payment minimal terdiri dari 2 baris pembayaran bernilai > 0");
          return;
        }
        if (splitStats.remaining !== 0) {
          setErrorMsg(
            `Total alokasi split payment harus tepat ${money(totalAmount)} (sisa: ${money(splitStats.remaining)})`
          );
          return;
        }
        for (const row of activeRows) {
          const amt = Math.round(Number(row.amount || 0));
          if (row.payment_method === "CASH") {
            const rec = Math.round(Number(row.received_amount || 0));
            if (Number.isNaN(rec) || rec < amt) {
              setErrorMsg("Uang tunai diterima pada split payment tidak boleh kurang dari alokasi tunai");
              return;
            }
          }
        }
        payments = activeRows.map((row) => {
          const amt = Math.round(Number(row.amount || 0));
          const rec =
            row.payment_method === "CASH"
              ? Math.round(Number(row.received_amount || 0))
              : amt;
          return {
            payment_method: row.payment_method,
            amount: amt,
            received_amount: rec,
            reference_no: row.payment_method === "CASH" ? null : row.reference_no?.trim() || null,
          };
        });
      }

      await onConfirm(payments);
    } catch (err) {
      setErrorMsg(err?.message || "Checkout gagal");
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={850} color="#7A2E3A">
              Checkout & Pembayaran
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary?.totalQty || 0} item • Pembeli: {member ? `${member.name} (Anggota)` : "Pembeli Umum"}
            </Typography>
          </Box>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, val) => val && setMode(val)}
          >
            <ToggleButton value="SINGLE" sx={{ fontWeight: 700, textTransform: "none" }}>
              1 Metode
            </ToggleButton>
            <ToggleButton value="SPLIT" sx={{ fontWeight: 700, textTransform: "none" }}>
              <CallSplitRounded fontSize="small" sx={{ mr: 0.5 }} />
              Split
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#7A2E3A",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  TOTAL TAGIHAN
                </Typography>
                {Number(summary?.totalDiscount || 0) > 0 ? (
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                    Subtotal {money(summary.subtotalAmount)} • Diskon -{money(summary.totalDiscount)}
                  </Typography>
                ) : null}
              </Box>
              <Typography variant="h4" fontWeight={900}>
                {money(totalAmount)}
              </Typography>
            </Paper>

            {mode === "SINGLE" ? (
              <Stack spacing={2}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                  {METHODS.map(({ key, label, icon: Icon }) => {
                    const selected = singleMethod === key;
                    return (
                      <Paper
                        key={key}
                        elevation={0}
                        onClick={() => setSingleMethod(key)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: "pointer",
                          textAlign: "center",
                          border: selected ? "2px solid #C93F58" : "1px solid #E2E8F0",
                          backgroundColor: selected ? "#FFF1F3" : "#FFFFFF",
                          color: selected ? "#C93F58" : "#475569",
                          transition: "all 0.15s",
                        }}
                      >
                        <Icon fontSize="small" />
                        <Typography variant="body2" fontWeight={800} sx={{ mt: 0.25 }}>
                          {label}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Box>

                {singleMethod === "CASH" ? (
                  <Stack spacing={1.5}>
                    <AppTextField
                      label="Uang Diterima (Rp)"
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      slotProps={{ htmlInput: { min: 0 } }}
                      autoFocus
                    />
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      <Chip
                        label="Uang Pas"
                        clickable
                        color={Number(cashReceived) === totalAmount ? "primary" : "default"}
                        onClick={() => setCashReceived(String(totalAmount))}
                        sx={{ fontWeight: 700 }}
                      />
                      {QUICK_CASH_NOTES.map((note) => (
                        <Chip
                          key={note}
                          label={money(note)}
                          clickable
                          variant="outlined"
                          onClick={() => setCashReceived(String(note))}
                          sx={{ fontWeight: 700 }}
                        />
                      ))}
                    </Stack>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: singleCashChange < 0 ? "#FECACA" : "#BBF7D0",
                        backgroundColor: singleCashChange < 0 ? "#FEF2F2" : "#F0FDF4",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={singleCashChange < 0 ? "error.main" : "#166534"}
                      >
                        {singleCashChange < 0 ? "Kurang Bayar" : "Kembalian"}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        color={singleCashChange < 0 ? "error.main" : "#15803D"}
                      >
                        {money(Math.abs(singleCashChange))}
                      </Typography>
                    </Paper>
                  </Stack>
                ) : (
                  <AppTextField
                    label={`Nomor Referensi / Catatan ${singleMethod} (Opsional)`}
                    placeholder="Mis. ID Transaksi QRIS / 4 digit ref transfer"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                )}
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                {splitRows.map((row, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2, border: "1px solid #F9D5DC", backgroundColor: "#FFFDFE" }}
                  >
                    <Stack spacing={1.25}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" fontWeight={800} color="#7A2E3A">
                          Pembayaran #{idx + 1}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Chip
                            size="small"
                            label="Isi Sisa"
                            clickable
                            onClick={() => fillRemainingOnRow(idx)}
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                          {splitRows.length > 2 ? (
                            <IconButton size="small" color="error" onClick={() => removeSplitRow(idx)}>
                              <DeleteRounded fontSize="small" />
                            </IconButton>
                          ) : null}
                        </Box>
                      </Box>

                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                        <AppTextField
                          select
                          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                          label="Metode"
                          size="small"
                          value={row.payment_method}
                          onChange={(e) => handleSplitRowChange(idx, "payment_method", e.target.value)}
                        >
                          <option value="CASH">Tunai (CASH)</option>
                          <option value="QRIS">QRIS</option>
                          <option value="TRANSFER">Transfer</option>
                        </AppTextField>
                        <AppTextField
                          label="Nominal Dialokasikan (Rp)"
                          type="number"
                          size="small"
                          value={row.amount}
                          onChange={(e) => handleSplitRowChange(idx, "amount", e.target.value)}
                          slotProps={{ htmlInput: { min: 0 } }}
                        />
                      </Box>

                      {row.payment_method === "CASH" ? (
                        <AppTextField
                          label="Uang Tunai Diterima (Rp)"
                          type="number"
                          size="small"
                          value={row.received_amount}
                          onChange={(e) => handleSplitRowChange(idx, "received_amount", e.target.value)}
                          slotProps={{ htmlInput: { min: 0 } }}
                        />
                      ) : (
                        <AppTextField
                          label="No. Referensi (Opsional)"
                          size="small"
                          value={row.reference_no}
                          onChange={(e) => handleSplitRowChange(idx, "reference_no", e.target.value)}
                        />
                      )}
                    </Stack>
                  </Paper>
                ))}

                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                  <AppButton
                    variant="outlined"
                    size="small"
                    startIcon={<AddRounded />}
                    onClick={addSplitRow}
                  >
                    Tambah Metode Bayar
                  </AppButton>
                </Box>

                <Divider />

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: splitStats.remaining === 0 ? "#BBF7D0" : "#FDE68A",
                    backgroundColor: splitStats.remaining === 0 ? "#F0FDF4" : "#FFFBEB",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">Total Dialokasikan</Typography>
                      <Typography variant="body2" fontWeight={800}>{money(splitStats.allocated)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" fontWeight={700}>
                        {splitStats.remaining === 0 ? "Status Alokasi" : splitStats.remaining > 0 ? "Sisa Belum Dibayar" : "Kelebihan Alokasi"}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={900}
                        color={splitStats.remaining === 0 ? "#15803D" : "warning.dark"}
                      >
                        {splitStats.remaining === 0 ? "PAS" : money(Math.abs(splitStats.remaining))}
                      </Typography>
                    </Box>
                    {splitStats.totalChange > 0 ? (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="#166534" fontWeight={700}>Kembalian Tunai</Typography>
                        <Typography variant="body2" color="#15803D" fontWeight={900}>
                          {money(splitStats.totalChange)}
                        </Typography>
                      </Box>
                    ) : null}
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton variant="outlined" onClick={onClose} disabled={loading}>
            Batal
          </AppButton>
          <AppButton
            type="submit"
            startIcon={<CheckCircleRounded />}
            disabled={
              loading ||
              (mode === "SINGLE" && singleMethod === "CASH" && singleCashChange < 0) ||
              (mode === "SPLIT" && splitStats.remaining !== 0)
            }
          >
            {loading ? "Memproses..." : "Selesaikan Pembayaran"}
          </AppButton>
        </DialogActions>
      </Box>
    </>
  );
};

const CheckoutDialog = ({ open, loading = false, onClose, ...props }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
    {open ? <CheckoutDialogContent loading={loading} onClose={onClose} {...props} /> : null}
  </Dialog>
);

export default CheckoutDialog;
