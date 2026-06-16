import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { drawerWidth } from "./Sidebar";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.username || "Administrator";
  const roleName = user?.role_name || "Admin";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        color: "#7A2E3A",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #F9D5DC",
      }}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: "none" } }}
        >
          <MenuRounded />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Selamat datang
          </Typography>
          <Typography variant="body1" fontWeight={800}>
            {displayName}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={800}
              noWrap
              sx={{ maxWidth: 180 }}
            >
              {roleName}
            </Typography>
            {/* <Chip
              label={roleName}
              size="small"
              sx={{
                height: 22,
                mt: 0.25,
                color: "#C93F58",
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: "#FFF1F3",
                border: "1px solid #F9D5DC",
              }}
            /> */}
          </Box>
          <Avatar sx={{ bgcolor: "#FFF1F3", color: "#C93F58" }}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Tooltip title="Keluar">
            <IconButton color="inherit" onClick={logout}>
              <LogoutRounded />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
