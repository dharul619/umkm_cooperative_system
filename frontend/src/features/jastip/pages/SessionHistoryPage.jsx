import { useMemo, useState } from "react";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { Box, Grid, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  DataTable,
  PageHeader,
  StatusAlert,
} from "../../../shared/components";
import { useNavigate } from "react-router-dom";
import { useJastipSessions } from "../hooks/useJastipSessions";

const statusLabel = {
  OPEN: "Buka",
  CONFIRMED: "Dikonfirmasi",
  ORDERED: "Dipesan ke Vendor",
  DELIVERED: "Dijemput",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T")
    ? stringValue.split("T")[0]
    : stringValue.split(" ")[0];
};

const SessionHistoryPage = () => {
  const navigate = useNavigate();
  const { sessions, loading, error, refresh } = useJastipSessions();
  const [success] = useState("");

  const historySessions = useMemo(() => {
    return sessions.filter((s) => s.status === "DONE" || s.status === "CANCELLED");
  }, [sessions]);

  const sessionColumns = useMemo(() => ([
    { field: "order_date", headerName: "Tanggal", minWidth: 130, render: (value) => formatDateOnly(value) },
    { field: "coordinator_name", headerName: "Coordinator", minWidth: 180 },
    { field: "status", headerName: "Status", minWidth: 120, render: (value) => statusLabel[value] || value },
    { field: "menu_count", headerName: "Menu", minWidth: 90 },
    { field: "vendor_count", headerName: "Vendor", minWidth: 90 },
    { field: "order_count", headerName: "Order", minWidth: 90 },
  ]), []);

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Riwayat Sesi"
        description="Daftar sesi jastip yang sudah selesai (DONE) atau dibatalkan (CANCELLED)."
        actions={
          <AppButton variant="outlined" onClick={refresh} startIcon={<RefreshRounded />}>
            Refresh
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success}>{success}</StatusAlert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <AppCard sx={{ height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryRounded sx={{ color: "#7A2E3A" }} />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Selesai / Dibatalkan
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A" sx={{ mt: 1 }}>
              {historySessions.length} Sesi
            </Typography>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>
          Daftar Riwayat Sesi
        </Typography>
        <DataTable
          columns={sessionColumns}
          rows={historySessions}
          loading={loading}
          emptyTitle="Belum ada riwayat sesi"
          emptyDescription="Sesi yang sudah selesai atau dibatalkan akan tampil di sini."
          actions={[
            {
              label: "Buka Detail",
              icon: OpenInNewRounded,
              color: "primary",
              onClick: (row) => navigate(`/jastip/sessions/${row.id}`),
            },
          ]}
        />
      </AppCard>
    </>
  );
};

export default SessionHistoryPage;
