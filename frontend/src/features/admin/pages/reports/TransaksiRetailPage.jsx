import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { AppButton, AppTextField, Pagination } from "../../../../shared/components";
import { salesService } from "../../../retail/sales/services/salesService";
import SaleDetailDialog from "../../../retail/sales/components/SaleDetailDialog";
import {
  formatDateTime,
  money,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_META,
} from "../../../retail/sales/utils/posFormatters";

const DEFAULT_LIMIT = 20;

const INITIAL_FILTERS = {
  search: "",
  from: "",
  to: "",
  status: "",
  payment_method: "",
};

const TransaksiRetailPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const requestIdRef = useRef(0);
  const searchTimerRef = useRef(null);

  const fetchSales = useCallback(async (page = 1, activeFilters = INITIAL_FILTERS) => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: DEFAULT_LIMIT,
      };
      if (activeFilters?.search?.trim()) params.search = activeFilters.search.trim();
      if (activeFilters?.from) params.from = activeFilters.from;
      if (activeFilters?.to) params.to = activeFilters.to;
      if (activeFilters?.status) params.status = activeFilters.status;
      if (activeFilters?.payment_method) params.payment_method = activeFilters.payment_method;

      const res = await salesService.getAll(params);
      if (requestId !== requestIdRef.current) return;

      const rows = Array.isArray(res?.data) ? res.data : [];
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
      setError(err?.message || "Gagal mengambil daftar transaksi retail");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1, INITIAL_FILTERS);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [fetchSales]);

  const updateFilters = (patch, debounce = false) => {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (debounce) {
      searchTimerRef.current = setTimeout(() => {
        fetchSales(1, nextFilters);
      }, 250);
    } else {
      fetchSales(1, nextFilters);
    }
  };

  const resetFilters = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setFilters(INITIAL_FILTERS);
    fetchSales(1, INITIAL_FILTERS);
  };

  const handleOpenDetail = async (row) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const data = await salesService.getById(row.id);
      setDetailData(data);
    } catch (err) {
      setError(err?.message || "Gagal mengambil detail struk");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography variant="h5" fontWeight={900} color="#7A2E3A">
          Daftar Transaksi Retail
        </Typography>
        <AppButton
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={() => fetchSales(pagination.page, filters)}
          disabled={loading}
        >
          Refresh
        </AppButton>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #F9D5DC" }}>
        <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
          <AppTextField
            label="Cari invoice / kasir / member"
            size="small"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value }, true)}
            sx={{ width: { xs: "100%", sm: 250 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <AppTextField
            select
            label="Status"
            size="small"
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            sx={{ width: 170 }}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Semua Status</option>
            <option value="COMPLETED">Selesai</option>
            <option value="PARTIAL_RETURN">Retur Sebagian</option>
            <option value="RETURNED">Diretur Penuh</option>
            <option value="VOIDED">Dibatalkan (Void)</option>
          </AppTextField>
          <AppTextField
            select
            label="Metode Bayar"
            size="small"
            value={filters.payment_method}
            onChange={(e) => updateFilters({ payment_method: e.target.value })}
            sx={{ width: 165 }}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Semua Metode</option>
            <option value="CASH">Tunai</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer</option>
            <option value="MIXED">Split / Campuran</option>
          </AppTextField>
          <AppTextField
            type="date"
            label="Dari"
            size="small"
            value={filters.from}
            onChange={(e) => updateFilters({ from: e.target.value })}
            sx={{ width: 155 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <AppTextField
            type="date"
            label="Sampai"
            size="small"
            value={filters.to}
            onChange={(e) => updateFilters({ to: e.target.value })}
            sx={{ width: 155 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <AppButton variant="outlined" onClick={resetFilters}>
            Reset
          </AppButton>
        </Box>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 2.5, border: "1px solid #F9D5DC" }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#FFF5F7" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Invoice</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Waktu & Kasir</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Anggota</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Metode</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={26} />
                </TableCell>
              </TableRow>
            ) : !sales.length ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Tidak ada data transaksi yang sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((row) => {
                const statusMeta = SALE_STATUS_META[row.status || "COMPLETED"] || SALE_STATUS_META.COMPLETED;
                const payLabel = PAYMENT_METHOD_LABELS[row.payment_method || "CASH"] || row.payment_method;
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography fontWeight={800} variant="body2" color="#7A2E3A">
                        {row.invoice_number || `#${row.id}`}
                      </Typography>
                      {row.shift_code ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.shift_code}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDateTime(row.created_at || row.sale_date)}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Kasir: {row.operator_name || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.member_name || "Umum"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={payLabel} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25} alignItems="flex-start">
                        <Chip
                          size="small"
                          color={statusMeta.color}
                          label={statusMeta.label}
                          sx={{ fontWeight: 700 }}
                        />
                        {row.void_approved_by_name ? (
                          <Typography variant="caption" color="error.main">
                            Auth: {row.void_approved_by_name}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={850} variant="body2" color="#7A2E3A">
                        {money(row.total_amount)}
                      </Typography>
                      {Number(row.returned_amount || 0) > 0 ? (
                        <Typography variant="caption" color="warning.dark" display="block" fontWeight={700}>
                          Retur: -{money(row.returned_amount)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">
                      <AppButton
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptLongRounded />}
                        onClick={() => handleOpenDetail(row)}
                      >
                        Struk
                      </AppButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination.total > 0 ? (
        <Pagination
          page={pagination.page}
          count={pagination.totalPages}
          total={pagination.total}
          rowsPerPage={pagination.limit}
          onPageChange={(page) => fetchSales(page, filters)}
        />
      ) : null}

      <SaleDetailDialog
        open={detailOpen}
        loading={detailLoading}
        data={detailData}
        onClose={() => {
          setDetailOpen(false);
          setDetailData(null);
        }}
      />
    </Box>
  );
};

export default TransaksiRetailPage;
