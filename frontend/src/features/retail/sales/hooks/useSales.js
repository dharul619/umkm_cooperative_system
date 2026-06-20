import { useCallback, useEffect, useState } from "react";
import { salesService } from "../services/salesService";

export const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await salesService.getAll();
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data penjualan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const createSale = async (payload) => {
    try {
      setSaving(true);
      setError("");
      const response = await salesService.create(payload);
      await fetchSales();
      return response;
    } catch (err) {
      setError(err.message || "Gagal membuat penjualan");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const getSale = async (id) => salesService.getById(id);

  return {
    sales,
    loading,
    saving,
    error,
    refresh: fetchSales,
    createSale,
    getSale,
  };
};
