import { useCallback, useEffect, useState } from "react";
import { salesService } from "../services/salesService";

export const usePosShift = () => {
  const [activeShiftData, setActiveShiftData] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [savingShift, setSavingShift] = useState(false);
  const [shiftError, setShiftError] = useState("");

  const fetchActiveShift = useCallback(async () => {
    try {
      setLoadingShift(true);
      setShiftError("");
      const data = await salesService.getActiveShift();
      setActiveShiftData(data);
      return data;
    } catch (err) {
      setShiftError(err.message || "Gagal memuat shift kasir");
      return null;
    } finally {
      setLoadingShift(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActiveShift();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchActiveShift]);

  const openShift = async (payload) => {
    try {
      setSavingShift(true);
      setShiftError("");
      const res = await salesService.openShift(payload);
      setActiveShiftData(res.data || null);
      return res;
    } catch (err) {
      setShiftError(err.message || "Gagal membuka shift kasir");
      throw err;
    } finally {
      setSavingShift(false);
    }
  };

  const closeShift = async (shiftId, payload) => {
    try {
      setSavingShift(true);
      setShiftError("");
      const res = await salesService.closeShift(shiftId, payload);
      setActiveShiftData(null);
      return res;
    } catch (err) {
      setShiftError(err.message || "Gagal menutup shift kasir");
      throw err;
    } finally {
      setSavingShift(false);
    }
  };

  return {
    activeShiftData,
    activeShift: activeShiftData?.shift || null,
    loadingShift,
    savingShift,
    shiftError,
    refreshActiveShift: fetchActiveShift,
    openShift,
    closeShift,
  };
};
