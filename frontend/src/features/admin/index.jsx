import { Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import ActivityLogPage from "./pages/ActivityLogPage";
import ReportsPage from "./pages/ReportsPage";
import UserPages from "../../users/pages/UserPages";

const AdminModule = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<UserPages />} />
      <Route path="/activity-logs" element={<ActivityLogPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
};

export default AdminModule;
