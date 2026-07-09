import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import CalendarTodayRounded from "@mui/icons-material/CalendarTodayRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import RestaurantMenuRounded from "@mui/icons-material/RestaurantMenuRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import EventBusyRounded from "@mui/icons-material/EventBusyRounded";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Chip,
  Divider,
  keyframes,
} from "@mui/material";
import {
  AppButton,
  AppCard,
  ConfirmModal,
  PageHeader,
  StatusAlert,
} from "../../../shared/components";
import { useNavigate } from "react-router-dom";
import { useJastipSessions } from "../hooks/useJastipSessions";

const pulseAnimation = keyframes`
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
`;

const statusLabel = {
  OPEN: "Buka",
  CONFIRMED: "Dikonfirmasi",
  ORDERED: "Dipesan ke Vendor",
  DELIVERED: "Dijemput",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusMeta = {
  OPEN: { label: "Menerima Pesanan (OPEN)", color: "#2e7d32", bg: "#e8f5e9" },
  CONFIRMED: {
    label: "Dikonfirmasi (CONFIRMED)",
    color: "#e65100",
    bg: "#fff3e0",
  },
  ORDERED: {
    label: "Dipesan ke Vendor (ORDERED)",
    color: "#6a1b9a",
    bg: "#f3e5f5",
  },
  DELIVERED: { label: "Dijemput (DELIVERED)", color: "#1976d2", bg: "#e3f2fd" },
  CANCELLED: {
    label: "Dibatalkan (CANCELLED)",
    color: "#d32f2f",
    bg: "#ffebee",
  },
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
  const { sessions, loading, saving, error, refresh, closeSession } =
    useJastipSessions();
  const [success, setSuccess] = useState("");
  const [closeTarget, setCloseTarget] = useState(null);

  // Filter to show active sessions (not DONE and not CANCELLED)
  const openSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.status !== "DONE" && s.status !== "CANCELLED",
    );
  }, [sessions]);

  const handleCloseSession = async () => {
    if (!closeTarget) return;
    try {
      await closeSession(closeTarget.id);
      setSuccess(
        `Sesi jastip tanggal ${formatDateOnly(closeTarget.order_date)} berhasil ditutup.`,
      );
      setCloseTarget(null);
      refresh();
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Sesi Aktif"
        description="Pantau dan kelola sesi jastip yang sedang aktif berjalan."
        // actions={
        //   <Stack direction="row" spacing={1}>
        //     <AppButton
        //       variant="contained"
        //       onClick={() => navigate("/jastip/sessions/create")}
        //       startIcon={<AddRounded />}
        //     >
        //       Mulai Sesi Baru
        //     </AppButton>
        //     <AppButton
        //       variant="outlined"
        //       onClick={refresh}
        //       startIcon={<RefreshRounded />}
        //     >
        //       Refresh
        //     </AppButton>
        //   </Stack>
        // }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert
        severity="success"
        show={!!success}
        onClose={() => setSuccess("")}
      >
        {success}
      </StatusAlert>

      {loading ? (
        <Box
          sx={{
            width: "100%",
            py: 8,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">
            Memuat data sesi aktif...
          </Typography>
        </Box>
      ) : openSessions.length > 0 ? (
        <Grid container spacing={3}>
          {openSessions.map((session) => (
            <Grid item xs={12} sm={6} lg={4} key={session.id}>
              <AppCard
                sx={{
                  border: "1px solid #F9D5DC",
                  borderTop: `6px solid ${statusMeta[session.status]?.color || "#C93F58"}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(201, 63, 88, 0.12)",
                  },
                }}
              >
                {/* Header Card */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: session.failed_payment_count > 0 ? "#E65100" : (statusMeta[session.status]?.color || "#757575"),
                        animation:
                          session.status === "OPEN" && session.failed_payment_count === 0
                            ? `${pulseAnimation} 2s infinite ease-in-out`
                            : undefined,
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      color={session.failed_payment_count > 0 ? "#E65100" : (statusMeta[session.status]?.color || "#757575")}
                    >
                      {statusMeta[session.status]?.label || session.status}
                    </Typography>
                  </Box>
                  {session.failed_payment_count > 0 && session.status === "OPEN" ? (
                    <Chip
                      label={`${session.failed_payment_count} gagal`}
                      size="small"
                      sx={{
                        bgcolor: "#FFF3E0",
                        color: "#E65100",
                        border: "1px solid #FFB74D",
                        fontWeight: 700,
                      }}
                    />
                  ) : (
                    <Chip
                      label={statusLabel[session.status] || session.status}
                      size="small"
                      sx={{
                        bgcolor: statusMeta[session.status]?.bg || "#e0e0e0",
                        color: statusMeta[session.status]?.color || "#757575",
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Box>

                {/* Date */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                  }}
                >
                  <CalendarTodayRounded
                    sx={{ color: "#7A2E3A", fontSize: 28 }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      TANGGAL SESI
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#7A2E3A">
                      {formatDateOnly(session.order_date)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2.5, borderColor: "#FDE8EC" }} />

                {/* Details Grid */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <RestaurantMenuRounded sx={{ color: "#C93F58", fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          sx={{ fontSize: "0.65rem", letterSpacing: 0.3 }}
                        >
                          MENU
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color="#7A2E3A"
                        sx={{ lineHeight: 1.2 }}
                      >
                        {session.menu_count || 0}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <StorefrontRounded sx={{ color: "#C93F58", fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          sx={{ fontSize: "0.65rem", letterSpacing: 0.3 }}
                        >
                          VENDOR
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color="#7A2E3A"
                        sx={{ lineHeight: 1.2 }}
                      >
                        {session.vendor_count || 0}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <ShoppingCartRounded sx={{ color: "#C93F58", fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          sx={{ fontSize: "0.65rem", letterSpacing: 0.3 }}
                        >
                          ORDER
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color="#7A2E3A"
                        sx={{ lineHeight: 1.2 }}
                      >
                        {session.order_count || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 2.5, borderColor: "#FDE8EC" }} />

                {/* Actions */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <AppButton
                    variant="contained"
                    fullWidth
                    startIcon={<OpenInNewRounded />}
                    onClick={() => navigate(`/jastip/sessions/${session.id}`)}
                  >
                    Buka Detail
                  </AppButton>
                  {session.status === "OPEN" && (
                    <AppButton
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<LockRounded />}
                      onClick={() => setCloseTarget(session)}
                    >
                      Tutup Sesi
                    </AppButton>
                  )}
                </Stack>
              </AppCard>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Empty State */
        <Box
          sx={{
            py: 8,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            bgcolor: "#FFFDFD",
            border: "1px dashed #F9D5DC",
            borderRadius: 3,
            maxWidth: 600,
            mx: "auto",
            mt: 4,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#FFF1F3",
              display: "grid",
              placeItems: "center",
              mb: 2,
            }}
          >
            <EventBusyRounded sx={{ color: "#C93F58", fontSize: 32 }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#7A2E3A"
            sx={{ mb: 1 }}
          >
            Tidak Ada Sesi Aktif
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3.5, maxWidth: 400 }}
          >
            Saat ini tidak ada sesi jastip yang sedang aktif berjalan. Sesi yang
            sudah ditutup atau selesai dapat dilihat di menu **Riwayat Sesi**.
          </Typography>
          <AppButton
            variant="contained"
            size="large"
            startIcon={<AddRounded />}
            onClick={() => navigate("/jastip/sessions/create")}
            sx={{
              background: "linear-gradient(135deg, #C93F58 0%, #7A2E3A 100%)",
              boxShadow: "0 8px 25px rgba(201, 63, 88, 0.4)",
              fontWeight: 800,
              px: 4,
              py: 1.5,
              borderRadius: 2.5,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.04)",
                boxShadow: "0 10px 30px rgba(201, 63, 88, 0.6)",
              },
            }}
          >
            Mulai Sesi Jastip Baru
          </AppButton>
        </Box>
      )}

      {/* Confirm Close Session Modal */}
      <ConfirmModal
        open={!!closeTarget}
        title="Tutup Penerimaan Pesanan"
        description={`Apakah Anda yakin ingin menutup sesi jastip tanggal ${closeTarget ? formatDateOnly(closeTarget.order_date) : ""}? Setelah ditutup, member tidak dapat menambah/mengedit pesanan pada sesi ini.`}
        confirmText="Ya, Tutup Sesi"
        tone="warning"
        loading={saving}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleCloseSession}
      />
    </>
  );
};

export default SessionPage;
