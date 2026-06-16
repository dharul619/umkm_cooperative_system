import { Button } from "@mui/material";

const AppButton = ({
  children,
  variant = "contained",
  color = "primary",
  sx = {},
  ...props
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      sx={{
        borderRadius: 1.5,
        px: 2.5,
        fontWeight: 700,
        textTransform: "none",
        boxShadow: variant === "contained" ? "none" : undefined,
        "&:hover": {
          boxShadow: variant === "contained" ? "none" : undefined,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AppButton;
