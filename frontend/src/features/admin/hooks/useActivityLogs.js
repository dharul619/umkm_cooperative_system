import { useCallback, useEffect, useState } from "react";
import { activityLogService } from "../services/activityLogService";

export const useActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    user_id: "",
    from: "",
    to: "",
  });

  const fetchLogs = useCallback(async (page = 1, filtersData = filters) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: pagination.limit,
        ...filtersData,
      };

      // Remove empty filters
      if (!params.user_id) delete params.user_id;
      if (!params.from) delete params.from;
      if (!params.to) delete params.to;

      const response = await activityLogService.getAll(params);

      setLogs(response.data || []);
      setPagination((prev) => ({
        ...prev,
        page: response.page || page,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      }));
    } catch (err) {
      setError(err.message || "Gagal mengambil log aktivitas");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchLogs(1, newFilters);
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  return {
    logs,
    loading,
    error,
    pagination,
    filters,
    setFilters: handleFilterChange,
    changePage: handlePageChange,
    refresh: () => fetchLogs(pagination.page),
  };
};
