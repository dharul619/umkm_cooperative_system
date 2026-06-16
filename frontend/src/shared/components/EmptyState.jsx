import { Box, Button, Typography } from "@mui/material";
import InboxRounded from "@mui/icons-material/InboxRounded";

const EmptyState = ({
  icon,
  title = "Data belum tersedia",
  description = "Belum ada data yang dapat ditampilkan saat ini.",
  actionLabel,
  onAction,
  actionIcon,
  sx = {},
}) => {
  const Icon = icon || InboxRounded;

  return (
    <Box
      sx={{
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        py: 5,
        border: "1px dashed #F4B8C3",
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          mb: 2,
          color: "#C93F58",
          backgroundColor: "#FFF1F3",
        }}
      >
        <Icon />
      </Box>
      <Typography variant="h6" fontWeight={700} color="#7A2E3A">
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, maxWidth: 420 }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button
          variant="contained"
          onClick={onAction}
          startIcon={actionIcon}
          sx={{ mt: 2.5 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
