import { useMemo, useState } from "react";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { Chip, Grid, MenuItem, Stack, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  PageHeader,
  SectionToolbar,
  StatusAlert,
  DataTable,
} from "../../../shared/components";
import { useJastipOrders } from "../hooks/useJastipOrders";

const paymentTone = {
  PENDING: "warning",
  PROCESSING: "info",
  SETTLED: "success",
  FAILED: "error",
  EXPIRED: "default",
};

const orderStatusTone = {
  OPEN: "info",
  CONFIRMED: "success",
  ORDERED: "warning",
  DELIVERED: "success",
  DONE: "success",
  CANCELLED: "error",
};

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T") ? stringValue.split("T")[0] : stringValue.split(" ")[0];
};

const OrdersPage = () => {
  const { orders, loading, error, refresh } = useJastipOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [success, setSuccess] = useState("");

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = statusFilter === "all" || order.status === statusFilter;
      const matchPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
      const matchSearch =
        !keyword ||
        [order.session_date, order.member_name, order.vendor_name, order.menu_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      return matchStatus && matchPayment && matchSearch;
    });
  }, [orders, paymentFilter, search, statusFilter]);

  const columns = [
    {
      field: "session_date",
      headerName: "Sesi",
      minWidth: 120,
      render: (value) => formatDateOnly(value),
    },
    { field: "member_name", headerName: "Member", minWidth: 180 },
    { field: "menu_name", headerName: "Menu", minWidth: 180 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    {
      field: "qty",
      headerName: "Qty",
      minWidth: 90,
      render: (value) => `${value} item`,
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      minWidth: 140,
      render: (value) => formatCurrency(value),
    },
    {
      field: "payment_status",
      headerName: "Pembayaran",
      minWidth: 150,
      render: (value) => (
        <Chip size="small" label={value} color={paymentTone[value] || "default"} />
      ),
    },
    {
      field: "status",
      headerName: "Status Order",
      minWidth: 160,
      render: (value) => (
        <Chip size="small" label={value} color={orderStatusTone[value] || "default"} />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Orders"
        description="Pantau order masuk, status pembayaran, dan progres pemrosesan per sesi jastip."
        actions={
          <AppButton startIcon={<AssignmentRounded />}>
            Export Rekap
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <SectionToolbar
          left={
            <>
              <AppTextField
                label="Cari order"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
              <AppTextField
                select
                label="Status Order"
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
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="PROCESSING">PROCESSING</MenuItem>
                <MenuItem value="SETTLED">SETTLED</MenuItem>
                <MenuItem value="FAILED">FAILED</MenuItem>
                <MenuItem value="EXPIRED">EXPIRED</MenuItem>
              </AppTextField>
            </>
          }
          right={
            <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={() => refresh().then(() => setSuccess("Data order diperbarui."))}>
              Refresh
            </AppButton>
          }
        />

        <DataTable
          columns={columns}
          rows={filteredOrders}
          loading={loading}
          emptyTitle="Belum ada order"
          emptyDescription="Order yang masuk ke sesi jastip akan muncul di sini."
        />
      </AppCard>

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Order Open
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#7A2E3A">
                {orders.filter((order) => order.status === "OPEN").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order yang masih menunggu konfirmasi.
              </Typography>
            </Stack>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Paid Orders
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#7A2E3A">
                {orders.filter((order) => order.payment_status === "SETTLED").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order yang pembayaran daringnya sudah settle.
              </Typography>
            </Stack>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                Total Nilai
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#7A2E3A">
                {formatCurrency(orders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total nominal seluruh order yang tersimpan di database.
              </Typography>
            </Stack>
          </AppCard>
        </Grid>
      </Grid>
    </>
  );
};

export default OrdersPage;
