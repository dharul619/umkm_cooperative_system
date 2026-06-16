import { Chip } from "@mui/material";

const statusConfig = {
  approved: {
    label: "Approved",
    color: "success",
  },
  pending: {
    label: "Pending",
    color: "warning",
  },
  rejected: {
    label: "Rejected",
    color: "error",
  },
};

const ApprovalButton = ({ status }) => {
  const config = statusConfig[status] || {
    label: status || "-",
    color: "default",
  };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700, textTransform: "capitalize" }}
    />
  );
};

export default ApprovalButton;
