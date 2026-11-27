import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import PrintRounded from "@mui/icons-material/PrintRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import { AppButton, AppTextField, Pagination } from "../../../../shared/components";
import axiosInstance from "../../../../services/axiosInstace";
import {
  formatCurrency,
  generateProfessionalPDF,
  openProfessionalPDF,
} from "../../../../shared/utils/pdfExport";

const getLocalToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

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

const printEodThermal = (record, shifts = []) => {
  if (!record) return;
  const shiftRowsHtml = shifts
    .map(
      (sh) =>
        `<div class="row"><span>${escapeHtml(sh.shift_code)} (${escapeHtml(sh.operator_name || "-")})</span><span>${escapeHtml(formatCurrency(sh.cash_difference || 0))}</span></div>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EOD ${escapeHtml(record.closing_code)}</title>
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
    <div class="bold" style="font-size:14px;">SIKOMU - DAY CLOSE (EOD)</div>
    <div class="bold">${escapeHtml(record.closing_code)}</div>
    <div>Tanggal Buku: ${escapeHtml(record.business_date)}</div>
  </div>
  <div class="dash"></div>
  <div>Ditutup oleh: ${escapeHtml(record.closed_by_name || "-")}</div>
  <div>Waktu tutup : ${escapeHtml(formatDateTime(record.closed_at))}</div>
  <div class="dash"></div>
  <div class="row"><span>Jumlah Shift</span><span>${Number(record.total_shifts || 0)}</span></div>
  <div class="row"><span>Transaksi Sah / Void</span><span>${Number(record.total_sales_count || 0)} / ${Number(record.voided_sales_count || 0)}</span></div>
  <div class="row"><span>Total Retur</span><span>${Number(record.return_count || 0)}</span></div>
  <div class="row"><span>Omzet Kotor</span><span>${escapeHtml(formatCurrency(record.gross_sales_amount))}</span></div>
  <div class="row"><span>Refund Tunai</span><span>-${escapeHtml(formatCurrency(record.total_refund_cash))}</span></div>
  <div class="row"><span>Refund Non-Tunai</span><span>-${escapeHtml(formatCurrency(record.total_refund_non_cash))}</span></div>
  <div class="row bold"><span>Omzet Bersih</span><span>${escapeHtml(formatCurrency(record.net_sales_amount))}</span></div>
  <div class="dash"></div>
  <div class="bold">REKONSILIASI HARIAN</div>
  <div class="row"><span>Eksp. Tunai</span><span>${escapeHtml(formatCurrency(record.expected_cash_total))}</span></div>
  <div class="row"><span>Akt. Tunai</span><span>${escapeHtml(formatCurrency(record.actual_cash_total))}</span></div>
  <div class="row bold"><span>Selisih Tunai</span><span>${escapeHtml(formatCurrency(record.cash_difference))}</span></div>
  <div class="row"><span>QRIS Sistem / EDC</span><span>${escapeHtml(formatCurrency(record.expected_qris_total))} / ${escapeHtml(formatCurrency(record.actual_qris_total))}</span></div>
  <div class="row bold"><span>Selisih QRIS</span><span>${escapeHtml(formatCurrency(record.qris_difference))}</span></div>
  <div class="row"><span>Transfer Sis / EDC</span><span>${escapeHtml(formatCurrency(record.expected_transfer_total))} / ${escapeHtml(formatCurrency(record.actual_transfer_total))}</span></div>
  <div class="row bold"><span>Selisih Transfer</span><span>${escapeHtml(formatCurrency(record.transfer_difference))}</span></div>
  ${shiftRowsHtml ? `<div class="dash"></div><div class="bold">SHIFT TERKUNCI (Selisih Tunai):</div>${shiftRowsHtml}` : ""}
  ${record.notes ? `<div class="dash"></div><div>Berita Acara: ${escapeHtml(record.notes)}</div>` : ""}
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

const exportEodPdf = (record, shifts = []) => {
  if (!record) return;
  const summaryCards = [
    { key: "total_shifts", label: "Total Shift", format: "number", color: "#7A2E3A", bgColor: "#fdf2f4" },
    { key: "net_sales_amount", label: "Omzet Bersih", format: "currency", color: "#059669", bgColor: "#ecfdf5" },
    { key: "actual_cash_total", label: "Aktual Tunai", format: "currency", color: "#2563EB", bgColor: "#eff6ff" },
    { key: "cash_difference", label: "Selisih Tunai", format: "currency", color: "#D97706", bgColor: "#fffbeb" },
    { key: "qris_difference", label: "Selisih QRIS", format: "currency", color: "#7C3AED", bgColor: "#f5f3ff" },
    { key: "transfer_difference", label: "Selisih Transfer", format: "currency", color: "#7A2E3A", bgColor: "#fef2f2" },
  ];

  const sections = [
    {
      title: `Rekonsiliasi Harian ${record.closing_code} (${record.business_date})`,
      headers: [
        { label: "Kanal", align: "left" },
        { label: "Sistem", align: "right" },
        { label: "Aktual", align: "right" },
        { label: "Selisih", align: "right" },
      ],
      rows: [
        [
          "Tunai (Laci Kas)",
          formatCurrency(record.expected_cash_total),
          formatCurrency(record.actual_cash_total),
          formatCurrency(record.cash_difference),
        ],
        [
          "EDC QRIS",
          formatCurrency(record.expected_qris_total),
          formatCurrency(record.actual_qris_total),
          formatCurrency(record.qris_difference),
        ],
        [
          "EDC Transfer",
          formatCurrency(record.expected_transfer_total),
          formatCurrency(record.actual_transfer_total),
          formatCurrency(record.transfer_difference),
        ],
      ],
    },
    {
      title: "Daftar Shift Terkunci",
      headers: [
        { label: "Kode Shift", align: "left" },
        { label: "Kasir", align: "left" },
        { label: "Verifikator", align: "left" },
        { label: "Selisih Tunai", align: "right" },
        { label: "Selisih QRIS", align: "right" },
        { label: "Selisih Transfer", align: "right" },
      ],
      rows: shifts.map((sh) => [
        sh.shift_code,
        sh.operator_name || "-",
        sh.verified_by_name || "-",
        formatCurrency(sh.cash_difference || 0),
        formatCurrency(sh.qris_difference || 0),
        formatCurrency(sh.transfer_difference || 0),
      ]),
    },
  ];

  const html = generateProfessionalPDF({
    title: `LAPORAN TUTUP HARI (DAY CLOSE) - ${record.closing_code}`,
    reportType: "Warung Retail",
    filters: { from: record.business_date, to: record.business_date },
    summary: record,
    summaryCards,
    sections,
  });
  openProfessionalPDF(html);
};

export default function DayCloseRetailPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getLocalToday);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [closings, setClosings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ from: "", to: "" });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPreview = useCallback(async (targetDate) => {
    setLoadingPreview(true);
    setError("");
    try {
      const res = await axiosInstance.get("/admin/reports/day-closings/preview", {
        params: { date: targetDate },
      });
      if (res.data?.success) {
        setPreview(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal memuat pratinjau Day Close");
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const fetchClosings = useCallback(async (page = 1, activeFilters = { from: "", to: "" }) => {
    setLoadingHistory(true);
    try {
      const params = { page, limit: 20 };
      if (activeFilters?.from) params.from = activeFilters.from;
      if (activeFilters?.to) params.to = activeFilters.to;

      const res = await axiosInstance.get("/admin/reports/day-closings", { params });
      if (res.data?.success) {
        setClosings(res.data.data?.closings || []);
        if (res.data.data?.pagination) setPagination(res.data.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal memuat riwayat Day Close");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const today = getLocalToday();
    const timer = setTimeout(() => {
      fetchPreview(today);
      fetchClosings(1, { from: "", to: "" });
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPreview, fetchClosings]);

  const handleDateChange = (nextDate) => {
    setSelectedDate(nextDate);
    setNotes("");
    setSuccess("");
    if (nextDate) {
      fetchPreview(nextDate);
    }
  };

  const handleConfirmDayClose = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await axiosInstance.post("/admin/reports/day-closings", {
        business_date: selectedDate,
        notes: notes.trim(),
      });
      if (res.data?.success) {
        setConfirmOpen(false);
        setNotes("");
        setSuccess(res.data.message || "Day Close berhasil diproses");
        await Promise.all([fetchPreview(selectedDate), fetchClosings(1, historyFilters)]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal memproses Day Close");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistoryDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await axiosInstance.get(`/admin/reports/day-closings/${id}`);
      if (res.data?.success) {
        setDetailData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal memuat detail Day Close");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const summary = preview?.summary || {};
  const previewShifts = preview?.shifts || [];
  const closedRecord = preview?.day_closing;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#7A2E3A">
            Tutup Hari (Day Close / EOD) - Warung Retail
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Konsolidasi harian seluruh shift terverifikasi dan penguncian pembukuan
          </Typography>
        </Box>
        <AppButton
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={() => {
            fetchPreview(selectedDate);
            fetchClosings(pagination.page, historyFilters);
          }}
          disabled={loadingPreview || loadingHistory}
        >
          Refresh
        </AppButton>
      </Box>

      {error ? (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      ) : null}

      {/* Section 1: Day Close Preview & Action */}
      <Card>
        <CardContent sx={{ display: "grid", gap: 2.25 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <EventAvailableRounded sx={{ color: "#7A2E3A" }} />
              <Typography variant="h6" fontWeight={700}>
                Rekonsiliasi & Tutup Hari
              </Typography>
            </Stack>
            <AppTextField
              type="date"
              size="small"
              label="Tanggal Pembukuan"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 190 }}
            />
          </Box>

          {loadingPreview ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : !preview ? null : (
            <>
              {preview.already_closed && closedRecord ? (
                <Alert
                  severity="success"
                  icon={<LockRounded />}
                  action={
                    <Stack direction="row" spacing={1}>
                      <AppButton
                        size="small"
                        variant="outlined"
                        startIcon={<PrintRounded />}
                        onClick={() => printEodThermal(closedRecord, previewShifts)}
                      >
                        Print 80mm
                      </AppButton>
                      <AppButton
                        size="small"
                        startIcon={<PrintRounded />}
                        onClick={() => exportEodPdf(closedRecord, previewShifts)}
                      >
                        PDF
                      </AppButton>
                    </Stack>
                  }
                >
                  <strong>{closedRecord.closing_code}</strong> • Ditutup oleh{" "}
                  {closedRecord.closed_by_name || "-"} pada {formatDateTime(closedRecord.closed_at)}
                  {closedRecord.notes ? (
                    <>
                      <br />
                      Berita acara: {closedRecord.notes}
                    </>
                  ) : null}
                </Alert>
              ) : preview.blockers?.length > 0 ? (
                <Alert
                  severity="warning"
                  action={
                    <AppButton
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => navigate("/admin/reports/retail/shifts")}
                    >
                      Buka Audit Shift
                    </AppButton>
                  }
                >
                  {preview.blockers.map((msg, idx) => (
                    <div key={idx}>{msg}</div>
                  ))}
                </Alert>
              ) : null}

              {/* KPI Summary */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
                  gap: 1.5,
                }}
              >
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Jumlah Shift</Typography>
                  <Typography variant="h6" fontWeight={850} color="#7A2E3A">
                    {summary.total_shifts || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Verifikasi: {summary.verified_shifts || 0} / {summary.total_shifts || 0}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Trx Sah / Void / Retur</Typography>
                  <Typography variant="h6" fontWeight={850}>
                    {summary.total_sales_count || 0} / {summary.voided_sales_count || 0} / {summary.return_count || 0}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Omzet Bersih</Typography>
                  <Typography variant="h6" fontWeight={850} color="#059669">
                    {formatCurrency(summary.net_sales_amount)}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Selisih Tunai</Typography>
                  <Typography variant="h6" fontWeight={900} color={getDiffColor(Number(summary.cash_difference || 0))}>
                    {formatCurrency(summary.cash_difference)}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Selisih EDC QRIS</Typography>
                  <Typography variant="h6" fontWeight={900} color={getDiffColor(Number(summary.qris_difference || 0))}>
                    {formatCurrency(summary.qris_difference)}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E0E0E0", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Selisih EDC Transfer</Typography>
                  <Typography variant="h6" fontWeight={900} color={getDiffColor(Number(summary.transfer_difference || 0))}>
                    {formatCurrency(summary.transfer_difference)}
                  </Typography>
                </Paper>
              </Box>

              {/* 3-Channel Reconciliation Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#FFF5F7" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Kanal Pembayaran</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Sistem</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Aktual Kasir / EDC</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Selisih Harian</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tunai (Laci Kas)</TableCell>
                      <TableCell align="right">{formatCurrency(summary.expected_cash_total)}</TableCell>
                      <TableCell align="right">{formatCurrency(summary.actual_cash_total)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: getDiffColor(Number(summary.cash_difference || 0)) }}>
                        {formatCurrency(summary.cash_difference)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>EDC QRIS</TableCell>
                      <TableCell align="right">{formatCurrency(summary.expected_qris_total)}</TableCell>
                      <TableCell align="right">{formatCurrency(summary.actual_qris_total)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: getDiffColor(Number(summary.qris_difference || 0)) }}>
                        {formatCurrency(summary.qris_difference)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>EDC Transfer</TableCell>
                      <TableCell align="right">{formatCurrency(summary.expected_transfer_total)}</TableCell>
                      <TableCell align="right">{formatCurrency(summary.actual_transfer_total)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: getDiffColor(Number(summary.transfer_difference || 0)) }}>
                        {formatCurrency(summary.transfer_difference)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Shifts on Selected Date */}
              {previewShifts.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Kode Shift</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Kasir</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>Audit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Selisih Tunai</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Selisih QRIS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Selisih Transfer</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewShifts.map((sh) => (
                        <TableRow key={sh.id}>
                          <TableCell sx={{ fontWeight: 700 }}>{sh.shift_code}</TableCell>
                          <TableCell>{sh.operator_name || "-"}</TableCell>
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
                              "-"
                            ) : (
                              <Chip
                                size="small"
                                label={sh.audit_status === "VERIFIED" ? "Terverifikasi" : "Belum Verifikasi"}
                                color={sh.audit_status === "VERIFIED" ? "success" : "warning"}
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: sh.status === "CLOSED" ? getDiffColor(Number(sh.cash_difference || 0)) : "text.secondary" }}>
                            {sh.status === "CLOSED" ? formatCurrency(sh.cash_difference) : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: sh.status === "CLOSED" ? getDiffColor(Number(sh.qris_difference || 0)) : "text.secondary" }}>
                            {sh.status === "CLOSED" ? formatCurrency(sh.qris_difference) : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: sh.status === "CLOSED" ? getDiffColor(Number(sh.transfer_difference || 0)) : "text.secondary" }}>
                            {sh.status === "CLOSED" ? formatCurrency(sh.transfer_difference) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : null}

              {/* Execute Day Close Form */}
              {preview.can_close ? (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #F9D5DC", backgroundColor: "#FFF5F7" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
                    <AppTextField
                      size="small"
                      fullWidth
                      label={
                        preview.has_discrepancy
                          ? "Berita Acara / Catatan Selisih Harian (Wajib)"
                          : "Catatan Penutupan Hari (Opsional)"
                      }
                      placeholder="Mis. Setoran kas harian sesuai berita acara bendahara"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required={preview.has_discrepancy}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <AppButton
                      startIcon={<LockRounded />}
                      disabled={submitting || (preview.has_discrepancy && notes.trim().length < 3)}
                      onClick={() => setConfirmOpen(true)}
                      sx={{ whiteSpace: "nowrap", minWidth: 190 }}
                    >
                      Proses Day Close
                    </AppButton>
                  </Stack>
                </Paper>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Day Close History */}
      <Card>
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Riwayat Day Close
            </Typography>
            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
              <AppTextField
                type="date"
                size="small"
                label="Dari"
                value={historyFilters.from}
                onChange={(e) => {
                  const next = { ...historyFilters, from: e.target.value };
                  setHistoryFilters(next);
                  fetchClosings(1, next);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 165 }}
              />
              <AppTextField
                type="date"
                size="small"
                label="Sampai"
                value={historyFilters.to}
                onChange={(e) => {
                  const next = { ...historyFilters, to: e.target.value };
                  setHistoryFilters(next);
                  fetchClosings(1, next);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 165 }}
              />
              <AppButton
                variant="outlined"
                onClick={() => {
                  const reset = { from: "", to: "" };
                  setHistoryFilters(reset);
                  fetchClosings(1, reset);
                }}
              >
                Reset
              </AppButton>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#7A2E3A" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Kode EOD</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Tanggal</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="center">Shift</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Omzet Bersih</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Selisih Tunai</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Selisih QRIS</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="right">Selisih Transfer</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Admin</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }} align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={26} />
                    </TableCell>
                  </TableRow>
                ) : !closings.length ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      Belum ada riwayat Day Close.
                    </TableCell>
                  </TableRow>
                ) : (
                  closings.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: "#7A2E3A" }}>{row.closing_code}</TableCell>
                      <TableCell>{row.business_date}</TableCell>
                      <TableCell align="center">{row.total_shifts}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>
                        {formatCurrency(row.net_sales_amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: getDiffColor(Number(row.cash_difference || 0)) }}>
                        {formatCurrency(row.cash_difference)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: getDiffColor(Number(row.qris_difference || 0)) }}>
                        {formatCurrency(row.qris_difference)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: getDiffColor(Number(row.transfer_difference || 0)) }}>
                        {formatCurrency(row.transfer_difference)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.closed_by_name || "-"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(row.closed_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <AppButton
                          size="small"
                          variant="outlined"
                          startIcon={<ReceiptLongRounded />}
                          onClick={() => handleOpenHistoryDetail(row.id)}
                        >
                          Detail
                        </AppButton>
                      </TableCell>
                    </TableRow>
                  ))
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
              onPageChange={(p) => fetchClosings(p, historyFilters)}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Confirm Day Close Dialog */}
      <Dialog open={confirmOpen} onClose={submitting ? undefined : () => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 850, color: "#7A2E3A" }}>
          Konfirmasi Tutup Hari ({selectedDate})
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Setelah Day Close diproses, tanggal <strong>{selectedDate}</strong> akan dikunci.
            Shift baru, transaksi POS baru, dan pembatalan (Void) pada tanggal tersebut tidak dapat dilakukan lagi.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton variant="outlined" onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Batal
          </AppButton>
          <AppButton startIcon={<LockRounded />} onClick={handleConfirmDayClose} disabled={submitting}>
            {submitting ? "Memproses..." : "Ya, Tutup Hari"}
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Day Close Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={850} color="#7A2E3A">
            Laporan Day Close {detailData?.day_closing?.closing_code || ""}
          </Typography>
          {detailData?.day_closing ? (
            <Typography variant="caption" color="text.secondary">
              Tanggal Buku: {detailData.day_closing.business_date} • Ditutup oleh{" "}
              {detailData.day_closing.closed_by_name || "-"} ({formatDateTime(detailData.day_closing.closed_at)})
            </Typography>
          ) : null}
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : !detailData?.day_closing ? (
            <Typography color="text.secondary">Data tidak tersedia.</Typography>
          ) : (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #F9D5DC" }}>
                <Stack spacing={0.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Transaksi Sah / Void / Retur</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {detailData.day_closing.total_sales_count} / {detailData.day_closing.voided_sales_count} / {detailData.day_closing.return_count}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Omzet Kotor / Diskon</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(detailData.day_closing.gross_sales_amount)} / {formatCurrency(detailData.day_closing.total_discount_amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Omzet Bersih</Typography>
                    <Typography variant="body2" fontWeight={850} color="#059669">
                      {formatCurrency(detailData.day_closing.net_sales_amount)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.75 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Selisih Tunai (Eksp vs Akt)</Typography>
                    <Typography variant="body2" fontWeight={800} color={getDiffColor(Number(detailData.day_closing.cash_difference || 0))}>
                      {formatCurrency(detailData.day_closing.cash_difference)} ({formatCurrency(detailData.day_closing.expected_cash_total)} vs {formatCurrency(detailData.day_closing.actual_cash_total)})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Selisih EDC QRIS</Typography>
                    <Typography variant="body2" fontWeight={800} color={getDiffColor(Number(detailData.day_closing.qris_difference || 0))}>
                      {formatCurrency(detailData.day_closing.qris_difference)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Selisih EDC Transfer</Typography>
                    <Typography variant="body2" fontWeight={800} color={getDiffColor(Number(detailData.day_closing.transfer_difference || 0))}>
                      {formatCurrency(detailData.day_closing.transfer_difference)}
                    </Typography>
                  </Box>
                  {detailData.day_closing.notes ? (
                    <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                      Berita acara: {detailData.day_closing.notes}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>

              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Shift</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Kasir</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Verifikator</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Selisih Tunai</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Selisih QRIS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Selisih Transfer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailData.shifts || []).map((sh) => (
                      <TableRow key={sh.id}>
                        <TableCell sx={{ fontWeight: 700 }}>{sh.shift_code}</TableCell>
                        <TableCell>{sh.operator_name || "-"}</TableCell>
                        <TableCell>{sh.verified_by_name || "-"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: getDiffColor(Number(sh.cash_difference || 0)) }}>
                          {formatCurrency(sh.cash_difference)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: getDiffColor(Number(sh.qris_difference || 0)) }}>
                          {formatCurrency(sh.qris_difference)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: getDiffColor(Number(sh.transfer_difference || 0)) }}>
                          {formatCurrency(sh.transfer_difference)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton
            variant="outlined"
            startIcon={<PrintRounded />}
            disabled={!detailData?.day_closing}
            onClick={() => printEodThermal(detailData.day_closing, detailData.shifts)}
          >
            Print 80mm
          </AppButton>
          <AppButton
            startIcon={<PrintRounded />}
            disabled={!detailData?.day_closing}
            onClick={() => exportEodPdf(detailData.day_closing, detailData.shifts)}
          >
            Export PDF
          </AppButton>
          <AppButton variant="outlined" onClick={() => setDetailOpen(false)}>
            Tutup
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
