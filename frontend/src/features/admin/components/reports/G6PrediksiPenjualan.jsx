import { useCallback, useEffect, useState } from "react";
import {
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

const G6PrediksiPenjualan = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const result = await reportService.getG6PrediksiPenjualan(filters);
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

  const { predictions, modelSummary } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} />

      {/* Model Summary */}
      <AppCard sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Model Performance</Typography>
        <Grid container spacing={2}>
          {loading ? (
            [...Array(2)].map((_, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton />
              </Grid>
            ))
          ) : modelSummary?.length > 0 ? (
            modelSummary.map((model, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Box sx={{ p: 2, backgroundColor: "#F9FAFB", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Model</Typography>
                  <Typography variant="body1" fontWeight={700}>{model.model_version || "-"}</Typography>
                  <Typography variant="caption" color="text.secondary">Prediksi</Typography>
                  <Typography variant="body2">{model.predictions_count}</Typography>
                  <Typography variant="caption" color="text.secondary">Avg Error</Typography>
                  <Typography variant="body2" color={model.avg_error_pct > 20 ? "error" : "success.main"}>
                    {model.avg_error_pct ? `${model.avg_error_pct.toFixed(1)}%` : "-"}
                  </Typography>
                </Box>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="text.secondary">Tidak ada data model</Typography>
            </Grid>
          )}
        </Grid>
      </AppCard>

      {/* Predictions Table */}
      <AppCard>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Riwayat Prediksi</Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
              <TableCell>Tanggal</TableCell>
              <TableCell>Produk</TableCell>
              <TableCell align="right">Prediksi</TableCell>
              <TableCell align="right">Aktual</TableCell>
              <TableCell align="right">Akurasi</TableCell>
              <TableCell>Model</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>
              ))
            ) : predictions?.length > 0 ? (
              predictions.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.prediction_date ? new Date(row.prediction_date).toLocaleDateString("id-ID") : "-"}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.product_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.barcode}</Typography>
                  </TableCell>
                  <TableCell align="right">{row.predicted_demand || 0}</TableCell>
                  <TableCell align="right">{row.actual_demand || "-"}</TableCell>
                  <TableCell align="right">
                    {row.accuracy_pct !== null ? (
                      <Chip
                        label={`${row.accuracy_pct}%`}
                        size="small"
                        color={row.accuracy_pct >= 80 ? "success" : row.accuracy_pct >= 50 ? "warning" : "error"}
                      />
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.model_version || "-"} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Tidak ada data prediksi</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AppCard>
    </Box>
  );
};

export default G6PrediksiPenjualan;
