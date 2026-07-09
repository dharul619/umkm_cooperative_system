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

const G5PembelianRitel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const result = await reportService.getG5PembelianRitel(filters);
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

  const { summary, dailySummary, bySupplier, topProducts } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} />

      {/* Summary */}
      <AppCard sx={{ mb: 3, backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={6}>
            <Typography variant="caption" color="text.secondary">Total Pembelian</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.total_purchases || 0}</Typography>}
          </Grid>
          <Grid item xs={6} md={6}>
            <Typography variant="caption" color="text.secondary">Total Pengeluaran</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>Rp {(summary?.total_amount || 0).toLocaleString("id-ID")}</Typography>}
          </Grid>
        </Grid>
      </AppCard>

      <Grid container spacing={3}>
        {/* Daily Summary */}
        <Grid item xs={12} md={4}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Pembelian Harian</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Tanggal</TableCell>
                  <TableCell align="right">Jumlah</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>
                  ))
                ) : dailySummary?.length > 0 ? (
                  dailySummary.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(row.date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell align="right">{row.total_purchases}</TableCell>
                      <TableCell align="right">Rp {row.total_amount?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>

        {/* By Supplier */}
        <Grid item xs={12} md={4}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Per Supplier</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Pembelian</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>
                  ))
                ) : bySupplier?.length > 0 ? (
                  bySupplier.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.supplier_name || "-"}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.phone}</Typography>
                      </TableCell>
                      <TableCell align="right">{row.total_purchases}</TableCell>
                      <TableCell align="right">Rp {row.total_amount?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={4}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Produk Sering Dibeli</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Produk</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>
                  ))
                ) : topProducts?.length > 0 ? (
                  topProducts.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.barcode}</Typography>
                      </TableCell>
                      <TableCell align="right">{row.total_qty} {row.unit}</TableCell>
                      <TableCell align="right">Rp {row.total_amount?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default G5PembelianRitel;
