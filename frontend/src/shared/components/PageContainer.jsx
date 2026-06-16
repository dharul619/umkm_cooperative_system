import { Box, Container } from "@mui/material";

const PageContainer = ({
  children,
  maxWidth = "lg",
  withGutter = true,
  sx = {},
}) => {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        py: withGutter ? 3 : 0,
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth}>{children}</Container>
    </Box>
  );
};

export default PageContainer;
