import { useCallback, useEffect, useRef, useState } from "react";
import { salesService } from "../services/salesService";

const DEFAULT_LIMIT = 20;

export const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({ search: "" });
  const requestIdRef = useRef(0);
  const searchTimerRef = useRef(null);

  const fetchSales = useCallback(async (page = 1, activeFilters = { search: "" }) => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError("");
      const trimmedSearch = activeFilters?.search?.trim();
      const params = {
        page,
        limit: DEFAULT_LIMIT,
        ...(trimmedSearch ? { search: trimmedSearch } : {}),
      };
      const res = await salesService.getAll(params);
      if (requestId !== requestIdRef.current) return;

      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSales(rows);

      const meta = res?.pagination;
      setPagination({
        page: meta?.page ?? page,
        limit: meta?.limit ?? DEFAULT_LIMIT,
        total: meta?.total ?? rows.length,
        totalPages: meta?.totalPages ?? 1,
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Gagal mengambil data penjualan");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSales(1, { search: "" });
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [fetchSales]);

  const updateSearch = (value) => {
    const nextFilters = { ...filters, search: value };
    setFilters(nextFilters);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      fetchSales(1, nextFilters);
    }, 250);
  };

  const changePage = (newPage) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    fetchSales(newPage, filters);
  };

  const createSale = async (payload) => {
    try {
      setSaving(true);
      setError("");
      const response = await salesService.create(payload);
      await fetchSales(1, filters);
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
    pagination,
    filters,
    updateSearch,
    changePage,
    refresh: () => fetchSales(pagination.page, filters),
    createSale,
    getSale,
  };
};
