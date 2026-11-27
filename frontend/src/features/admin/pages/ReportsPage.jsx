import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import ShoppingBagRounded from "@mui/icons-material/ShoppingBagRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";

const menuItems = {
  "Warung Retail": [
    { label: "Penjualan Retail", path: "/admin/reports/retail/penjualan", icon: PointOfSaleRounded },
    { label: "Daftar Transaksi Retail", path: "/admin/reports/retail/transaksi", icon: ReceiptLongRounded },
    { label: "Stok Retail", path: "/admin/reports/retail/stok", icon: Inventory2Rounded },
    { label: "Pembelian Retail", path: "/admin/reports/retail/pembelian", icon: ShoppingBagRounded },
    { label: "Pembagian SHU", path: "/admin/reports/retail/shu", icon: GroupsRounded },
    { label: "Audit Shift & Z-Report", path: "/admin/reports/retail/shifts", icon: FactCheckRounded },
    { label: "Tutup Hari (Day Close)", path: "/admin/reports/retail/day-close", icon: EventAvailableRounded },
  ],
  "Jastip": [
    { label: "Pesanan Jastip by Sesi", path: "/admin/reports/jastip/sesi", icon: ReceiptLongRounded },
    { label: "Pesanan Jastip by Vendor", path: "/admin/reports/jastip/vendor", icon: StorefrontRounded },
    { label: "Pesanan Jastip by Member", path: "/admin/reports/jastip/member", icon: GroupsRounded },
    { label: "Pembayaran Jastip", path: "/admin/reports/jastip/pembayaran", icon: PaymentsRounded },
    { label: "Pembagian SHU", path: "/admin/reports/jastip/shu", icon: GroupsRounded },
  ],
};

const ReportsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box>
      <PageHeader
        title="Laporan"
        subtitle="Rekapitulasi transaksi, stok, dan pembagian SHU unit usaha"
        icon={AssessmentRounded}
      />

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        {/* Sidebar Menu */}
        <Box
          sx={{
            width: { xs: "100%", md: 280 },
            flexShrink: 0,
          }}
        >
          {Object.entries(menuItems).map(([group, items]) => (
            <Box key={group} sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
                sx={{ px: 2, textTransform: "uppercase", letterSpacing: 1 }}
              >
                {group}
              </Typography>
              <List disablePadding sx={{ mt: 1 }}>
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <ListItemButton
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        backgroundColor: isActive ? "#FFF1F3" : "transparent",
                        color: isActive ? "#C93F58" : "#61414A",
                        "&:hover": {
                          backgroundColor: "#FFF6F8",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        {/* Report Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {location.pathname === "/admin/reports" || location.pathname === "/admin/reports/" ? (
            <Box
              sx={{
                p: 4,
                border: "2px dashed #F9D5DC",
                borderRadius: 2,
                textAlign: "center",
                backgroundColor: "#FFFBFC",
              }}
            >
              <AssessmentRounded sx={{ fontSize: 48, color: "#F9D5DC", mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="#7A2E3A" gutterBottom>
                Pilih Laporan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pilih jenis laporan dari menu di samping untuk melihat dan mengunduh laporan.
              </Typography>
            </Box>
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ReportsPage;
