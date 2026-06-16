import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DataTable from "../../../shared/components/DataTable";
import EmptyState from "../../../shared/components/EmptyState";
import Loading from "../../../shared/components/Loading";
import ApprovalButton from "./ApprovalButton";

const UserTable = ({
  users,
  loading,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) => {
  const columns = [
    { field: "name", headerName: "Nama", minWidth: 180 },
    // { field: "username", headerName: "Username", minWidth: 140 },
    { field: "role_name", headerName: "Role", minWidth: 170 },
    // { field: "phone_number", headerName: "No. HP", minWidth: 150 },
    { field: "division", headerName: "Divisi", minWidth: 170 },
    { field: "department", headerName: "Departement", minWidth: 170 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      render: (value) => <ApprovalButton status={value} />,
    },
  ];

  const actions = [
    {
      label: "Edit user",
      icon: EditRounded,
      onClick: onEdit,
    },
    {
      label: "Approve user",
      icon: CheckCircleRounded,
      color: "success",
      onClick: onApprove,
      disabled: (row) => row.status === "approved",
    },
    {
      label: "Reject user",
      icon: CloseRounded,
      color: "warning",
      onClick: onReject,
      disabled: (row) => row.status === "rejected",
    },
    {
      label: "Hapus user",
      icon: DeleteRounded,
      color: "error",
      onClick: onDelete,
    },
  ];

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DataTable
          columns={columns}
          rows={users}
          loading={loading}
          actions={actions}
          emptyTitle="Belum ada user"
          emptyDescription="User yang terdaftar akan muncul di tabel ini."
        />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {loading ? (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}
          >
            <Loading message="Memuat user..." />
          </Paper>
        ) : !users.length ? (
          <EmptyState
            title="Belum ada user"
            description="User yang terdaftar akan muncul di sini."
          />
        ) : (
          <Stack spacing={1.5}>
            {users.map((user) => (
              <Paper
                key={user.id}
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid #F9D5DC",
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="#7A2E3A"
                      noWrap
                    >
                      {user.name || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.phone_number || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      @{user.username || "-"}
                    </Typography>
                  </Box>
                  <ApprovalButton status={user.status} />
                </Box>

                <Stack spacing={0.75}>
                  <InfoRow label="No. HP" value={user.phone_number} />
                  <InfoRow label="Role" value={user.role_name} />
                  <InfoRow label="Divisi" value={user.division} />
                  <InfoRow label="Departemen" value={user.department} />
                </Stack>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 0.5,
                    mt: 1.5,
                    pt: 1,
                    borderTop: "1px solid #FDE8EC",
                  }}
                >
                  {actions.map((action) => {
                    const Icon = action.icon;
                    const disabled = action.disabled?.(user);

                    return (
                      <Tooltip key={action.label} title={action.label}>
                        <span>
                          <IconButton
                            size="small"
                            color={action.color || "primary"}
                            disabled={disabled}
                            onClick={() => action.onClick?.(user)}
                          >
                            {Icon && <Icon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </>
  );
};

const InfoRow = ({ label, value }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "92px minmax(0, 1fr)",
      gap: 1,
      alignItems: "start",
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
      {value || "-"}
    </Typography>
  </Box>
);

export default UserTable;
