import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Skeleton,
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

const G2PenjualanRitel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const result = await reportService.getG2PenjualanRitel(filters);
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

  const { summary, dailySummary, topProducts } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} />

      {/* Summary */}
      <AppCard sx={{ mb: 3, backgroundColor: "#EFF6FF", borderColor: "#93C5FD" }}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total Transaksi</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.total_transactions || 0}</Typography>}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total Penjualan</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>Rp {(summary?.total_penjualan || 0).toLocaleString("id-ID")}</Typography>}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total Profit</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800} color="#059669">Rp {(summary?.total_profit || 0).toLocaleString("id-ID")}</Typography>}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Koperasi Share</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800} color="#7E22CE">Rp {(summary?.total_kopi_share || 0).toLocaleString("id-ID")}</Typography>}
          </Grid>
        </Grid>
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
                  <TableCell align="right">Transaksi</TableCell>
                  <TableCell align="right">Penjualan</TableCell>
                  <TableCell align="right">Profit</TableCell>
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
                      <TableCell align="right">{row.transactions}</TableCell>
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

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Produk Terlaris</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Produk</TableCell>
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
                ) : topProducts?.length > 0 ? (
                  topProducts.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.product_name}</TableCell>
                      <TableCell align="right">{row.total_qty} {row.unit}</TableCell>
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

export default G2PenjualanRitel;
