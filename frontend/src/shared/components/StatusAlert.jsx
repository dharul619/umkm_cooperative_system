import { Alert } from "@mui/material";

const StatusAlert = ({ children, show = true, sx = {}, ...props }) => {
  if (!show || !children) return null;

  return (
    <Alert
      sx={{
        borderRadius: 1.5,
        mb: 2,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Alert>
  );
};

export default StatusAlert;
