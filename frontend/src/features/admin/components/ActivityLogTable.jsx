import {
  Box,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DataTable from "../../../shared/components/DataTable";
import EmptyState from "../../../shared/components/EmptyState";
import Loading from "../../../shared/components/Loading";
import Pagination from "../../../shared/components/Pagination";

const ActivityLogTable = ({ logs, loading, error, pagination, onPageChange }) => {
  const columns = [
    {
      field: "created_at",
      headerName: "Waktu",
      minWidth: 180,
      render: (value) => (
        <Typography variant="body2">
          {new Date(value).toLocaleString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      ),
    },
    {
      field: "user_name",
      headerName: "User",
      minWidth: 150,
      render: (value, row) => (
        <Typography variant="body2" fontWeight={600}>
          {value || row.user_id || "-"}
        </Typography>
      ),
    },
    {
      field: "activity",
      headerName: "Aktivitas",
      minWidth: 300,
      render: (value) => (
        <Typography variant="body2">{value || "-"}</Typography>
      ),
    },
  ];

  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: "1px solid #FECACA",
          borderRadius: 2,
          backgroundColor: "#FEF2F2",
          textAlign: "center",
        }}
      >
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={logs}
        loading={loading}
        emptyTitle="Belum ada aktivitas"
        emptyDescription="Aktivitas admin akan tercatat di sini."
      />

      {!loading && logs.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Pagination
            page={pagination.page}
            count={pagination.totalPages}
            total={pagination.total}
            onPageChange={onPageChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default ActivityLogTable;
