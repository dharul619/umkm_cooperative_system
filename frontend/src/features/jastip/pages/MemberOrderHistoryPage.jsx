import { useMemo, useState } from "react";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import { Box, Chip, Collapse, Grid, MenuItem, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { jsPDF } from "jspdf";
import {
  AppButton,
  AppCard,
  AppTextField,
  DataTable,
  PageHeader,
  SectionToolbar,
  StatusAlert,
  ConfirmModal
} from "../../../shared/components";
import { useMemberJastip } from "../hooks/useMemberJastip";
import { useAuth } from "../../auth/hooks/useAuth";
import { jastipService } from "../services/jastipService";

const orderStatusTone = {
  OPEN: "info",
  CONFIRMED: "success",
  ORDERED: "warning",
  DELIVERED: "success",
  DONE: "success",
  CANCELLED: "error",
};

const paymentTone = {
  UNPAID: "warning",
  PARTIAL: "info",
  PAID: "success",
  PENDING: "warning",
  PROCESSING: "info",
  SETTLED: "success",
  FAILED: "error",
  EXPIRED: "default",
};

const paymentMethodLabel = {
  CASH: "Tunai",
  QRIS: "QRIS",
};

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T") ? stringValue.split("T")[0] : stringValue.split(" ")[0];
};

