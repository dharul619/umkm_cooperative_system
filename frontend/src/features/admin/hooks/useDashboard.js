import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "../services/dashboardService";
import { userService } from "../../users/services/userService";

export const useDashboard = () => {
  const [months, setMonths] = useState(12);
  const [stats, setStats] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [activitySummary, setActivitySummary] = useState([]);
  const [jastip, setJastip] = useState(null);
  const [retail, setRetail] = useState(null);
  const [shu, setShu] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        statsData,
        growthData,
        activityData,
        jastipData,
        jastipTrend,
        jastipVendors,
        jastipMembers,
        jastipMenus,
        retailData,
        retailTrend,
        retailSubcategory,
        retailProducts,
        retailLowStock,
        shuData,
        shuComparison,
        retailInventorySubcategory,
        jastipDivisions,
        paymentsData,
        allUsersData,
      ] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getUserGrowth(months),
        dashboardService.getActivitySummary(10),
        dashboardService.getJastipOverview(),
        dashboardService.getJastipRevenueTrendMonthly(months),
        dashboardService.getJastipTopVendors(10),
        dashboardService.getJastipTopMembers(10),
        dashboardService.getJastipTopMenus(10),
        dashboardService.getRetailOverview(),
        dashboardService.getRetailSalesTrendMonthly(months),
        dashboardService.getSalesBySubcategory(10),
        dashboardService.getTopSellingProducts(10),
        dashboardService.getLowStockProducts(20),
        dashboardService.getSHUOverview(),
        dashboardService.getMonthlySHUComparison(months),
        dashboardService.getInventoryBySubcategory(),
        dashboardService.getJastipOrdersByDivision(),
        dashboardService.getPaymentMethodStats(),
        userService.getAll(),
      ]);

      setStats(statsData.status === "fulfilled" ? statsData.value : null);
      setUserGrowth(growthData.status === "fulfilled" ? growthData.value : []);
      setActivitySummary(activityData.status === "fulfilled" ? activityData.value : []);
      setPaymentMethods(paymentsData.status === "fulfilled" ? paymentsData.value : []);

      const fetchedUsers = allUsersData.status === "fulfilled" ? allUsersData.value : [];
      setPendingUsers(fetchedUsers.filter((u) => u.status === "pending"));

      setJastip({
        overview: jastipData.status === "fulfilled" ? jastipData.value : null,
        trend: jastipTrend.status === "fulfilled" ? jastipTrend.value : [],
        topVendors: jastipVendors.status === "fulfilled" ? jastipVendors.value : [],
        topMembers: jastipMembers.status === "fulfilled" ? jastipMembers.value : [],
        topMenus: jastipMenus.status === "fulfilled" ? jastipMenus.value : [],
        byDivision: jastipDivisions.status === "fulfilled" ? jastipDivisions.value : [],
      });

      setRetail({
        overview: retailData.status === "fulfilled" ? retailData.value : null,
        trend: retailTrend.status === "fulfilled" ? retailTrend.value : [],
        bySubcategory: retailSubcategory.status === "fulfilled" ? retailSubcategory.value : [],
        topProducts: retailProducts.status === "fulfilled" ? retailProducts.value : [],
        lowStock: retailLowStock.status === "fulfilled" ? retailLowStock.value : [],
        inventoryBySubcategory: retailInventorySubcategory.status === "fulfilled" ? retailInventorySubcategory.value : [],
      });

      setShu({
        overview: shuData.status === "fulfilled" ? shuData.value : null,
        comparison: shuComparison.status === "fulfilled" ? shuComparison.value : [],
      });
    } catch (err) {
      setError(err.message || "Gagal mengambil data dashboard");
    } finally {
      setLoading(false);
    }
  }, [months]);

  const approveUser = useCallback(async (id) => {
    try {
      await userService.approve(id);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      // Refresh general stats to update pending counter
      const updatedStats = await dashboardService.getStats();
      setStats(updatedStats);
    } catch (err) {
      console.error("Gagal menyetujui user:", err);
    }
  }, []);

  const rejectUser = useCallback(async (id) => {
    try {
      await userService.reject(id);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      const updatedStats = await dashboardService.getStats();
      setStats(updatedStats);
    } catch (err) {
      console.error("Gagal menolak user:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        fetchAll();
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchAll]);

  return {
    stats,
    userGrowth,
    activitySummary,
    jastip,
    retail,
    shu,
    paymentMethods,
    pendingUsers,
    approveUser,
    rejectUser,
    loading,
    error,
    months,
    setMonths,
    refresh: fetchAll,
  };
};
