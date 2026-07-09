import { useCallback, useState } from "react";
import {
  Box,
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

const StatBox = ({ label, value, color = "#7A2E3A", loading }) => (
  <Box sx={{ textAlign: "center", p: 2 }}>
    <Typography variant="caption" color="text.secondary" fontWeight={600}>
      {label}
    </Typography>
    {loading ? (
      <Skeleton />
    ) : (
      <Typography variant="h5" fontWeight={800} color={color}>
        Rp {value?.toLocaleString("id-ID") || 0}
      </Typography>
    )}
  </Box>
);

const G1KeuanganGabungan = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const result = await reportService.getG1KeuanganGabungan(filters);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useState(() => {
    fetchData();
  }, []);

  const { summary, retailMonthly, jastipMonthly } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}>
            <Typography variant="subtitle2" fontWeight={700} color="#166534" gutterBottom>
              Ritel
            </Typography>
            <Stack direction="row" spacing={2}>
              <StatBox label="Transaksi" value={summary?.retail?.transactions} loading={loading} />
              <StatBox label="Penjualan" value={summary?.retail?.penjualan} loading={loading} />
              <StatBox label="Profit" value={summary?.retail?.profit} color="#059669" loading={loading} />
            </Stack>
          </AppCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <AppCard sx={{ backgroundColor: "#EFF6FF", borderColor: "#93C5FD" }}>
            <Typography variant="subtitle2" fontWeight={700} color="#1E40AF" gutterBottom>
              Jastip
            </Typography>
            <Stack direction="row" spacing={2}>
              <StatBox label="Transaksi" value={summary?.jastip?.transactions} loading={loading} />
              <StatBox label="Penjualan" value={summary?.jastip?.penjualan} loading={loading} />
              <StatBox label="Profit" value={summary?.jastip?.profit} color="#2563EB" loading={loading} />
            </Stack>
          </AppCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <AppCard sx={{ backgroundColor: "#FDF4FF", borderColor: "#E879F9" }}>
            <Typography variant="subtitle2" fontWeight={700} color="#7E22CE" gutterBottom>
              GABUNGAN
            </Typography>
            <Stack direction="row" spacing={2}>
              <StatBox label="Total Transaksi" value={summary?.gabungan?.total_transactions} loading={loading} />
              <StatBox label="Total Penjualan" value={summary?.gabungan?.total_penjualan} loading={loading} />
              <StatBox label="Total Profit" value={summary?.gabungan?.total_profit} color="#A855F7" loading={loading} />
            </Stack>
          </AppCard>
        </Grid>
      </Grid>

      {/* Monthly Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Ritel - Per Bulan
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Bulan</TableCell>
                  <TableCell align="right">Transaksi</TableCell>
                  <TableCell align="right">Penjualan</TableCell>
                  <TableCell align="right">Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                    </TableRow>
                  ))
                ) : retailMonthly?.length > 0 ? (
                  retailMonthly.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell align="right">{row.transactions}</TableCell>
                      <TableCell align="right">Rp {row.penjualan?.toLocaleString("id-ID")}</TableCell>
                      <TableCell align="right">Rp {row.profit?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Jastip - Per Bulan
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Bulan</TableCell>
                  <TableCell align="right">Transaksi</TableCell>
                  <TableCell align="right">Penjualan</TableCell>
                  <TableCell align="right">Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                    </TableRow>
                  ))
                ) : jastipMonthly?.length > 0 ? (
                  jastipMonthly.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell align="right">{row.transactions}</TableCell>
                      <TableCell align="right">Rp {row.penjualan?.toLocaleString("id-ID")}</TableCell>
                      <TableCell align="right">Rp {row.profit?.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default G1KeuanganGabungan;
