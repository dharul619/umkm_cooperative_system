import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { DataTable, EmptyState, Loading } from "../../../../shared/components";

const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const PurchaseTable = ({ rows, loading, onDetail }) => {
  const columns = [
    { field: "purchase_date", headerName: "Tanggal", minWidth: 140 },
    { field: "supplier_name", headerName: "Supplier", minWidth: 220 },
    {
      field: "total_amount",
      headerName: "Total",
      minWidth: 160,
      render: money,
    },
  ];

  const actions = [
    { label: "Detail", icon: VisibilityRounded, onClick: onDetail },
  ];

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={actions}
          emptyTitle="Belum ada pembelian"
          emptyDescription="Data pembelian akan muncul di tabel ini."
        />
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {loading ? (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}
          >
            <Loading message="Memuat data pembelian..." />
          </Paper>
        ) : !rows.length ? (
          <EmptyState
            title="Belum ada pembelian"
            description="Data pembelian akan muncul di tabel ini."
          />
        ) : (
          <Stack spacing={1.5}>
            {rows.map((row) => (
              <Paper
                key={row.id}
                elevation={0}
                sx={{ p: 2, border: "1px solid #F9D5DC", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography fontWeight={800} color="#7A2E3A">
                      {row.supplier_name || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {row.purchase_date || "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography fontWeight={800}>
                      {money(row.total_amount)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ cursor: "pointer" }}
                      onClick={() => onDetail(row)}
                    >
                      Detail
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </>
  );
};

export default PurchaseTable;
