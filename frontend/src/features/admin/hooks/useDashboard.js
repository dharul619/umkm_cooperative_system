import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardService } from "../services/dashboardService";
import { userService } from "../../users/services/userService";
import { predictionService } from "../../retail/predictions/services/predictionService";

const normalizeJastipTrend = (rows = []) =>
  rows.map((row) => ({
    ...row,
    sessions: Number(row.sessions || 0),
    revenue: Number(row.revenue || 0),
    profit: Number(row.profit || 0),
    kopi_share: Number(row.kopi_share || 0),
  }));

const normalizeRetailTrend = (rows = []) =>
  rows.map((row) => ({
    ...row,
    transactions: Number(row.transactions || 0),
    revenue: Number(row.revenue || 0),
    profit: Number(row.profit || 0),
    kopi_share: Number(row.kopi_share || 0),
  }));

const normalizeShuComparison = (rows = []) =>
  rows.map((row) => ({
    ...row,
    retail_profit: Number(row.retail_profit || 0),
    retail_kopi_share: Number(row.retail_kopi_share || 0),
    jastip_profit: Number(row.jastip_profit || 0),
    jastip_kopi_share: Number(row.jastip_kopi_share || 0),
  }));

export const useDashboard = (activeTab = 0) => {
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

  const loadedTabsRef = useRef(new Set());
  const lastMonthsRef = useRef(months);

  const fetchTab = useCallback(
    async (tabIndex, { force = false } = {}) => {
      if (lastMonthsRef.current !== months) {
        loadedTabsRef.current.clear();
        lastMonthsRef.current = months;
      }

      const cacheKey = `${months}:${tabIndex}`;
      if (!force && loadedTabsRef.current.has(cacheKey)) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const updateCoreError = (coreResults) => {
          const rejectedCount = coreResults.filter((r) => r.status === "rejected").length;
          if (rejectedCount === coreResults.length && coreResults.length > 0) {
            setError("Gagal mengambil data dashboard. Silakan coba segarkan kembali.");
          } else if (rejectedCount > 0) {
            setError("Sebagian data dashboard gagal dimuat. Silakan coba segarkan kembali.");
          }
        };

        if (tabIndex === 0) {
          const [
            statsData,
            shuData,
            shuComparison,
            retailCategory,
            jastipDivisions,
            usersByDivisionData,
            retailLowStock,
            predictionsData,
          ] = await Promise.allSettled([
            dashboardService.getStats(months),
            dashboardService.getSHUOverview(months),
            dashboardService.getMonthlySHUComparison(months),
            dashboardService.getSalesByCategory(10, months),
            dashboardService.getJastipOrdersByDivision(months),
            dashboardService.getUserCountByDivision(),
            dashboardService.getLowStockProducts(20),
            predictionService.getSummary(),
          ]);

          updateCoreError([
            statsData,
            shuData,
            shuComparison,
            retailCategory,
            jastipDivisions,
            usersByDivisionData,
            retailLowStock,
          ]);

          if (statsData.status === "fulfilled") setStats(statsData.value);
          if (usersByDivisionData.status === "fulfilled") setUsersByDivision(usersByDivisionData.value);
          if (predictionsData.status === "fulfilled") setPredictions(predictionsData.value);

          setShu((prev) => ({
            ...(prev || {}),
            overview: shuData.status === "fulfilled" ? shuData.value : prev?.overview || null,
            comparison:
              shuComparison.status === "fulfilled"
                ? normalizeShuComparison(shuComparison.value)
                : prev?.comparison || [],
          }));

          setRetail((prev) => ({
            ...(prev || {}),
            byCategory: retailCategory.status === "fulfilled" ? retailCategory.value : prev?.byCategory || [],
            lowStock: retailLowStock.status === "fulfilled" ? retailLowStock.value : prev?.lowStock || [],
          }));

          setJastip((prev) => ({
            ...(prev || {}),
            byDivision: jastipDivisions.status === "fulfilled" ? jastipDivisions.value : prev?.byDivision || [],
          }));
        } else if (tabIndex === 1) {
          const [
            jastipData,
            jastipTrend,
            jastipVendors,
            jastipMembers,
            jastipMenus,
            jastipDivisions,
          ] = await Promise.allSettled([
            dashboardService.getJastipOverview(months),
            dashboardService.getJastipRevenueTrendMonthly(months),
            dashboardService.getJastipTopVendors(10, months),
            dashboardService.getJastipTopMembers(10, months),
            dashboardService.getJastipTopMenus(10, months),
            dashboardService.getJastipOrdersByDivision(months),
          ]);

          updateCoreError([
            jastipData,
            jastipTrend,
            jastipVendors,
            jastipMembers,
            jastipMenus,
            jastipDivisions,
          ]);

          setJastip((prev) => ({
            ...(prev || {}),
            overview: jastipData.status === "fulfilled" ? jastipData.value : prev?.overview || null,
            trend: jastipTrend.status === "fulfilled" ? normalizeJastipTrend(jastipTrend.value) : prev?.trend || [],
            topVendors: jastipVendors.status === "fulfilled" ? jastipVendors.value : prev?.topVendors || [],
            topMembers: jastipMembers.status === "fulfilled" ? jastipMembers.value : prev?.topMembers || [],
            topMenus: jastipMenus.status === "fulfilled" ? jastipMenus.value : prev?.topMenus || [],
            byDivision: jastipDivisions.status === "fulfilled" ? jastipDivisions.value : prev?.byDivision || [],
          }));
        } else if (tabIndex === 2) {
          const [
            retailData,
            retailTrend,
            retailSubcategory,
            retailProducts,
            retailLowStock,
            retailInventorySubcategory,
            predictionsData,
          ] = await Promise.allSettled([
            dashboardService.getRetailOverview(months),
            dashboardService.getRetailSalesTrendMonthly(months),
            dashboardService.getSalesBySubcategory(10, months),
            dashboardService.getTopSellingProducts(10, months),
            dashboardService.getLowStockProducts(20),
            dashboardService.getInventoryBySubcategory(),
            predictionService.getSummary(),
          ]);

          updateCoreError([
            retailData,
            retailTrend,
            retailSubcategory,
            retailProducts,
            retailLowStock,
            retailInventorySubcategory,
          ]);

          if (predictionsData.status === "fulfilled") setPredictions(predictionsData.value);

          setRetail((prev) => ({
            ...(prev || {}),
            overview: retailData.status === "fulfilled" ? retailData.value : prev?.overview || null,
            trend: retailTrend.status === "fulfilled" ? normalizeRetailTrend(retailTrend.value) : prev?.trend || [],
            bySubcategory:
              retailSubcategory.status === "fulfilled" ? retailSubcategory.value : prev?.bySubcategory || [],
            topProducts: retailProducts.status === "fulfilled" ? retailProducts.value : prev?.topProducts || [],
            lowStock: retailLowStock.status === "fulfilled" ? retailLowStock.value : prev?.lowStock || [],
            inventoryBySubcategory:
              retailInventorySubcategory.status === "fulfilled"
                ? retailInventorySubcategory.value
                : prev?.inventoryBySubcategory || [],
          }));
        } else if (tabIndex === 3) {
          const [statsData, allUsersData] = await Promise.allSettled([
            dashboardService.getStats(months),
            userService.getAll(),
          ]);

          updateCoreError([statsData, allUsersData]);

          if (statsData.status === "fulfilled") setStats(statsData.value);
          if (allUsersData.status === "fulfilled") {
            const fetchedUsers = Array.isArray(allUsersData.value) ? allUsersData.value : [];
            setPendingUsers(fetchedUsers.filter((u) => u.status === "pending"));
          }
        }

        loadedTabsRef.current.add(cacheKey);
      } catch (err) {
        setError(err.message || "Gagal mengambil data dashboard");
      } finally {
        setLoading(false);
      }
    },
    [months],
  );

  const approveUser = useCallback(
    async (id) => {
      try {
        await userService.approve(id);
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
        const updatedStats = await dashboardService.getStats(months);
        setStats(updatedStats);
      } catch (err) {
        console.error("Gagal menyetujui user:", err);
      }
    },
    [months],
  );

  const rejectUser = useCallback(
    async (id) => {
      try {
        await userService.reject(id);
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
        const updatedStats = await dashboardService.getStats(months);
        setStats(updatedStats);
      } catch (err) {
        console.error("Gagal menolak user:", err);
      }
    },
    [months],
  );

  const refresh = useCallback(() => {
    loadedTabsRef.current.clear();
    return fetchTab(activeTab, { force: true });
  }, [activeTab, fetchTab]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        fetchTab(activeTab);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeTab, fetchTab]);

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
    refresh,
  };
};