const groupSessionOrders = (orders) => {
  const map = new Map();

  orders.forEach((order) => {
    const key = String(order.order_id);
    const current = map.get(key) || {
      order_id: order.order_id,
      order_date: order.order_date,
      session_status: order.session_status || order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      member_name: order.member_name,
      total_items: 0,
      total_qty: 0,
      total_subtotal: 0,
      total_profit: 0,
      menus: [],
    };

    current.total_items += 1;
    current.total_qty += Number(order.qty || 0);
    current.total_subtotal += Number(order.subtotal || 0);
    current.total_profit += Number(order.profit || 0);
    current.payment_status = order.payment_status || current.payment_status;
    current.payment_method = order.payment_method || current.payment_method;
    current.session_status = order.session_status || order.status || current.session_status;
    current.member_name = order.member_name || current.member_name;
    current.menus.push(order);

    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => String(b.order_date).localeCompare(String(a.order_date)));
};

const MemberOrderHistoryPage = () => {
  const { user } = useAuth();
  const memberId = Number(user?.id);
  const { myOrders, loading, error: fetchError, refresh } = useMemberJastip(memberId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const displayError = fetchError || error;

  const groupedSessions = useMemo(() => groupSessionOrders(myOrders), [myOrders]);

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return groupedSessions.filter((session) => {
      const matchStatus = statusFilter === "all" || session.session_status === statusFilter;
      const matchPayment = paymentFilter === "all" || session.payment_status === paymentFilter;
      const matchSearch =
        !keyword ||
        [session.order_date, session.session_status, session.payment_status, session.payment_method]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      return matchStatus && matchPayment && matchSearch;
    });
  }, [groupedSessions, paymentFilter, search, statusFilter]);

  const detailColumns = [
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 160 },
    { field: "qty", headerName: "Qty", minWidth: 90 },
    { field: "subtotal", headerName: "Subtotal", minWidth: 130, render: (value) => formatCurrency(value) },
    { field: "profit", headerName: "Profit", minWidth: 130, render: (value) => formatCurrency(value) },
  ];

  const handleEditQtyClick = (row) => {
    setEditTarget(row);
    setEditQty(row.qty);
  };

  const handleSaveQty = async () => {
    if (!editTarget) return;
    const qtyNum = Number(editQty);
    if (!qtyNum || qtyNum <= 0) {
      setError("Kuantitas harus lebih dari 0");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await jastipService.updateOrderDetail(editTarget.id, qtyNum);
      setSuccess("Kuantitas pesanan berhasil diubah.");
      setEditTarget(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal mengubah pesanan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await jastipService.deleteOrderDetail(deleteTarget.id);
      setSuccess("Item pesanan berhasil dihapus.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gagal menghapus pesanan");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = (session) => {
    const pdf = new jsPDF();
    const marginLeft = 14;
    let cursorY = 16;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("BUKTI TRANSAKSI", marginLeft, cursorY);
    cursorY += 7;

    pdf.setFontSize(11);
    pdf.text("Koperasi 245", marginLeft, cursorY);
    cursorY += 6;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Order ID: ${session.order_id}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Tanggal Session: ${formatDateOnly(session.order_date)}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Status Session: ${session.session_status}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Status Pembayaran: ${session.payment_status}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Metode Bayar: ${paymentMethodLabel[session.payment_method] || "-"}`, marginLeft, cursorY);
    cursorY += 10;

    pdf.setFont("helvetica", "bold");
    pdf.text("Rincian Item", marginLeft, cursorY);
    cursorY += 6;
    pdf.setFont("helvetica", "normal");

    session.menus.forEach((item, index) => {
      const line = `${index + 1}. ${item.menu_name} | Qty: ${item.qty} | Subtotal: ${formatCurrency(item.subtotal)}`;
      pdf.text(line, marginLeft, cursorY);
      cursorY += 6;
      if (cursorY > 270) {
        pdf.addPage();
        cursorY = 16;
      }
    });

    cursorY += 4;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total bayar: ${formatCurrency(session.total_subtotal + 2000)}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Profit session: ${formatCurrency(session.total_profit)}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Coordinator share: ${formatCurrency(Math.floor(Number(session.total_profit || 0) / 2))}`, marginLeft, cursorY);
    cursorY += 6;
    pdf.text(`Koperasi share: ${formatCurrency(Number(session.total_profit || 0) - Math.floor(Number(session.total_profit || 0) / 2))}`, marginLeft, cursorY);

    pdf.save(`bukti-transaksi-${session.order_id}.pdf`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Cooperative Member"
        title="Riwayat Order"
        description="Lihat session yang pernah Anda pesan. Klik salah satu session untuk membuka detail item, status transaksi, dan bukti transaksi."
        actions={
          <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh}>
            Refresh
          </AppButton>
        }
      />

      <StatusAlert severity="error">{displayError}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <SectionToolbar
          left={
            <>
              <AppTextField
                label="Cari session"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
              <AppTextField
                select
                label="Status Session"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ width: { xs: "100%", sm: 180 } }}
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                <MenuItem value="ORDERED">ORDERED</MenuItem>
                <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                <MenuItem value="DONE">DONE</MenuItem>
                <MenuItem value="CANCELLED">CANCELLED</MenuItem>
              </AppTextField>
              <AppTextField
                select
                label="Pembayaran"
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                sx={{ width: { xs: "100%", sm: 180 } }}
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="UNPAID">UNPAID</MenuItem>
                <MenuItem value="PARTIAL">PARTIAL</MenuItem>
                <MenuItem value="PAID">PAID</MenuItem>
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="PROCESSING">PROCESSING</MenuItem>
                <MenuItem value="SETTLED">SETTLED</MenuItem>
                <MenuItem value="FAILED">FAILED</MenuItem>
                <MenuItem value="EXPIRED">EXPIRED</MenuItem>
              </AppTextField>
            </>
          }
          right={
            <AppButton variant="outlined" startIcon={<HistoryRounded />} onClick={refresh}>
              Muat Ulang
            </AppButton>
          }
        />

        <Stack spacing={1.5}>
          {filteredSessions.map((session) => {
            const expanded = String(expandedSessionId) === String(session.order_id);
            const proofPayment = session.menus.find((item) => item.payment_status === "SETTLED") || session.menus[0] || null;
            const canModify = session.session_status === "OPEN" && !["SETTLED", "PROCESSING"].includes(session.payment_status);

            return (
              <AppCard key={session.order_id} sx={{ border: "1px solid #F9D5DC" }}>
                <Box
                  onClick={() => setExpandedSessionId(expanded ? null : session.order_id)}
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A">
                      Sesi {formatDateOnly(session.order_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {session.total_items} item, {session.total_qty} qty, total {formatCurrency(session.total_subtotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Metode: {paymentMethodLabel[session.payment_method] || "-"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Chip size="small" label={session.payment_status} color={paymentTone[session.payment_status] || "default"} />
                    <Chip size="small" label={session.session_status} color={orderStatusTone[session.session_status] || "default"} />
                    {expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                  </Stack>
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed #F9D5DC" }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <AppCard sx={{ height: "100%" }}>
                          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                            Total Item
                          </Typography>
                          <Typography variant="h4" fontWeight={800} color="#7A2E3A">
                            {session.total_items}
                          </Typography>
                        </AppCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <AppCard sx={{ height: "100%" }}>
                          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                            Total Nominal
                          </Typography>
                          <Typography variant="h4" fontWeight={800} color="#7A2E3A">
                            {formatCurrency(session.total_subtotal)}
                          </Typography>
                        </AppCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <AppCard sx={{ height: "100%" }}>
                          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                            Status Transaksi
                          </Typography>
                          <Typography variant="h4" fontWeight={800} color="#7A2E3A">
                            {session.payment_status}
                          </Typography>
                        </AppCard>
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>
                      Detail Pesanan
                    </Typography>
                    <DataTable
                      columns={detailColumns}
                      rows={session.menus}
                      loading={loading}
                      emptyTitle="Tidak ada detail"
                      emptyDescription="Detail order untuk session ini belum tersedia."
                      actions={[
                        {
                          label: "Ubah Qty",
                          icon: EditRounded,
                          color: "primary",
                          onClick: (row) => handleEditQtyClick(row),
                          show: () => canModify,
                        },
                        {
                          label: "Hapus",
                          icon: DeleteRounded,
                          color: "error",
                          onClick: (row) => handleDeleteClick(row),
                          show: () => canModify,
                        }
                      ]}
                    />

                    <Box sx={{ mt: 2, p: 2, borderRadius: 1, border: "1px solid", borderColor: "divider", backgroundColor: "#FFFDFC" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          Bukti Transaksi
                        </Typography>
                        <AppButton startIcon={<DownloadRounded />} variant="outlined" onClick={() => downloadPdf(session)}>
                          PDF
                        </AppButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={0.75}>
                            <Typography variant="body2" color="text.secondary">Order ID: {session.order_id}</Typography>
                            <Typography variant="body2" color="text.secondary">Reference: {proofPayment?.external_reference || "-"}</Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={0.75}>
                            <Typography variant="body2" color="text.secondary">Total bayar: {formatCurrency(session.total_subtotal + 2000)}</Typography>
                            <Typography variant="body2" color="text.secondary">Profit session: {formatCurrency(session.total_profit)}</Typography>
                            <Typography variant="body2" color="text.secondary">Coordinator share: {formatCurrency(Math.floor(Number(session.total_profit || 0) / 2))}</Typography>
                            <Typography variant="body2" color="text.secondary">Koperasi share: {formatCurrency(Number(session.total_profit || 0) - Math.floor(Number(session.total_profit || 0) / 2))}</Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Collapse>
              </AppCard>
            );
          })}
        </Stack>
      </AppCard>

      {/* Edit Quantity Dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>Ubah Jumlah Pesanan</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Masukkan jumlah pesanan baru untuk <strong>{editTarget?.menu_name}</strong>:
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Kuantitas"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={saving}>Batal</Button>
          <Button onClick={handleSaveQty} disabled={saving} variant="contained" color="primary">Simpan</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Item Pesanan"
        description={`Apakah Anda yakin ingin menghapus ${deleteTarget?.menu_name} dari pesanan Anda?`}
        confirmText="Hapus"
        tone="error"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default MemberOrderHistoryPage;
