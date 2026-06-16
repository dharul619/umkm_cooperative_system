import { TextField } from "@mui/material";

const AppTextField = ({ sx = {}, ...props }) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      sx={{
        width: "100%",
        minWidth: 0,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#FFFFFF",
          borderRadius: 1.5,
          "&:hover fieldset": {
            borderColor: "#E85D75",
          },
        },
        "& .MuiOutlinedInput-root.Mui-focused fieldset": {
          borderColor: "#E85D75",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#C93F58",
        },
        "& .MuiInputLabel-root.MuiInputLabel-shrink": {
          backgroundColor: "#FFFFFF",
          px: 0.5,
        },
        "& .MuiSelect-select": {
          minHeight: 24,
          display: "flex",
          alignItems: "center",
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default AppTextField;
