import { Box, Typography } from "@mui/material";

const PageHeader = ({
  title,
  description,
  actions,
  eyebrow,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
        ...sx,
      }}
    >
      <Box>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{ color: "#C93F58", fontWeight: 700, letterSpacing: 0 }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" fontWeight={800} color="#7A2E3A">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {actions}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
