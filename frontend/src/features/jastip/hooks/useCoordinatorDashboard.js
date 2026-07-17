import { useEffect, useState } from "react";
import { jastipService } from "../services/jastipService";

export const useCoordinatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshData = async () => {
    try {
      const data = await jastipService.getCoordinatorStats();
      setStats(data);
    } catch (err) {
      console.error("refreshData error:", err);
      setError(err.response?.data?.message || err.message || "Gagal memuat statistik koordinator");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    jastipService.getCoordinatorStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        console.error("Initial load error:", err);
        if (active) setError(err.response?.data?.message || err.message || "Gagal memuat statistik koordinator");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError("");
    await refreshData();
  };

  const handleUpdateSessionStatus = async (sessionId, status) => {
    try {
      setActionLoading(true);
      setError("");
      await jastipService.updateSessionStatus(sessionId, status);
      await refreshData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Gagal mengubah status sesi";
      setError(errMsg);
      throw new Error(errMsg, { cause: err });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setActionLoading(true);
      setError("");
      await jastipService.settlePayment(paymentId);
      await refreshData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Gagal memproses persetujuan pembayaran";
      setError(errMsg);
      throw new Error(errMsg, { cause: err });
    } finally {
      setActionLoading(false);
    }
  };

  return {
    stats,
    loading,
    actionLoading,
    error,
    refresh: handleRefresh,
    updateSessionStatus: handleUpdateSessionStatus,
    approvePayment: handleApprovePayment,
  };
};
