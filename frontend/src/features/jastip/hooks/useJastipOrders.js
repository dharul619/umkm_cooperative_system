import { useCallback, useEffect, useState } from "react";
import { jastipService } from "../services/jastipService";

export const useJastipOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await jastipService.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || "Gagal mengambil data order jastip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
  };
};
