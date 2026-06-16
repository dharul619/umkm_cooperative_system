import { Box, CircularProgress, Typography } from "@mui/material";

const Loading = ({
  message = "Memuat data...",
  fullPage = false,
  size = 36,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        minHeight: fullPage ? "100vh" : 240,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        color: "text.secondary",
        ...sx,
      }}
    >
      <CircularProgress size={size} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Loading;
