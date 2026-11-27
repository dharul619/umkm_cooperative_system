import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import PrintRounded from "@mui/icons-material/PrintRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import { AppButton, AppTextField, Pagination } from "../../../../shared/components";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getDiffColor = (diff) => {
  if (diff === 0) return "#059669";
  return diff > 0 ? "#2563EB" : "#DC2626";
};

const getDiffLabel = (diff) => (diff === 0 ? "Pas" : diff > 0 ? "Lebih" : "Kurang");

const printZReportThermal = (detail) => {
  const shift = detail?.shift;
  const s = detail?.summary;
  const denoms = detail?.denominations || [];
  if (!shift || !s) return;

  const denomHtml = denoms
    .filter((d) => Number(d.count || 0) > 0)
    .map(
      (d) =>
        `<div class="row"><span>${escapeHtml(formatCurrency(d.denomination))} x ${Number(d.count)}</span><span>${escapeHtml(formatCurrency(d.subtotal))}</span></div>`
    )
    .join("");

  const isClosed = shift.status === "CLOSED";
  const cashDiff = Number(s.cash_difference || 0);
  const qrisDiff = Number(s.qris_difference || 0);
  const transferDiff = Number(s.transfer_difference || 0);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Z-Report ${escapeHtml(shift.shift_code)}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    body { width: 72mm; margin: 0 auto; font-family: 'Courier New', monospace; font-size: 12px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .dash { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold" style="font-size:14px;">SIKOMU - Z-REPORT SHIFT</div>
    <div class="bold">${escapeHtml(shift.shift_code)} (${escapeHtml(shift.status)})</div>
  </div>
  <div class="dash"></div>
  <div>Kasir : ${escapeHtml(shift.operator_name || "-")}</div>
  <div>Buka  : ${escapeHtml(formatDateTime(shift.opened_at))}</div>
  <div>Tutup : ${escapeHtml(shift.closed_at ? formatDateTime(shift.closed_at) : "OPEN")}</div>
  <div class="dash"></div>
  <div class="row"><span>Transaksi Sah</span><span>${Number(s.total_sales_count || 0)}</span></div>
  <div class="row"><span>Transaksi Void</span><span>${Number(s.voided_sales_count || 0)}</span></div>
  <div class="row"><span>Total Diskon</span><span>${escapeHtml(formatCurrency(s.total_discount_amount))}</span></div>
  <div class="dash"></div>
  <div class="bold">1. TUNAI (LACI KAS)</div>
  <div class="row"><span>Modal Awal</span><span>${escapeHtml(formatCurrency(s.opening_cash))}</span></div>
  <div class="row"><span>Penjualan Tunai</span><span>+${escapeHtml(formatCurrency(s.total_cash_sales))}</span></div>
  <div class="row"><span>Refund Tunai</span><span>-${escapeHtml(formatCurrency(s.total_refund_cash))}</span></div>
  <div class="row bold"><span>Ekspektasi Tunai</span><span>${escapeHtml(formatCurrency(s.expected_cash))}</span></div>
  ${
    isClosed
      ? `<div class="row bold"><span>Aktual Tunai</span><span>${escapeHtml(formatCurrency(s.actual_cash))}</span></div>
         <div class="row bold"><span>Selisih Tunai (${getDiffLabel(cashDiff)})</span><span>${escapeHtml(formatCurrency(cashDiff))}</span></div>`
      : ""
  }
  <div class="dash"></div>
  <div class="bold">2. NON-TUNAI (EDC)</div>
  <div class="row"><span>QRIS Sistem</span><span>${escapeHtml(formatCurrency(s.total_qris_sales))}</span></div>
  ${
    isClosed
      ? `<div class="row"><span>QRIS EDC Aktual</span><span>${escapeHtml(formatCurrency(s.actual_qris))}</span></div>
         <div class="row bold"><span>Selisih QRIS</span><span>${escapeHtml(formatCurrency(qrisDiff))}</span></div>`
      : ""
  }
  <div class="row"><span>Transfer Sistem</span><span>${escapeHtml(formatCurrency(s.total_transfer_sales))}</span></div>
  ${
    isClosed
      ? `<div class="row"><span>Transfer EDC Aktual</span><span>${escapeHtml(formatCurrency(s.actual_transfer))}</span></div>
         <div class="row bold"><span>Selisih Transfer</span><span>${escapeHtml(formatCurrency(transferDiff))}</span></div>`
      : ""
  }
  ${
    isClosed
      ? `<div class="dash"></div>
         <div class="bold">Rincian Pecahan Tunai:</div>
         ${denomHtml || "<div>Rp 0</div>"}`
      : ""
  }
  ${shift.notes ? `<div class="dash"></div><div>Catatan: ${escapeHtml(shift.notes)}</div>` : ""}
  <div class="dash"></div>
  <div class="center">Dicetak: ${escapeHtml(formatDateTime(new Date()))}</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 150);
};

export default function AuditShiftRetailPage() {
  const [shifts, setShifts] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ from: "", to: "", status: "", audit_status: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [auditNotes, setAuditNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  const fetchShifts = useCallback(async (page = 1, activeFilters = { from: "", to: "", status: "", audit_status: "" }) => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (activeFilters?.from) params.from = activeFilters.from;
      if (activeFilters?.to) params.to = activeFilters.to;
      if (activeFilters?.status) params.status = activeFilters.status;
      if (activeFilters?.audit_status) params.audit_status = activeFilters.audit_status;

      const response = await axiosInstance.get("/admin/reports/shifts-retail", { params });
      const result = response.data;
      if (result.success) {
        setShifts(result.data?.shifts || []);
        setSummary(result.data?.summary || {});
        if (result.data?.pagination) setPagination(result.data.pagination);
      } else {
        setError(result.message || "Gagal mengambil data audit shift");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShifts(1, { from: "", to: "", status: "", audit_status: "" });
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchShifts]);

  const handleFilterChange = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    fetchShifts(1, next);
  };

  const handleOpenDetail = async (shiftId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setAuditNotes("");
    setVerifyError("");
    setVerifySuccess("");
    try {
      const response = await axiosInstance.get(`/admin/reports/shifts-retail/${shiftId}`);
      if (response.data?.success) {
        setDetailData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal memuat detail Z-Report");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerifyShift = async (e) => {
    e.preventDefault();
    if (!detailData?.shift?.id) return;
    setVerifyError("");
    setVerifySuccess("");

    const hasDiff =
      Number(detailData.summary?.cash_difference || 0) !== 0 ||
      Number(detailData.summary?.qris_difference || 0) !== 0 ||
      Number(detailData.summary?.transfer_difference || 0) !== 0;

    const trimmed = auditNotes.trim();
    if (hasDiff && trimmed.length < 3) {
      setVerifyError("Catatan audit wajib diisi minimal 3 karakter karena shift memiliki selisih");
      return;
    }

    try {
      setVerifying(true);
      const response = await axiosInstance.post(
        `/admin/reports/shifts-retail/${detailData.shift.id}/verify`,
        { audit_notes: trimmed }
      );
      if (response.data?.success) {
        setDetailData(response.data.data);
        setVerifySuccess(response.data.message || "Shift berhasil diverifikasi");
        await fetchShifts(pagination.page, filters);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || err.message || "Gagal memverifikasi shift");
    } finally {
      setVerifying(false);
    }
  };

  const handleExportPDF = () => {
    const summaryCards = [
      { key: "total_shifts", label: "Total Shift", format: "number", color: "#7A2E3A", bgColor: "#fdf2f4" },
      { key: "total_expected_cash", label: "Ekspektasi Tunai", format: "currency", color: "#2563EB", bgColor: "#eff6ff" },
      { key: "total_actual_cash", label: "Aktual Tunai", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
      { key: "total_cash_difference", label: "Selisih Tunai", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
      { key: "total_qris_difference", label: "Selisih QRIS", format: "currency", color: "#7C3AED", bgColor: "#f5f3ff" },
      { key: "total_transfer_difference", label: "Selisih Transfer", format: "currency", color: "#7A2E3A", bgColor: "#fef2f2" },
    ];

    const sections = [
      {
        title: "Audit Shift & Z-Report Warung Retail",
        headers: [
          { label: "Kode Shift", align: "left" },
          { label: "Kasir", align: "left" },
          { label: "Status", align: "center" },
          { label: "Eksp. Tunai", align: "right" },
          { label: "Akt. Tunai", align: "right" },
          { label: "Selisih Tunai", align: "right" },
          { label: "Selisih QRIS", align: "right" },
          { label: "Selisih Transfer", align: "right" },
        ],
        rows: shifts.map((sh) => [
          sh.shift_code,
          sh.operator_name || "-",
          sh.status,
          formatCurrency(sh.expected_cash),
          sh.status === "CLOSED" ? formatCurrency(sh.actual_cash) : "-",
          sh.status === "CLOSED" ? formatCurrency(sh.cash_difference) : "-",
          sh.status === "CLOSED" ? formatCurrency(sh.qris_difference) : "-",
          sh.status === "CLOSED" ? formatCurrency(sh.transfer_difference) : "-",
        ]),
      },
    ];

    const pdfHtml = generateProfessionalPDF({
      title: "LAPORAN AUDIT SHIFT & Z-REPORT RETAIL",
      reportType: "Warung Retail",
      filters,
      summary,
      summaryCards,
      sections,
    });
    openProfessionalPDF(pdfHtml);
  };

  const detailShift = detailData?.shift;
  const detailSummary = detailData?.summary;
  const detailDenoms = detailData?.denominations || [];
  const cashDiff = Number(detailSummary?.cash_difference || 0);
  const qrisDiff = Number(detailSummary?.qris_difference || 0);
  const transferDiff = Number(detailSummary?.transfer_difference || 0);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#7A2E3A">
            Audit Shift & Z-Report - Warung Retail
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Rekonsiliasi Tunai, EDC QRIS, dan EDC Transfer per shift kasir
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <AppButton
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={() => fetchShifts(pagination.page, filters)}
            disabled={loading}
          >
            Refresh
          </AppButton>
          <AppButton
            startIcon={<PrintRounded />}
            onClick={handleExportPDF}
            disabled={loading || !shifts.length}
          >
            Export PDF
          </AppButton>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <AppTextField
              type="date"
              size="small"
              label="Dari Tanggal"
              value={filters.from}
              onChange={(e) => handleFilterChange({ from: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 180 }}
            />
            <AppTextField
              type="date"
              size="small"
              label="Sampai Tanggal"
              value={filters.to}
              onChange={(e) => handleFilterChange({ to: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 180 }}
            />
            <AppTextField
              select
              size="small"
              label="Status Shift"
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              sx={{ width: 170 }}
            >
              <option value="">Semua Status</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </AppTextField>
            <AppTextField
              select
              size="small"
              label="Audit Admin"
              value={filters.audit_status}
              onChange={(e) => handleFilterChange({ audit_status: e.target.value })}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              sx={{ width: 185 }}
            >
              <option value="">Semua Audit</option>
              <option value="PENDING">Belum Verifikasi</option>
              <option value="VERIFIED">Terverifikasi</option>
            </AppTextField>
            <AppButton
              variant="outlined"
              onClick={() => {
                const reset = { from: "", to: "", status: "", audit_status: "" };
                setFilters(reset);
                fetchShifts(1, reset);
              }}
            >
              Reset
            </AppButton>
          </Box>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {/* Summary KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Total Shift</Typography>
          <Typography variant="h5" fontWeight={800} color="#7A2E3A">
            {Number(summary.total_shifts || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Open: {summary.open_shifts || 0} • Closed: {summary.closed_shifts || 0}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Penjualan Tunai</Typography>
          <Typography variant="h6" fontWeight={800} color="#059669">
            {formatCurrency(summary.total_cash_sales)}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">QRIS + Transfer (Sistem)</Typography>
          <Typography variant="h6" fontWeight={800} color="#2563EB">
            {formatCurrency(Number(summary.total_qris_sales || 0) + Number(summary.total_transfer_sales || 0))}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Selisih Tunai</Typography>
          <Typography variant="h6" fontWeight={900} color={getDiffColor(Number(summary.total_cash_difference || 0))}>
            {formatCurrency(summary.total_cash_difference)}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Selisih EDC QRIS</Typography>
          <Typography variant="h6" fontWeight={900} color={getDiffColor(Number(summary.total_qris_difference || 0))}>
            {formatCurrency(summary.total_qris_difference)}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Selisih EDC Transfer</Typography>
          <Typography variant="h6" fontWeight={900} color={getDiffColor(Number(summary.total_transfer_difference || 0))}>
            {formatCurrency(summary.total_transfer_difference)}
          </Typography>
        </Paper>
      </Box>

      {/* Shifts Audit Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <PointOfSaleRounded sx={{ color: "#7A2E3A" }} />
            <Typography variant="h6" fontWeight={700}>
              Daftar Shift & Rekonsiliasi
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Shift</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Kasir</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Waktu</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Eksp. Tunai</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Akt. Tunai</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Selisih Tunai</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Selisih QRIS</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Selisih Transfer</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="center">Status</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="center">Audit</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="center">Z-Report</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!shifts.length ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        Belum ada data shift kasir.
                      </TableCell>
                    </TableRow>
                  ) : (
                    shifts.map((sh) => {
                      const cDiff = Number(sh.cash_difference || 0);
                      const qDiff = Number(sh.qris_difference || 0);
                      const tDiff = Number(sh.transfer_difference || 0);
                      return (
                        <TableRow key={sh.id} hover>
                          <TableCell sx={{ fontWeight: 800 }}>{sh.shift_code}</TableCell>
                          <TableCell>{sh.operator_name || "-"}</TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">
                              {formatDateTime(sh.opened_at)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {sh.closed_at ? formatDateTime(sh.closed_at) : "Aktif"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(sh.expected_cash)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {sh.status === "CLOSED" ? formatCurrency(sh.actual_cash) : "-"}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: sh.status !== "CLOSED" ? "text.secondary" : getDiffColor(cDiff),
                            }}
                          >
                            {sh.status === "CLOSED" ? formatCurrency(cDiff) : "-"}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: sh.status !== "CLOSED" ? "text.secondary" : getDiffColor(qDiff),
                            }}
                          >
                            {sh.status === "CLOSED" ? formatCurrency(qDiff) : "-"}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: sh.status !== "CLOSED" ? "text.secondary" : getDiffColor(tDiff),
                            }}
                          >
                            {sh.status === "CLOSED" ? formatCurrency(tDiff) : "-"}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={sh.status}
                              color={sh.status === "OPEN" ? "success" : "default"}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {sh.status !== "CLOSED" ? (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            ) : sh.audit_status === "VERIFIED" ? (
                              <Stack spacing={0.25} alignItems="center">
                                <Chip
                                  size="small"
                                  color="success"
                                  label="Terverifikasi"
                                  sx={{ fontWeight: 700 }}
                                />
                                {sh.day_closing_code ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {sh.day_closing_code}
                                  </Typography>
                                ) : null}
                              </Stack>
                            ) : (
                              <Chip
                                size="small"
                                color="warning"
                                label="Belum Verifikasi"
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <AppButton
                              size="small"
                              variant="outlined"
                              startIcon={<ReceiptLongRounded />}
                              onClick={() => handleOpenDetail(sh.id)}
                            >
                              Z-Report
                            </AppButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {pagination.total > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={pagination.page}
                count={pagination.totalPages}
                total={pagination.total}
                rowsPerPage={pagination.limit}
                onPageChange={(p) => fetchShifts(p, filters)}
              />
            </Box>
          ) : null}
        </CardContent>
      </Card>

      {/* Z-Report Detail Dialog (Read-Only) */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={850} color="#7A2E3A">
                Z-Report {detailShift?.shift_code || ""}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kasir: {detailShift?.operator_name || "-"} • Buka: {formatDateTime(detailShift?.opened_at)}
              </Typography>
            </Box>
            {detailShift ? (
              <Chip
                size="small"
                color={detailShift.status === "OPEN" ? "success" : "default"}
                label={detailShift.status}
                sx={{ fontWeight: 800 }}
              />
            ) : null}
          </Box>
        </DialogTitle>

        <DialogContent>
          {detailLoading ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : !detailData ? (
            <Typography color="text.secondary">Detail Z-Report tidak tersedia.</Typography>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #F9D5DC" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.25 }}>
                  Rekonsiliasi Sistem vs Aktual Kasir
                </Typography>
                <Stack spacing={0.75}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Transaksi Sah / Void</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {detailSummary.total_sales_count} / {detailSummary.voided_sales_count}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Total Diskon</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(detailSummary.total_discount_amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Modal Awal Laci</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(detailSummary.opening_cash)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Refund Tunai / Non-Tunai</Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      -{formatCurrency(detailSummary.total_refund_cash)} / -{formatCurrency(detailSummary.total_refund_non_cash)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  {/* 3-Channel Table */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, px: 0.5 }}>Kanal</TableCell>
                        <TableCell sx={{ fontWeight: 700, px: 0.5 }} align="right">Sistem</TableCell>
                        <TableCell sx={{ fontWeight: 700, px: 0.5 }} align="right">Aktual</TableCell>
                        <TableCell sx={{ fontWeight: 700, px: 0.5 }} align="right">Selisih</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ px: 0.5, fontWeight: 700 }}>Tunai</TableCell>
                        <TableCell sx={{ px: 0.5 }} align="right">{formatCurrency(detailSummary.expected_cash)}</TableCell>
                        <TableCell sx={{ px: 0.5 }} align="right">
                          {detailShift.status === "CLOSED" ? formatCurrency(detailSummary.actual_cash) : "-"}
                        </TableCell>
                        <TableCell
                          sx={{ px: 0.5, fontWeight: 800, color: detailShift.status === "CLOSED" ? getDiffColor(cashDiff) : "text.secondary" }}
                          align="right"
                        >
                          {detailShift.status === "CLOSED" ? formatCurrency(cashDiff) : "-"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ px: 0.5, fontWeight: 700 }}>EDC QRIS</TableCell>
                        <TableCell sx={{ px: 0.5 }} align="right">{formatCurrency(detailSummary.total_qris_sales)}</TableCell>
                        <TableCell sx={{ px: 0.5 }} align="right">
                          {detailShift.status === "CLOSED" ? formatCurrency(detailSummary.actual_qris) : "-"}
                        </TableCell>
                        <TableCell
                          sx={{ px: 0.5, fontWeight: 800, color: detailShift.status === "CLOSED" ? getDiffColor(qrisDiff) : "text.secondary" }}
                          align="right"
                        >
                          {detailShift.status === "CLOSED" ? formatCurrency(qrisDiff) : "-"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ px: 0.5, fontWeight: 700 }}>EDC Transfer</TableCell>
                        <TableCell sx={{ px: 0.5 }} align="right">{formatCurrency(detailSummary.total_transfer_sales)}</TableCell>
                        <TableCell sx={{ px: 0.5 }} align="right">
                          {detailShift.status === "CLOSED" ? formatCurrency(detailSummary.actual_transfer) : "-"}
                        </TableCell>
                        <TableCell
                          sx={{ px: 0.5, fontWeight: 800, color: detailShift.status === "CLOSED" ? getDiffColor(transferDiff) : "text.secondary" }}
                          align="right"
                        >
                          {detailShift.status === "CLOSED" ? formatCurrency(transferDiff) : "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {detailShift.notes ? (
                    <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                      Catatan kasir: {detailShift.notes}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #F9D5DC" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.25 }}>
                  Rincian Pecahan Tunai
                </Typography>
                {detailShift.status !== "CLOSED" ? (
                  <Alert severity="info">Shift masih OPEN.</Alert>
                ) : !detailDenoms.length ? (
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada rincian pecahan.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Pecahan</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Jml</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailDenoms.map((d) => (
                        <TableRow key={d.denomination}>
                          <TableCell>{formatCurrency(d.denomination)}</TableCell>
                          <TableCell align="center">{Number(d.count || 0)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: d.count > 0 ? 800 : 400 }}>
                            {formatCurrency(d.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              {detailShift?.status === "CLOSED" ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #F9D5DC",
                    gridColumn: { xs: "auto", md: "1 / -1" },
                  }}
                >
                  {verifySuccess ? (
                    <Alert severity="success" sx={{ mb: 1.5 }}>
                      {verifySuccess}
                    </Alert>
                  ) : null}
                  {verifyError ? (
                    <Alert severity="error" sx={{ mb: 1.5 }}>
                      {verifyError}
                    </Alert>
                  ) : null}

                  {detailShift.audit_status === "VERIFIED" ? (
                    <Alert severity="success" icon={<VerifiedRounded />}>
                      <strong>Terverifikasi</strong> oleh {detailShift.verified_by_name || "-"} pada{" "}
                      {formatDateTime(detailShift.verified_at)}
                      {detailShift.day_closing_code ? ` • Terkunci di ${detailShift.day_closing_code}` : ""}
                      {detailShift.audit_notes ? (
                        <>
                          <br />
                          Catatan audit: {detailShift.audit_notes}
                        </>
                      ) : null}
                    </Alert>
                  ) : (
                    <Box component="form" onSubmit={handleVerifyShift}>
                      <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1 }}>
                        Verifikasi Audit Shift
                      </Typography>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "flex-start" }}>
                        <AppTextField
                          size="small"
                          fullWidth
                          label={
                            cashDiff !== 0 || qrisDiff !== 0 || transferDiff !== 0
                              ? "Catatan Audit / Berita Acara Selisih (Wajib)"
                              : "Catatan Audit (Opsional)"
                          }
                          placeholder="Mis. Selisih sudah dikonfirmasi dengan kasir / pas sesuai bukti EDC"
                          value={auditNotes}
                          onChange={(e) => setAuditNotes(e.target.value)}
                          required={cashDiff !== 0 || qrisDiff !== 0 || transferDiff !== 0}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <AppButton
                          type="submit"
                          color="success"
                          startIcon={<VerifiedRounded />}
                          disabled={verifying}
                          sx={{ whiteSpace: "nowrap", minWidth: 170 }}
                        >
                          {verifying ? "Menyimpan..." : "Verifikasi Shift"}
                        </AppButton>
                      </Stack>
                    </Box>
                  )}
                </Paper>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton
            variant="outlined"
            startIcon={<PrintRounded />}
            disabled={!detailData}
            onClick={() => printZReportThermal(detailData)}
          >
            Print Z-Report (80mm)
          </AppButton>
          <AppButton onClick={() => setDetailOpen(false)}>Tutup</AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
