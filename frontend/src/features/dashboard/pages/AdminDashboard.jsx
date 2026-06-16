import GroupRounded from "@mui/icons-material/GroupRounded";
import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import { Grid, Typography } from "@mui/material";
import { AppCard, PageHeader } from "../../../shared/components";

const items = [
  {
    title: "Users",
    description: "Kelola akun dan approval pengguna.",
    icon: GroupRounded,
  },
  {
    title: "Divisions",
    description: "Kelola data divisi organisasi.",
    icon: ApartmentRounded,
  },
  {
    title: "Departments",
    description: "Kelola departemen per divisi.",
    icon: AccountTreeRounded,
  },
  {
    title: "Penjualan",
    description: "Pantau transaksi koperasi.",
    icon: ShoppingCartRounded,
  },
  {
    title: "Produk",
    description: "Kelola katalog dan stok.",
    icon: Inventory2Rounded,
  },
  {
    title: "Jastip",
    description: "Pantau layanan titip beli.",
    icon: StorefrontRounded,
  },
];

const AdminDashboard = () => {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Ringkasan area administrasi sistem koperasi."
      />
      {/* <Grid container spacing={2}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <AppCard sx={{ height: "100%" }}>
                <Icon sx={{ color: "#C93F58", mb: 1 }} />
                <Typography variant="h6" fontWeight={800} color="#7A2E3A">
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.description}
                </Typography>
              </AppCard>
            </Grid>
          );
        })}
      </Grid> */}
    </>
  );
};

export default AdminDashboard;
