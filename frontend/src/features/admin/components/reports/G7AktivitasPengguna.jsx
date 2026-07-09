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

const G7AktivitasPengguna = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const result = await reportService.getG7AktivitasPengguna(filters);
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

  const { summary, byUser, byDate } = data || {};

  return (
    <Box>
      <ReportFilter onFilter={fetchData} loading={loading} />

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">Total Aktivitas</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.total_activities || 0}</Typography>}
          </AppCard>
        </Grid>
        <Grid item xs={4}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">User Aktif</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.active_users || 0}</Typography>}
          </AppCard>
        </Grid>
        <Grid item xs={4}>
          <AppCard>
            <Typography variant="caption" color="text.secondary">Hari Aktif</Typography>
            {loading ? <Skeleton /> : <Typography variant="h5" fontWeight={800}>{summary?.active_days || 0}</Typography>}
          </AppCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* By User */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Aktivitas per User</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Aktivitas</TableCell>
                  <TableCell align="right">Terakhir</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>
                  ))
                ) : byUser?.length > 0 ? (
                  byUser.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.name || "-"}</Typography>
                        <Typography variant="caption" color="text.secondary">@{row.username}</Typography>
                      </TableCell>
                      <TableCell>{row.role_name || "-"}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="#7A2E3A">{row.activity_count}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {row.last_activity ? new Date(row.last_activity).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">Tidak ada data</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </AppCard>
        </Grid>

        {/* By Date */}
        <Grid item xs={12} md={6}>
          <AppCard>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Aktivitas per Hari</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>Tanggal</TableCell>
                  <TableCell align="right">Aktivitas</TableCell>
                  <TableCell align="right">User Aktif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>
                  ))
                ) : byDate?.length > 0 ? (
                  byDate.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(row.date).toLocaleDateString("id-ID", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</TableCell>
                      <TableCell align="right">{row.activity_count}</TableCell>
                      <TableCell align="right">{row.active_users}</TableCell>
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

export default G7AktivitasPengguna;
