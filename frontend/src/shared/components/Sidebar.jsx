import { useState } from "react";
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
  Collapse,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";
import RestaurantMenuRounded from "@mui/icons-material/RestaurantMenuRounded";
import StoreMallDirectoryRounded from "@mui/icons-material/StoreMallDirectoryRounded";
import CooperativeLogo from "./CooperativeLogo";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRounded from "@mui/icons-material/PaymentsRounded";
import ShoppingBagRounded from "@mui/icons-material/ShoppingBagRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import ViewListRounded from "@mui/icons-material/ViewListRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import BusinessRounded from "@mui/icons-material/BusinessRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import ReceiptRounded from "@mui/icons-material/ReceiptRounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import HistoryEduRounded from "@mui/icons-material/HistoryEduRounded";
import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import { useAuth } from "../../features/auth/hooks/useAuth";

export const drawerWidth = 264;

const roleItems = {
  "System Administrator": [
    { label: "Dashboard", path: "/admin/dashboard", icon: DashboardRounded },
    {
      label: "Users Management",
      icon: GroupRounded,
      children: [
        { label: "Users", path: "/admin/users", icon: GroupRounded },
        {
          label: "Divisions",
          path: "/admin/master/divisions",
          icon: ApartmentRounded,
        },
        {
          label: "Departments",
          path: "/admin/master/departments",
          icon: AccountTreeRounded,
        },
      ],
    },
    { label: "Laporan", path: "/admin/reports", icon: AssessmentRounded },
    { label: "Prediksi & Restok", path: "/admin/predictions", icon: TrendingUpRounded },
    {
      label: "Log Aktivitas",
      path: "/admin/activity-logs",
      icon: HistoryEduRounded,
    },
  ],
  "Jastip Coordinator": [
    { label: "Dashboard", path: "/jastip/dashboard", icon: DashboardRounded },
    { label: "Sesi Aktif", path: "/jastip/sessions", icon: ViewListRounded },
    { label: "Orders", path: "/jastip/orders", icon: ReceiptLongRounded },

    {
      label: "Vendors",
      path: "/jastip/master/vendors",
      icon: StoreMallDirectoryRounded,
    },
    {
      label: "Menus",
      path: "/jastip/master/menus",
      icon: RestaurantMenuRounded,
    },
    // { label: "Payments", path: "/jastip/payments", icon: PaymentsRounded },
    {
      label: "Riwayat Sesi",
      path: "/jastip/sessions/history",
      icon: HistoryRounded,
    },
  ],
  "Business Coordinator": [
    { label: "Dashboard", path: "/retail/dashboard", icon: DashboardRounded },
    {
      label: "Master Produk",
      icon: CategoryRounded,
      children: [
        {
          label: "Kategori",
          path: "/retail/master/categories",
          icon: CategoryRounded,
        },
        {
          label: "Subkategori",
          path: "/retail/master/subcategories",
          icon: AccountTreeRounded,
        },
        {
          label: "Brand",
          path: "/retail/master/brands",
          icon: BusinessRounded,
        },
        {
          label: "Produk",
          path: "/retail/master/products",
          icon: Inventory2Rounded,
        },
      ],
    },
    {
      label: "Supplier",
      path: "/retail/master/suppliers",
      icon: LocalShippingRounded,
    },
    {
      label: "Pembelian",
      path: "/retail/master/purchases",
      icon: ReceiptRounded,
    },
    {
      label: "Penjualan",
      path: "/retail/master/sales",
      icon: PointOfSaleRounded,
    },
    { label: "Inventory", path: "/retail/master/inventory", icon: TuneRounded },
    { label: "Prediksi & Restok", path: "/retail/master/predictions", icon: TrendingUpRounded },
  ],
  "Cooperative Member": [
    { label: "Jastip Menu", path: "/member/jastip", icon: ShoppingBagRounded },
    { label: "Riwayat Order", path: "/member/orders", icon: HistoryRounded },
  ],
};

const SidebarContent = ({ items = [], onNavigate }) => {
  const [openMenus, setOpenMenus] = useState({
    "Users Management": true, // Default open for admin
    "Master Produk": true, // Default open for Business Coordinator
  });

  const handleToggle = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <Box sx={{ height: "100%", backgroundColor: "#FFFFFF" }}>
      <Toolbar sx={{ minHeight: 72, px: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <CooperativeLogo size={40} />
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={850}
              color="#C93F58"
              sx={{ lineHeight: 1.1 }}
            >
              SIKOMU
            </Typography>
            <Typography
              variant="caption"
              display="block"
              sx={{ fontSize: 9, opacity: 0.8, color: "text.secondary" }}
            >
              Koperasi Multi-Unit
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#F9D5DC" }} />
      <List sx={{ p: 1.5 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isExpandable = !!item.children;
          const isOpen = !!openMenus[item.label];

          if (isExpandable) {
            return (
              <Box key={item.label} sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleToggle(item.label)}
                  sx={{
                    borderRadius: 1.5,
                    color: "#61414A",
                    "&:hover": { backgroundColor: "#FFF6F8" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "#8A6A72" }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }}
                  />
                  {isOpen ? (
                    <ExpandLessRounded sx={{ color: "#8A6A72" }} />
                  ) : (
                    <ExpandMoreRounded sx={{ color: "#8A6A72" }} />
                  )}
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List
                    component="div"
                    disablePadding
                    sx={{ pl: 3.5, mt: 0.5 }}
                  >
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <ListItemButton
                          key={child.path}
                          component={NavLink}
                          to={child.path}
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
                          <ListItemIcon sx={{ minWidth: 32, color: "#8A6A72" }}>
                            <ChildIcon sx={{ fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

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
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

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
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            borderRight: "1px solid #F9D5DC",
          },
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
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #F9D5DC",
          },
        }}
        open
      >
        <SidebarContent items={items} />
      </Drawer>
    </>
  );
};

export default Sidebar;
