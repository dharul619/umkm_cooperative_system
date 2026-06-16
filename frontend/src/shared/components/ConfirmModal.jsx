import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";

const toneMap = {
  danger: {
    color: "#C93F58",
    bg: "#FFF1F3",
    confirmColor: "error",
  },
  warning: {
    color: "#B76E00",
    bg: "#FFF7E8",
    confirmColor: "warning",
  },
  info: {
    color: "#C93F58",
    bg: "#FFF1F3",
    confirmColor: "primary",
  },
};

const ConfirmModal = ({
  open,
  title = "Konfirmasi tindakan",
  description = "Apakah Anda yakin ingin melanjutkan?",
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  tone = "danger",
  loading = false,
  icon,
  onClose,
  onConfirm,
}) => {
  const currentTone = toneMap[tone] || toneMap.danger;
  const Icon = icon || WarningAmberRounded;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: currentTone.color,
              backgroundColor: currentTone.bg,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={currentTone.confirmColor}
        >
          {loading ? "Memproses..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmModal;
