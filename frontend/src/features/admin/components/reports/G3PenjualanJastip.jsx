import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AppCard from "../../../../shared/components/AppCard";
import ReportFilter from "./ReportFilter";
import { reportService } from "../../services/reportService";

const getPaymentColor = (status) => {
  switch (status) {
    case "PAID": return "success";
    case "PARTIAL": return "warning";
    case "UNPAID": return "error";
    default: return "default";
  }
};

const G3PenjualanJastip = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const result = await reportService.getG3PenjualanJastip(filters);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { summary, dailySummary, topMenus, paymentStatus } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} />

      {/* Summary */}
      <AppCard sx={{ mb: 3, backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total Order</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.total_orders || 0}</Typography>}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Coordinator</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.total_coordinators || 0}</Typography>}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total Penjualan</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>Rp {(summary?.total_penjualan || 0).toLocaleString("id-ID")}</Typography>}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total Profit</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800} color="#059669">Rp {(summary?.total_profit || 0).toLocaleString("id-ID")}</Typography>}
          </Grid>
        </Grid>
      </AppCard>

      {/* Payment Status */}
      <AppCard sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Status Pembayaran</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {loading ? (
            <Skeleton width={100} />
          ) : paymentStatus?.length > 0 ? (
            paymentStatus.map((status, i) => (
              <Chip
                key={i}
                label={`${status.payment_status}: ${status.count} (Rp ${status.amount?.toLocaleString("id-ID")})`}
                color={getPaymentColor(status.payment_status)}
                variant="outlined"
              />
            ))
          ) : (
            <Typography color="text.secondary">Tidak ada data</Typography>
          )}
        </Stack>
      </AppCard>

      <Grid container spacing={3}>
        {/* Daily Summary */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Penjualan Harian</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Tanggal</TableCell>
                  <TableCell align="right">Order</TableCell>
                  <TableCell align="right">Coordinator</TableCell>
                  <TableCell align="right">Penjualan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>
                  ))
                ) : dailySummary?.length > 0 ? (
                  dailySummary.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(row.date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell align="right">{row.total_orders}</TableCell>
                      <TableCell align="right">{row.coordinators}</TableCell>
                      <TableCell align="right">Rp {row.total_penjualan?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>

        {/* Top Menus */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Menu Terlaris</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Menu</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Penjualan</TableCell>
                  <TableCell align="right">Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>
                  ))
                ) : topMenus?.length > 0 ? (
                  topMenus.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.menu_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.vendor_name}</Typography>
                      </TableCell>
                      <TableCell align="right">{row.total_qty}</TableCell>
                      <TableCell align="right">Rp {row.total_penjualan?.toLocaleString("id-ID")}</TableCell>
                      <TableCell align="right">Rp {row.total_profit?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default G3PenjualanJastip;
