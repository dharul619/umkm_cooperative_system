import { NavLink } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";
import RestaurantMenuRounded from "@mui/icons-material/RestaurantMenuRounded";
import StoreMallDirectoryRounded from "@mui/icons-material/StoreMallDirectoryRounded";
import StorageRounded from "@mui/icons-material/StorageRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import ShoppingBagRounded from "@mui/icons-material/ShoppingBagRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import ViewListRounded from "@mui/icons-material/ViewListRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import BusinessRounded from "@mui/icons-material/BusinessRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import ReceiptRounded from "@mui/icons-material/ReceiptRounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import { useAuth } from "../../features/auth/hooks/useAuth";

export const drawerWidth = 264;

const roleItems = {
  "System Administrator": [
    { label: "Dashboard", path: "/admin/dashboard", icon: DashboardRounded },
    { label: "Users", path: "/admin/users", icon: GroupRounded },
    { label: "Divisions", path: "/admin/master/divisions", icon: ApartmentRounded },
    { label: "Departments", path: "/admin/master/departments", icon: AccountTreeRounded },
  ],
  "Jastip Coordinator": [
    { label: "Dashboard", path: "/jastip/dashboard", icon: DashboardRounded },
    { label: "Session", path: "/jastip/sessions", icon: ViewListRounded },
    { label: "Vendors", path: "/jastip/master/vendors", icon: StoreMallDirectoryRounded },
    { label: "Menus", path: "/jastip/master/menus", icon: RestaurantMenuRounded },
    { label: "Orders", path: "/jastip/orders", icon: ReceiptLongRounded },
    { label: "Payments", path: "/jastip/payments", icon: PaymentsRounded },
    { label: "Vendor Dispatch", path: "/jastip/vendor-dispatch", icon: LocalShippingRounded },
  ],
  "Business Coordinator": [
    { label: "Kategori", path: "/retail/master/categories", icon: CategoryRounded },
    { label: "Subkategori", path: "/retail/master/subcategories", icon: AccountTreeRounded },
    { label: "Brand", path: "/retail/master/brands", icon: BusinessRounded },
    { label: "Produk", path: "/retail/master/products", icon: Inventory2Rounded },
    { label: "Supplier", path: "/retail/master/suppliers", icon: LocalShippingRounded },
    { label: "Pembelian", path: "/retail/master/purchases", icon: ReceiptRounded },
    { label: "Penjualan", path: "/retail/master/sales", icon: PointOfSaleRounded },
  ],
  "Cooperative Member": [
    { label: "Jastip Menu", path: "/member/jastip", icon: ShoppingBagRounded },
    { label: "Riwayat Order", path: "/member/orders", icon: HistoryRounded },
  ],
};

const SidebarContent = ({ items = [], onNavigate }) => (
  <Box sx={{ height: "100%", backgroundColor: "#FFFFFF" }}>
    <Toolbar sx={{ minHeight: 72, px: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "grid", placeItems: "center", color: "#FFFFFF", backgroundColor: "#E85D75" }}>
          <StorageRounded />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A">
            Koperasi 245
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin Panel
          </Typography>
        </Box>
      </Box>
    </Toolbar>
    <Divider sx={{ borderColor: "#F9D5DC" }} />
    <List sx={{ p: 1.5 }}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            onClick={onNavigate}
            sx={{
              mb: 0.5,
              borderRadius: 1.5,
              color: "#61414A",
              "&.active": {
                color: "#C93F58",
                backgroundColor: "#FFF1F3",
                "& .MuiListItemIcon-root": { color: "#C93F58" },
              },
              "&:hover": { backgroundColor: "#FFF6F8" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "#8A6A72" }}>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
          </ListItemButton>
        );
      })}
    </List>
  </Box>
);

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user } = useAuth();
  const items = roleItems[user?.role_name] || [];

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth, borderRight: "1px solid #F9D5DC" },
        }}
      >
        <SidebarContent items={items} onNavigate={onClose} />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", borderRight: "1px solid #F9D5DC" },
        }}
        open
      >
        <SidebarContent items={items} />
      </Drawer>
    </>
  );
};

export default Sidebar;
