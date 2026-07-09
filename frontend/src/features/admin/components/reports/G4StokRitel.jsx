import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
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

const G4StokRitel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await reportService.getG4StokRitel();
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

  const { stockByCategory, lowStock, transactionSummary } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} hasDateFilter={false} />

      {/* Transaction Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">Total Produk</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{stockByCategory?.reduce((acc, c) => acc + c.total_products, 0) || 0}</Typography>}
          </AppCard>
        </Grid>
        <Grid item xs={6} md={3}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">Total Stok</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{stockByCategory?.reduce((acc, c) => acc + c.total_stock, 0) || 0}</Typography>}
          </AppCard>
        </Grid>
        <Grid item xs={6} md={3}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">Total Nilai</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>Rp {(stockByCategory?.reduce((acc, c) => acc + c.total_value, 0) || 0).toLocaleString("id-ID")}</Typography>}
          </AppCard>
        </Grid>
        <Grid item xs={6} md={3}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">Produk Low Stock</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800} color="#DC2626">{lowStock?.length || 0}</Typography>}
          </AppCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Stock by Category */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Stok per Kategori</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Kategori</TableCell>
                  <TableCell align="right">Produk</TableCell>
                  <TableCell align="right">Stok</TableCell>
                  <TableCell align="right">Nilai</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>
                  ))
                ) : stockByCategory?.length > 0 ? (
                  stockByCategory.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.category_name}</TableCell>
                      <TableCell align="right">{row.total_products}</TableCell>
                      <TableCell align="right">{row.total_stock}</TableCell>
                      <TableCell align="right">Rp {row.total_value?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>

        {/* Low Stock Products */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              <Chip label={lowStock?.length || 0} size="small" color="error" sx={{ mr: 1 }} />
              Produk Low Stock
            </Typography>
            {lowStock?.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {lowStock.length} produk berada di bawah minimum stok
              </Alert>
            )}
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Produk</TableCell>
                  <TableCell align="right">Stok</TableCell>
                  <TableCell align="right">Min</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>
                  ))
                ) : lowStock?.length > 0 ? (
                  lowStock.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.barcode}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={row.current_stock} size="small" color="error" />
                      </TableCell>
                      <TableCell align="right">{row.min_stock}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">Semua produk stok aman</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default G4StokRitel;
