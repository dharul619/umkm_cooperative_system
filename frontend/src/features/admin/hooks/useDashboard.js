import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "../services/dashboardService";
import { userService } from "../../users/services/userService";
import { predictionService } from "../../retail/predictions/services/predictionService";

export const useDashboard = () => {
  const [months, setMonths] = useState(1);
  const [stats, setStats] = useState(null);
  const [jastip, setJastip] = useState(null);
  const [retail, setRetail] = useState(null);
  const [shu, setShu] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [usersByDivision, setUsersByDivision] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        statsData,
        jastipData,
        jastipTrend,
        jastipVendors,
        jastipMembers,
        jastipMenus,
        retailData,
        retailTrend,
        retailCategory,
        retailSubcategory,
        retailProducts,
        retailLowStock,
        shuData,
        shuComparison,
        retailInventorySubcategory,
        jastipDivisions,
        allUsersData,
        usersByDivisionData,
        predictionsData,
      ] = await Promise.allSettled([
        dashboardService.getStats(months),
        dashboardService.getJastipOverview(months),
        dashboardService.getJastipRevenueTrendMonthly(months),
        dashboardService.getJastipTopVendors(10, months),
        dashboardService.getJastipTopMembers(10, months),
        dashboardService.getJastipTopMenus(10, months),
        dashboardService.getRetailOverview(months),
        dashboardService.getRetailSalesTrendMonthly(months),
        dashboardService.getSalesByCategory(10, months),
        dashboardService.getSalesBySubcategory(10, months),
        dashboardService.getTopSellingProducts(10, months),
        dashboardService.getLowStockProducts(20),
        dashboardService.getSHUOverview(months),
        dashboardService.getMonthlySHUComparison(months),
        dashboardService.getInventoryBySubcategory(),
        dashboardService.getJastipOrdersByDivision(months),
        userService.getAll(),
        dashboardService.getUserCountByDivision(),
        predictionService.getSummary(),
      ]);

      setStats(statsData.status === "fulfilled" ? statsData.value : null);
      setUsersByDivision(usersByDivisionData.status === "fulfilled" ? usersByDivisionData.value : []);
      setPredictions(predictionsData.status === "fulfilled" ? predictionsData.value : null);

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
        byCategory: retailCategory.status === "fulfilled" ? retailCategory.value : [],
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
    jastip,
    retail,
    shu,
    predictions,
    pendingUsers,
    usersByDivision,
    approveUser,
    rejectUser,
    loading,
    error,
    months,
    setMonths,
    refresh: fetchAll,
  };
};
