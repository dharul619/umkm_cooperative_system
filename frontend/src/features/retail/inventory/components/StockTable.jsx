import { Box, Paper, Stack, Typography } from "@mui/material";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { DataTable, EmptyState, Loading } from "../../../../shared/components";

const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const StockTable = ({ rows, loading, onDetail, rowMode = "PRODUCT" }) => {
  const columns =
    rowMode === "PRODUCT"
      ? [
          { field: "name", headerName: "Produk", minWidth: 220 },
          { field: "barcode", headerName: "Barcode", minWidth: 160 },
          { field: "category_name", headerName: "Kategori", minWidth: 160 },
          { field: "subcategory_name", headerName: "Subkategori", minWidth: 160 },
          { field: "brand_name", headerName: "Brand", minWidth: 140 },
          {
            field: "stock",
            headerName: "Stok",
            minWidth: 120,
            render: (value) => Number(value || 0),
          },
          {
            field: "cost_price",
            headerName: "Modal",
            minWidth: 140,
            render: money,
          },
        ]
      : [
          { field: "label", headerName: rowMode === "CATEGORY" ? "Kategori" : rowMode === "SUBCATEGORY" ? "Subkategori" : "Brand", minWidth: 220 },
          {
            field: "product_count",
            headerName: "Produk",
            minWidth: 120,
            render: (value) => Number(value || 0),
          },
          {
            field: "stock",
            headerName: "Total Stok",
            minWidth: 140,
            render: (value) => Number(value || 0),
          },
        ];

  const actions = [{ label: "Detail", icon: VisibilityRounded, onClick: onDetail }];

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={actions}
          emptyTitle="Belum ada data stok"
          emptyDescription="Data stok akan muncul di sini."
        />
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {loading ? (
          <Paper elevation={0} sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}>
            <Loading message="Memuat data stok..." />
          </Paper>
        ) : !rows.length ? (
          <EmptyState title="Belum ada data stok" description="Data stok akan muncul di sini." />
        ) : (
          <Stack spacing={1.5}>
            {rows.map((row) => (
              <Paper key={row.id} elevation={0} sx={{ p: 2, border: "1px solid #F9D5DC", borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
                  <Box>
                    <Typography fontWeight={800} color="#7A2E3A">{row.label || row.name || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.subtitle || row.barcode || "-"}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography fontWeight={800}>{Number(row.stock || 0)}</Typography>
                    <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }} onClick={() => onDetail(row)}>
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

export default StockTable;
