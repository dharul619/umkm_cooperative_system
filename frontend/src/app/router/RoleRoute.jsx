import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { CircularProgress, Box } from "@mui/material";

const resolveFallbackRoute = (roleName) => {
  if (roleName === "Jastip Coordinator") return "/jastip/dashboard";
  if (roleName === "Cooperative Member") return "/member/jastip";
  if (roleName === "System Administrator") return "/admin/dashboard";
  return "/dashboard";
};

const RoleRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role_name !== requiredRole) {
    return <Navigate to={resolveFallbackRoute(user?.role_name)} />;
  }

  return children;
};

export default RoleRoute;
