import { useState } from "react";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import LockOpenRounded from "@mui/icons-material/LockOpenRounded";
import { AppButton, AppTextField } from "../../../../shared/components";
import { money } from "../utils/posFormatters";

const QUICK_OPENING_CASH = [0, 100000, 200000, 300000, 500000];

const OpenShiftPanel = ({ onOpenShift, loading = false }) => {
  const [openingCash, setOpeningCash] = useState("200000");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericCash = Math.round(Number(openingCash || 0));
    if (Number.isNaN(numericCash) || numericCash < 0) {
      setLocalError("Modal awal laci kas tidak valid");
      return;
    }
    try {
      setLocalError("");
      await onOpenShift({ opening_cash: numericCash, notes: notes.trim() || null });
    } catch (err) {
      setLocalError(err?.message || "Gagal membuka shift kasir");
    }
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: "1px solid #F9D5DC",
          background: "linear-gradient(180deg, #FFF9FB 0%, #FFFFFF 100%)",
        }}
      >
        <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: "#FFF1F3",
                color: "#C93F58",
                display: "grid",
                placeItems: "center",
              }}
            >
              <PointOfSaleRounded />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={850} color="#7A2E3A">
                Buka Shift Kasir
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Input modal awal laci kas untuk memulai POS.
              </Typography>
            </Box>
          </Box>

          {localError ? <Alert severity="error">{localError}</Alert> : null}

          <Box>
            <AppTextField
              label="Modal Awal Laci Kas (Rp)"
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
              required
            />
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.25 }}>
              {QUICK_OPENING_CASH.map((preset) => (
                <Chip
                  key={preset}
                  label={preset === 0 ? "Rp 0" : money(preset)}
                  clickable
                  onClick={() => setOpeningCash(String(preset))}
                  color={Number(openingCash) === preset ? "primary" : "default"}
                  variant={Number(openingCash) === preset ? "filled" : "outlined"}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>
          </Box>

          <AppTextField
            label="Catatan Shift (Opsional)"
            placeholder="Mis. Shift pagi, uang receh lengkap"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <AppButton
            type="submit"
            size="large"
            startIcon={<LockOpenRounded />}
            disabled={loading}
            sx={{ py: 1.3 }}
          >
            {loading ? "Membuka Shift..." : "Buka Shift & Mulai Kasir"}
          </AppButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default OpenShiftPanel;
