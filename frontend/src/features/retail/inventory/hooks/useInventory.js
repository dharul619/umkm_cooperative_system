import { useCallback, useEffect, useState } from "react";
import { inventoryService } from "../services/inventoryService";

export const useInventory = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await inventoryService.getStocks();
      setStocks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data stok");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const createBeginningStock = async (payload) => {
    try {
      setSaving(true);
      setError("");
      const response = await inventoryService.createBeginningStock(payload);
      await fetchStocks();
      return response;
    } catch (err) {
      setError(err.message || "Gagal menyimpan stok awal");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const createAdjustment = async (payload) => {
    try {
      setSaving(true);
      setError("");
      const response = await inventoryService.createAdjustment(payload);
      await fetchStocks();
      return response;
    } catch (err) {
      setError(err.message || "Gagal menyimpan adjustment stok");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const getStockCard = async (productId) => inventoryService.getStockCard(productId);

  return {
    stocks,
    loading,
    saving,
    error,
    refresh: fetchStocks,
    createBeginningStock,
    createAdjustment,
    getStockCard,
  };
};
