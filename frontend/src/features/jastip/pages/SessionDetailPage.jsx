import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { Box, Grid, MenuItem, Typography } from "@mui/material";
import { AppButton, AppCard, AppTextField, DataTable, PageHeader, StatusAlert } from "../../../shared/components";
import { useMasterData } from "../master-data/hooks/useMasterData";
import { jastipService } from "../services/jastipService";

const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T") ? stringValue.split("T")[0] : stringValue.split(" ")[0];
};

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const SessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendors, menus } = useMasterData();
  const [session, setSession] = useState(null);
  const [sessionMenus, setSessionMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [sessionData, menuData, orderData] = await Promise.all([
          jastipService.getSessionById(id),
          jastipService.getSessionMenus(id),
          jastipService.getOrders(),
        ]);
        setSession(sessionData || null);
        setSessionMenus(Array.isArray(menuData) ? menuData : []);
        setOrders((Array.isArray(orderData) ? orderData : []).filter((item) => String(item.order_id) === String(id)));
      } catch (err) {
        setError(err.message || "Gagal memuat detail session");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const menuColumns = useMemo(() => ([
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "notes", headerName: "Notes", minWidth: 200 },
    { field: "jastip_price", headerName: "Harga", minWidth: 140, render: (value) => formatCurrency(value) },
  ]), []);

  const orderColumns = useMemo(() => ([
    { field: "member_name", headerName: "Member", minWidth: 180 },
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "qty", headerName: "Qty", minWidth: 90 },
    { field: "subtotal", headerName: "Subtotal", minWidth: 140, render: (value) => formatCurrency(value) },
  ]), []);

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title={`Detail Session ${formatDateOnly(session?.order_date)}`}
        description="Lihat menu yang sudah ditautkan dan order yang masuk pada session ini."
        actions={
          <AppButton variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate('/jastip/sessions')}>
            Kembali
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Tanggal</Typography>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A">{formatDateOnly(session?.order_date)}</Typography>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Status</Typography>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A">{session?.status || "-"}</Typography>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Order Masuk</Typography>
            <Typography variant="h5" fontWeight={800} color="#7A2E3A">{orders.length}</Typography>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Menu Session</Typography>
        <DataTable columns={menuColumns} rows={sessionMenus} loading={loading} emptyTitle="Belum ada menu" emptyDescription="Menu pada session ini belum diinput." />
      </AppCard>

      <AppCard>
        <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A" sx={{ mb: 1.5 }}>Order Masuk</Typography>
        <DataTable columns={orderColumns} rows={orders} loading={loading} emptyTitle="Belum ada order" emptyDescription="Belum ada member yang memesan pada session ini." />
      </AppCard>
    </>
  );
};

export default SessionDetailPage;
