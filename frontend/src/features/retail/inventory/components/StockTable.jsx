import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { DataTable, EmptyState, Loading } from "../../../../shared/components";
import { getStockStatusMeta } from "../utils/stockStatus";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const money = (value) => `Rp ${formatNumber(value)}`;

const StockTable = ({
  rows = [],
  loading = false,
  onDetail,
  onQuickAdjust,
  onDrillDown,
  rowMode = "PRODUCT",
}) => {
  const isProductMode = rowMode === "PRODUCT";

  const columns = isProductMode
    ? [
        {
          field: "name",
          headerName: "Produk",
          minWidth: 210,
          sortValue: (row) => row.name,
          render: (_, row) => (
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  {row.name}
                </Typography>
                {Number(row.is_active) === 0 && (
                  <Chip label="Nonaktif" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {row.barcode || "-"}
              </Typography>
            </Box>
          ),
        },
        {
          field: "category_name",
          headerName: "Kategori",
          minWidth: 180,
          sortValue: (row) => `${row.category_name} ${row.subcategory_name}`,
          render: (_, row) => (
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {row.category_name || "-"} / {row.subcategory_name || "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.brand_name || "-"}
              </Typography>
            </Box>
          ),
        },
        {
          field: "stock",
          headerName: "Stok",
          minWidth: 110,
          align: "right",
          sortValue: (row) => Number(row.stock || 0),
          render: (value, row) => {
            const status = getStockStatusMeta(value, row.min_stock);
            const textColor =
              status.color === "error" ? "#DC2626" : status.color === "warning" ? "#D97706" : "#111827";
            return (
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" fontWeight={800} sx={{ color: textColor }}>
                  {formatNumber(value)} {row.unit || ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Min: {formatNumber(row.min_stock)}
                </Typography>
              </Box>
            );
          },
        },
        {
          field: "stock_status",
          headerName: "Status",
          minWidth: 100,
          align: "center",
          sortValue: (row) => getStockStatusMeta(row.stock, row.min_stock).label,
          render: (_, row) => {
            const status = getStockStatusMeta(row.stock, row.min_stock);
            return (
              <Chip
                label={status.label}
                color={status.color}
                size="small"
                sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }}
              />
            );
          },
        },
        {
          field: "cost_price",
          headerName: "Modal",
          minWidth: 115,
          align: "right",
          sortValue: (row) => Number(row.cost_price || 0),
          render: (value) => (
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {money(value)}
            </Typography>
          ),
        },
        {
          field: "stock_value",
          headerName: "Nilai Stok",
          minWidth: 125,
          align: "right",
          sortValue: (row) => Number(row.stock_value || 0),
          render: (value) => (
            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>
              {money(value)}
            </Typography>
          ),
        },
      ]
    : [
        {
          field: "label",
          headerName:
            rowMode === "CATEGORY" ? "Kategori" : rowMode === "SUBCATEGORY" ? "Subkategori" : "Brand",
          minWidth: 200,
          render: (value) => (
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {value}
            </Typography>
          ),
        },
        {
          field: "product_count",
          headerName: "Produk",
          minWidth: 100,
          align: "center",
          sortValue: (row) => Number(row.product_count || 0),
          render: (value) => formatNumber(value),
        },
        {
          field: "stock",
          headerName: "Total Stok",
          minWidth: 120,
          align: "right",
          sortValue: (row) => Number(row.stock || 0),
          render: (value) => (
            <Typography variant="body2" fontWeight={700}>
              {formatNumber(value)}
            </Typography>
          ),
        },
        {
          field: "low_stock_count",
          headerName: "Stok Rendah",
          minWidth: 120,
          align: "center",
          sortValue: (row) => Number(row.low_stock_count || 0),
          render: (value) =>
            Number(value || 0) > 0 ? (
              <Chip
                label={formatNumber(value)}
                color="warning"
                size="small"
                sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                0
              </Typography>
            ),
        },
        {
          field: "stock_value",
          headerName: "Nilai Stok",
          minWidth: 140,
          align: "right",
          sortValue: (row) => Number(row.stock_value || 0),
          render: (value) => (
            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>
              {money(value)}
            </Typography>
          ),
        },
      ];

  const actions = isProductMode
    ? [
        { label: "Kartu Stok", icon: VisibilityRounded, onClick: onDetail },
        { label: "Adjust", icon: TuneRounded, onClick: onQuickAdjust },
      ]
    : [{ label: "Lihat Produk", icon: ArrowForwardRounded, onClick: onDrillDown }];

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={actions}
          dense
          emptyTitle="Belum ada data stok"
          emptyDescription="Ubah filter atau kata kunci pencarian."
        />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {loading ? (
          <Paper elevation={0} sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}>
            <Loading message="Memuat data stok..." />
          </Paper>
        ) : !rows.length ? (
          <EmptyState title="Belum ada data stok" description="Ubah filter atau kata kunci pencarian." />
        ) : (
          <Stack spacing={1.5}>
            {rows.map((row) => {
              const status = isProductMode ? getStockStatusMeta(row.stock, row.min_stock) : null;
              return (
                <Paper key={row.id} elevation={0} sx={{ p: 2, border: "1px solid #F9D5DC", borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} color="#7A2E3A" noWrap>
                        {row.label || row.name || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {isProductMode
                          ? `${row.category_name || "-"} / ${row.subcategory_name || "-"} • ${row.barcode || "-"}`
                          : `${formatNumber(row.product_count)} produk • Stok rendah: ${formatNumber(row.low_stock_count)}`}
                      </Typography>
                    </Box>
                    {isProductMode && status && (
                      <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 700, height: 22 }} />
                    )}
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid #FDE8EC" }}>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>
                        {formatNumber(row.stock)} {row.unit || "unit"}
                        {isProductMode ? ` (Min ${formatNumber(row.min_stock)})` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                        Nilai: {money(row.stock_value)}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      {isProductMode ? (
                        <>
                          <Tooltip title="Kartu Stok">
                            <IconButton size="small" color="primary" onClick={() => onDetail?.(row)}>
                              <VisibilityRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Adjust">
                            <IconButton size="small" color="primary" onClick={() => onQuickAdjust?.(row)}>
                              <TuneRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip title="Lihat Produk">
                          <IconButton size="small" color="primary" onClick={() => onDrillDown?.(row)}>
                            <ArrowForwardRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </>
  );
};

export default StockTable;
