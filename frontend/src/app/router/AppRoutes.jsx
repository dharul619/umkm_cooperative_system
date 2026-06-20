import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../../features/dashboard/pages/AdminDashboard";
import CoordinatorDashboard from "../../features/jastip/pages/CoordinatorDashboard";
import SessionPage from "../../features/jastip/pages/SessionPage";
import CreateSessionPage from "../../features/jastip/pages/CreateSessionPage";
import SessionDetailPage from "../../features/jastip/pages/SessionDetailPage";
import OrdersPage from "../../features/jastip/pages/OrdersPage";
import MemberJastipPage from "../../features/jastip/pages/MemberJastipPage";
import MemberOrderHistoryPage from "../../features/jastip/pages/MemberOrderHistoryPage";
import PaymentPage from "../../features/jastip/pages/PaymentPage";
import TransactionProofPage from "../../features/jastip/pages/TransactionProofPage";
import UserPages from "../../features/users/pages/UserPages";
import DivisionPage from "../../features/jastip/master-data/pages/DivisionPage";
import DepartmentPage from "../../features/jastip/master-data/pages/DepartmentPage";
import VendorPage from "../../features/jastip/master-data/pages/VendorPage";
import MenuPage from "../../features/jastip/master-data/pages/MenuPage";
import CategoryPage from "../../features/retail/master-data/pages/CategoryPage";
import SubcategoryPage from "../../features/retail/master-data/pages/SubcategoryPage";
import BrandPage from "../../features/retail/master-data/pages/BrandPage";
import ProductPage from "../../features/retail/master-data/pages/ProductPage";
import SupplierPage from "../../features/retail/master-data/pages/SupplierPage";
import PurchasePage from "../../features/retail/purchases/pages/PurchasePage";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { CircularProgress, Box } from "@mui/material";

const resolveLandingPath = (roleName) => {
  if (roleName === "Jastip Coordinator") return "/jastip/dashboard";
  if (roleName === "Cooperative Member") return "/member/jastip";
  if (roleName === "Business Coordinator") return "/retail/master/categories";
  if (roleName === "System Administrator") return "/admin/dashboard";
  return "/dashboard";
};

const AppRoutes = () => {
  const { isLoggedIn, loading, user } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const landingPath = resolveLandingPath(user?.role_name);

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to={landingPath} replace /> : <LoginPage />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to={landingPath} replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Navigate to={landingPath} replace /></ProtectedRoute>} />

      <Route path="/admin" element={<RoleRoute requiredRole="System Administrator"><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserPages />} />
        <Route path="master/divisions" element={<DivisionPage />} />
        <Route path="master/departments" element={<DepartmentPage />} />
      </Route>

      <Route path="/jastip" element={<RoleRoute requiredRole="Jastip Coordinator"><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/jastip/dashboard" replace />} />
        <Route path="dashboard" element={<CoordinatorDashboard />} />
        <Route path="sessions" element={<SessionPage />} />
        <Route path="sessions/create" element={<CreateSessionPage />} />
        <Route path="sessions/:id" element={<SessionDetailPage />} />
        <Route path="open-session" element={<Navigate to="/jastip/sessions" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="master/vendors" element={<VendorPage />} />
        <Route path="master/menus" element={<MenuPage />} />
      </Route>

      <Route path="/retail" element={<RoleRoute requiredRole="Business Coordinator"><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/retail/master/categories" replace />} />
        <Route path="dashboard" element={<Navigate to="/retail/master/categories" replace />} />
        <Route path="master/categories" element={<CategoryPage />} />
        <Route path="master/subcategories" element={<SubcategoryPage />} />
        <Route path="master/brands" element={<BrandPage />} />
        <Route path="master/products" element={<ProductPage />} />
        <Route path="master/suppliers" element={<SupplierPage />} />
        <Route path="master/purchases" element={<PurchasePage />} />
      </Route>

      <Route path="/member" element={<RoleRoute requiredRole="Cooperative Member"><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="/member/jastip" replace />} />
        <Route path="jastip" element={<MemberJastipPage />} />
        <Route path="orders" element={<MemberOrderHistoryPage />} />
        <Route path="payments/:orderId" element={<PaymentPage />} />
        <Route path="payments/:orderId/proof" element={<TransactionProofPage />} />
      </Route>

      <Route path="/" element={<Navigate to={isLoggedIn ? landingPath : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
