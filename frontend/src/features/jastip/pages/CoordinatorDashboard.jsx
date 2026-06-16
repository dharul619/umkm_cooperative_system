import { Box, Grid, Typography } from "@mui/material";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import RestaurantMenuRounded from "@mui/icons-material/RestaurantMenuRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import { AppCard, PageHeader } from "../../../shared/components";

const cards = [
  {
    title: "Open Session",
    description: "Buka sesi jastip, atur tanggal, dan siapkan penerimaan order.",
    icon: StorefrontRounded,
  },
  {
    title: "Menus",
    description: "Kelola menu harian yang tersedia untuk anggota.",
    icon: RestaurantMenuRounded,
  },
  {
    title: "Orders",
    description: "Pantau pesanan masuk dan status pemrosesan.",
    icon: ReceiptLongRounded,
  },
  {
    title: "Payments",
    description: "Konfirmasi pembayaran tunai dan monitor pembayaran daring.",
    icon: PaymentsRounded,
  },
  {
    title: "Vendor Dispatch",
    description: "Siapkan rekap order per vendor untuk pengiriman ke WhatsApp.",
    icon: LocalShippingRounded,
  },
];

const CoordinatorDashboard = () => {
  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Coordinator Workspace"
        description="Area kerja untuk membuka sesi jastip, mengelola menu, memantau order, dan mengonfirmasi pembayaran."
      />

      <Grid container spacing={2}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Grid item xs={12} sm={6} lg={4} key={card.title}>
              <AppCard sx={{ height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#FFF1F3",
                      color: "#C93F58",
                      flexShrink: 0,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A">
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {card.description}
                    </Typography>
                  </Box>
                </Box>
              </AppCard>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

export default CoordinatorDashboard;
