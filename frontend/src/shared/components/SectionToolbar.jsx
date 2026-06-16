import { Box } from "@mui/material";

const SectionToolbar = ({ left, right, sx = {} }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
        mb: 2,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          width: { xs: "100%", sm: "auto" },
          "& > *": {
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
          },
        }}
      >
        {left}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          width: { xs: "100%", sm: "auto" },
          "& > *": {
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
          },
        }}
      >
        {right}
      </Box>
    </Box>
  );
};

export default SectionToolbar;
