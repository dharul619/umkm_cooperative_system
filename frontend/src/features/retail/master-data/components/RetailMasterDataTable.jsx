import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataTable, EmptyState, Loading } from "../../../../shared/components";

const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const RetailMasterDataTable = ({ rows, type, loading, onEdit, onDelete }) => {
  const config = {
    category: {
      title: "Belum ada kategori",
      description: "Data kategori akan muncul di tabel ini.",
      mobileTitle: "Kategori",
      columns: [{ field: "name", headerName: "Nama Kategori", minWidth: 240 }],
    },
    subcategory: {
      title: "Belum ada subkategori",
      description: "Data subkategori akan muncul di tabel ini.",
      mobileTitle: "Subkategori",
      columns: [
        { field: "name", headerName: "Nama Subkategori", minWidth: 220 },
        { field: "category_name", headerName: "Kategori", minWidth: 200 },
      ],
    },
    brand: {
      title: "Belum ada brand",
      description: "Data brand akan muncul di tabel ini.",
      mobileTitle: "Brand",
      columns: [{ field: "name", headerName: "Nama Brand", minWidth: 240 }],
    },
    product: {
      title: "Belum ada produk",
      description: "Data produk akan muncul di tabel ini.",
      mobileTitle: "Produk",
      columns: [
        { field: "name", headerName: "Nama Produk", minWidth: 220 },
        {
          field: "subcategory_name",
          headerName: "Sub kategori",
          minWidth: 180,
        },
        { field: "brand_name", headerName: "Brand", minWidth: 160 },
        { field: "barcode", headerName: "Barcode", minWidth: 160 },
        // { field: "unit", headerName: "Satuan", minWidth: 100 },
        {
          field: "cost_price",
          headerName: "Harga Modal",
          minWidth: 140,
          render: money,
        },
        {
          field: "selling_price",
          headerName: "Harga Jual",
          minWidth: 140,
          render: money,
        },
        // { field: "min_stock", headerName: "Min Stok", minWidth: 100 },
      ],
    },
    supplier: {
      title: "Belum ada supplier",
      description: "Data supplier akan muncul di tabel ini.",
      mobileTitle: "Supplier",
      columns: [
        { field: "name", headerName: "Nama Supplier", minWidth: 220 },
        { field: "phone", headerName: "Telepon", minWidth: 160 },
        { field: "address", headerName: "Alamat", minWidth: 260 },
      ],
    },
  };

  const current = config[type] || config.category;
  const actions = [
    { label: "Edit", icon: EditRounded, onClick: onEdit },
    { label: "Hapus", icon: DeleteRounded, color: "error", onClick: onDelete },
  ];

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DataTable
          columns={current.columns}
          rows={rows}
          loading={loading}
          actions={actions}
          emptyTitle={current.title}
          emptyDescription={current.description}
        />
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {loading ? (
          <Paper
            elevation={0}
            sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}
          >
            <Loading message="Memuat data master ritel..." />
          </Paper>
        ) : !rows.length ? (
          <EmptyState title={current.title} description={current.description} />
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
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="#7A2E3A"
                    >
                      {row.name || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type === "subcategory"
                        ? row.category_name || "-"
                        : type === "product"
                          ? [row.subcategory_name, row.brand_name]
                              .filter(Boolean)
                              .join(" • ") || "-"
                          : type === "supplier"
                            ? row.phone || "-"
                            : row.description || "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexShrink: 0 }}>
                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Tooltip key={action.label} title={action.label}>
                          <IconButton
                            size="small"
                            color={action.color || "primary"}
                            onClick={() => action.onClick(row)}
                          >
                            <Icon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      );
                    })}
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

export default RetailMasterDataTable;
