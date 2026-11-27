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
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import LockRounded from "@mui/icons-material/LockRounded";
import PrintRounded from "@mui/icons-material/PrintRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import PauseCircleOutlineRounded from "@mui/icons-material/PauseCircleOutlineRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import OpenShiftPanel from "./OpenShiftPanel";
import {
  escapeHtml,
  formatDateTime,
  money,
  RUPIAH_DENOMINATIONS,
} from "../utils/posFormatters";

const printBlindHandoverReceipt = (shift) => {
  if (!shift) return;
  const denoms = Array.isArray(shift.denominations) ? shift.denominations : [];
  const denomRows = denoms
    .filter((d) => Number(d.count || 0) > 0)
    .map(
      (d) =>
        `<div class="row"><span>${escapeHtml(money(d.denomination))} x ${Number(d.count)}</span><span>${escapeHtml(money(d.subtotal))}</span></div>`
    )
    .join("");

  const actualCash = Number(shift.actual_cash || 0);
  const actualQris = Number(shift.actual_qris || 0);
  const actualTransfer = Number(shift.actual_transfer || 0);
  const totalSetoran = actualCash + actualQris + actualTransfer;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bukti Setoran ${escapeHtml(shift.shift_code)}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    body { width: 72mm; margin: 0 auto; font-family: 'Courier New', monospace; font-size: 12px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .dash { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold" style="font-size:14px;">SIKOMU - BUKTI SETORAN SHIFT</div>
    <div class="bold">${escapeHtml(shift.shift_code)}</div>
  </div>
  <div class="dash"></div>
  <div>Kasir : ${escapeHtml(shift.operator_name || "-")}</div>
  <div>Buka  : ${escapeHtml(formatDateTime(shift.opened_at))}</div>
  <div>Tutup : ${escapeHtml(formatDateTime(shift.closed_at))}</div>
  <div class="row"><span>Modal Awal</span><span>${escapeHtml(money(shift.opening_cash))}</span></div>
  <div class="dash"></div>
  <div class="bold">Pecahan Tunai:</div>
  ${denomRows || "<div>Rp 0</div>"}
  <div class="dash"></div>
  <div class="row bold"><span>Total Tunai</span><span>${escapeHtml(money(actualCash))}</span></div>
  <div class="row"><span>EDC QRIS</span><span>${escapeHtml(money(actualQris))}</span></div>
  <div class="row"><span>EDC Transfer</span><span>${escapeHtml(money(actualTransfer))}</span></div>
  <div class="dash"></div>
  <div class="row bold" style="font-size:13px;">
    <span>TOTAL SETORAN</span>
    <span>${escapeHtml(money(totalSetoran))}</span>
  </div>
  ${shift.notes ? `<div class="dash"></div><div>Catatan: ${escapeHtml(shift.notes)}</div>` : ""}
  <div class="dash"></div>
  <div class="center">Dicetak: ${escapeHtml(formatDateTime(new Date()))}</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=680");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 150);
};

const BlindCloseDialogContent = ({
  activeShift,
  savingShift = false,
  onClose,
  onConfirm,
}) => {
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(RUPIAH_DENOMINATIONS.map((d) => [d, "0"]))
  );
  const [actualQris, setActualQris] = useState("0");
  const [actualTransfer, setActualTransfer] = useState("0");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const denominationRows = useMemo(
    () =>
      RUPIAH_DENOMINATIONS.map((denom) => {
        const count = Math.max(0, Math.round(Number(counts[denom] || 0)));
        return {
          denomination: denom,
          count,
          subtotal: denom * count,
        };
      }),
    [counts]
  );

  const totalActualCash = useMemo(
    () => denominationRows.reduce((sum, row) => sum + row.subtotal, 0),
    [denominationRows]
  );

  const qrisVal = Math.max(0, Math.round(Number(actualQris || 0)));
  const transferVal = Math.max(0, Math.round(Number(actualTransfer || 0)));
  const grandTotal = totalActualCash + qrisVal + transferVal;

  const handleCountChange = (denom, value) => {
    if (value === "") {
      setCounts((prev) => ({ ...prev, [denom]: "" }));
      return;
    }
    const parsed = Math.max(0, Math.floor(Number(value)));
    setCounts((prev) => ({
      ...prev,
      [denom]: Number.isNaN(parsed) ? "0" : String(parsed),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (Number.isNaN(qrisVal) || qrisVal < 0 || Number.isNaN(transferVal) || transferVal < 0) {
      setErrorMsg("Nominal settlement EDC tidak valid");
      return;
    }
    try {
      await onConfirm({
        denominations: denominationRows.map(({ denomination, count }) => ({
          denomination,
          count,
        })),
        actual_qris: qrisVal,
        actual_transfer: transferVal,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal menutup shift kasir");
    }
  };

  return (
    <>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PaymentsRounded sx={{ color: "#C93F58" }} />
          <Typography variant="h6" fontWeight={850} color="#7A2E3A">
            Tutup Shift ({activeShift?.shift_code})
          </Typography>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

            <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A">
              1. Hitung Kas Tunai (Per Pecahan)
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.25,
              }}
            >
              {denominationRows.map((row) => (
                <Paper
                  key={row.denomination}
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px solid #F9D5DC",
                    backgroundColor: row.count > 0 ? "#FFF9FB" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.25,
                  }}
                >
                  <Typography variant="body2" fontWeight={850} color="#7A2E3A" sx={{ minWidth: 92 }}>
                    {money(row.denomination)}
                  </Typography>

                  <AppTextField
                    type="number"
                    size="small"
                    label="Jml"
                    value={counts[row.denomination]}
                    onChange={(e) => handleCountChange(row.denomination, e.target.value)}
                    slotProps={{
                      htmlInput: { min: 0, step: 1, style: { textAlign: "center" } },
                    }}
                    sx={{ width: 88 }}
                  />

                  <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{ minWidth: 92, textAlign: "right" }}
                  >
                    {money(row.subtotal)}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Divider />

            <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A">
              2. Settlement Mesin EDC
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              <AppTextField
                label="Total EDC QRIS (Rp)"
                type="number"
                size="small"
                value={actualQris}
                onChange={(e) => setActualQris(e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <AppTextField
                label="Total EDC Transfer / Bank (Rp)"
                type="number"
                size="small"
                value={actualTransfer}
                onChange={(e) => setActualTransfer(e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 1.75,
                borderRadius: 2,
                backgroundColor: "#7A2E3A",
                color: "#FFFFFF",
              }}
            >
              <Stack spacing={0.4}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Tunai Fisik</Typography>
                  <Typography variant="body2" fontWeight={700}>{money(totalActualCash)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>EDC QRIS</Typography>
                  <Typography variant="body2" fontWeight={700}>{money(qrisVal)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>EDC Transfer</Typography>
                  <Typography variant="body2" fontWeight={700}>{money(transferVal)}</Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.25)", my: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" fontWeight={800}>TOTAL SETORAN</Typography>
                  <Typography variant="h6" fontWeight={900}>{money(grandTotal)}</Typography>
                </Box>
              </Stack>
            </Paper>

            <AppTextField
              label="Catatan (Opsional)"
              size="small"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton variant="outlined" onClick={onClose} disabled={savingShift}>
            Batal
          </AppButton>
          <AppButton type="submit" color="error" disabled={savingShift}>
            {savingShift ? "Menutup Shift..." : "Simpan & Tutup Shift"}
          </AppButton>
        </DialogActions>
      </Box>
    </>
  );
};

const ShiftManagementTab = ({
  activeShift,
  heldCartsCount = 0,
  savingShift = false,
  onOpenShift,
  onCloseShift,
  onOpenHeldCarts,
}) => {
  const [closeOpen, setCloseOpen] = useState(false);
  const [lastClosedShift, setLastClosedShift] = useState(null);

  const handleCloseShiftConfirm = async (payload) => {
    const res = await onCloseShift(activeShift.id, payload);
    setCloseOpen(false);
    setLastClosedShift(res?.data?.shift || null);
  };

  return (
    <Stack spacing={2.5}>
      {lastClosedShift ? (
        <Alert
          severity="success"
          action={
            <AppButton
              size="small"
              variant="outlined"
              startIcon={<PrintRounded />}
              onClick={() => printBlindHandoverReceipt(lastClosedShift)}
            >
              Cetak Bukti Setoran
            </AppButton>
          }
          onClose={() => setLastClosedShift(null)}
        >
          Shift <strong>{lastClosedShift.shift_code}</strong> ditutup. Tunai:{" "}
          <strong>{money(lastClosedShift.actual_cash)}</strong> • QRIS:{" "}
          <strong>{money(lastClosedShift.actual_qris)}</strong> • Transfer:{" "}
          <strong>{money(lastClosedShift.actual_transfer)}</strong>
        </Alert>
      ) : null}

      {!activeShift ? (
        <OpenShiftPanel onOpenShift={onOpenShift} loading={savingShift} />
      ) : (
        <Stack spacing={2}>
          {heldCartsCount > 0 ? (
            <Alert
              severity="warning"
              action={
                <AppButton
                  size="small"
                  variant="outlined"
                  startIcon={<PauseCircleOutlineRounded />}
                  onClick={onOpenHeldCarts}
                >
                  Lihat Hold ({heldCartsCount})
                </AppButton>
              }
            >
              Masih ada <strong>{heldCartsCount} transaksi di-Hold</strong>. Selesaikan atau hapus terlebih dahulu sebelum tutup shift.
            </Alert>
          ) : null}

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: "1px solid #F9D5DC",
              backgroundColor: "#FFF9FB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={850} color="#7A2E3A">
                  {activeShift.shift_code}
                </Typography>
                <Chip size="small" color="success" label="OPEN" sx={{ fontWeight: 800 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Kasir: <strong>{activeShift.operator_name || "-"}</strong> • Dibuka:{" "}
                {formatDateTime(activeShift.opened_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modal Awal: <strong>{money(activeShift.opening_cash)}</strong>
                {activeShift.notes ? ` • ${activeShift.notes}` : ""}
              </Typography>
            </Box>

            <AppButton
              color="error"
              startIcon={<LockRounded />}
              onClick={() => setCloseOpen(true)}
              disabled={savingShift || heldCartsCount > 0}
            >
              Tutup Shift
            </AppButton>
          </Paper>
        </Stack>
      )}

      <Dialog
        open={closeOpen}
        onClose={savingShift ? undefined : () => setCloseOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {closeOpen ? (
          <BlindCloseDialogContent
            activeShift={activeShift}
            savingShift={savingShift}
            onClose={() => setCloseOpen(false)}
            onConfirm={handleCloseShiftConfirm}
          />
        ) : null}
      </Dialog>
    </Stack>
  );
};

export default ShiftManagementTab;
