import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { Box, InputAdornment, Stack, Typography } from "@mui/material";
import AppTextField from "../../../shared/components/AppTextField";
import PageHeader from "../../../shared/components/PageHeader";
import ActivityLogTable from "../components/ActivityLogTable";
import { useActivityLogs } from "../hooks/useActivityLogs";

const FilterField = ({ label, children }) => (
  <Box>
    <Typography
      variant="caption"
      fontWeight={700}
      color="text.secondary"
      sx={{ mb: 0.5, display: "block" }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

const ActivityLogPage = () => {
  const {
    logs,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    changePage,
    refresh,
  } = useActivityLogs();

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  return (
    <Box>
      <PageHeader
        title="Log Aktivitas"
        subtitle="Riwayat aktivitas admin di sistem"
        action={{
          label: "Refresh",
          icon: RefreshRounded,
          onClick: refresh,
        }}
      />

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FilterField label="User ID">
          <AppTextField
            name="user_id"
            placeholder="Filter User ID"
            value={filters.user_id}
            onChange={(e) => handleFilterChange("user_id", e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonRounded fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </FilterField>

        <FilterField label="Dari Tanggal">
          <AppTextField
            name="from"
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthRounded fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </FilterField>

        <FilterField label="Sampai Tanggal">
          <AppTextField
            name="to"
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthRounded fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </FilterField>
      </Stack>

      {/* Table */}
      <ActivityLogTable
        logs={logs}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={changePage}
      />
    </Box>
  );
};

export default ActivityLogPage;
