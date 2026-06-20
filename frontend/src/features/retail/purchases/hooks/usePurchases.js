import { useCallback, useEffect, useState } from "react";
import { purchaseService } from "../services/purchaseService";

export const usePurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await purchaseService.getAll();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data pembelian");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const createPurchase = async (payload) => {
    try {
      setSaving(true);
      setError("");
      const response = await purchaseService.create(payload);
      await fetchPurchases();
      return response?.message || "Pembelian berhasil dibuat";
    } catch (err) {
      setError(err.message || "Gagal membuat pembelian");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const getPurchase = async (id) => purchaseService.getById(id);

  return {
    purchases,
    loading,
    saving,
    error,
    refresh: fetchPurchases,
    createPurchase,
    getPurchase,
  };
};
