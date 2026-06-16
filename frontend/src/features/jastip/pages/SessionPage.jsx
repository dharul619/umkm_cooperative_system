import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import TimerRounded from "@mui/icons-material/TimerRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { Box, Grid, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  ConfirmModal,
  DataTable,
  PageHeader,
  StatusAlert,
} from "../../../shared/components";
import { useNavigate } from "react-router-dom";
import { useJastipSessions } from "../hooks/useJastipSessions";

const statusLabel = {
  OPEN: "Open",
  CONFIRMED: "Confirmed",
  ORDERED: "Ordered",
  DELIVERED: "Delivered",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T")
    ? stringValue.split("T")[0]
    : stringValue.split(" ")[0];
};

const SessionPage = () => {
  const navigate = useNavigate();
  const { sessions, openSession, loading, saving, error, refresh, closeSession } = useJastipSessions();
  const [success, setSuccess] = useState("");
  const [closeTarget, setCloseTarget] = useState(null);

  const sessionColumns = useMemo(() => ([
    { field: "order_date", headerName: "Tanggal", minWidth: 130, render: (value) => formatDateOnly(value) },
    { field: "coordinator_name", headerName: "Coordinator", minWidth: 180 },
    { field: "status", headerName: "Status", minWidth: 120, render: (value) => statusLabel[value] || value },
    { field: "menu_count", headerName: "Menu", minWidth: 90 },
    { field: "vendor_count", headerName: "Vendor", minWidth: 90 },
    { field: "order_count", headerName: "Order", minWidth: 90 },
  ]), []);

  const handleCloseSession = async () => {
    if (!closeTarget) return;
    await closeSession(closeTarget.id);
    setSuccess(`Sesi ${formatDateOnly(closeTarget.order_date)} berhasil ditutup.`);
    setCloseTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Session"
        description="Daftar session jastip yang sudah dibuat beserta status dan ringkasannya."
        actions={
          <>
            <AppButton variant="outlined" onClick={() => navigate('/jastip/sessions/create')} startIcon={<AddRounded />}>
              Tambah Sesi
            </AppButton>
            <AppButton variant="outlined" onClick={refresh}>
              Refresh
            </AppButton>
          </>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventAvailableRounded sx={{ color: "#C93F58" }} />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Sesi Aktif
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A" sx={{ mt: 1 }}>
              {openSession ? formatDateOnly(openSession.order_date) : "Belum ada sesi aktif"}
            </Typography>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StorefrontRounded sx={{ color: "#C93F58" }} />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Total Sesi
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A" sx={{ mt: 1 }}>
              {sessions.length}
            </Typography>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimerRounded sx={{ color: "#C93F58" }} />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Status Sesi
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A" sx={{ mt: 1 }}>
              {openSession ? (statusLabel[openSession.status] || openSession.status) : "-"}
            </Typography>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>
          Daftar Session
        </Typography>
        <DataTable
          columns={sessionColumns}
          rows={sessions}
          loading={loading}
          emptyTitle="Belum ada session"
          emptyDescription="Session yang dibuat coordinator akan tampil di sini."
          actions={[
            {
              label: "Buka",
              icon: OpenInNewRounded,
              color: "primary",
              onClick: (row) => navigate(`/jastip/sessions/${row.id}`),
            },
            {
              label: "Tutup",
              icon: DeleteRounded,
              color: "warning",
              onClick: (row) => setCloseTarget(row),
              show: (row) => row.status === "OPEN",
            },
          ]}
        />
      </AppCard>

      <ConfirmModal
        open={!!closeTarget}
        title="Tutup sesi"
        description={`Tutup sesi ${closeTarget ? formatDateOnly(closeTarget.order_date) : ""}? Setelah ditutup, session tidak menerima order baru.`}
        confirmText="Tutup"
        tone="warning"
        loading={saving}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleCloseSession}
      />
    </>
  );
};

export default SessionPage;
