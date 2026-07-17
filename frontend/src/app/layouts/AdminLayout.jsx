import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import Navbar from "../../shared/components/Navbar";
import Sidebar, { drawerWidth } from "../../shared/components/Sidebar";

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Toolbar sx={{ minHeight: 72 }} />
        <Box sx={{ p: { xs: 2, md: 3 }, width: "100%", boxSizing: "border-box" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
