import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { DataTable, EmptyState, Loading } from "../../../../shared/components";

const MasterDataTable = ({ rows, type, loading, onEdit, onDelete }) => {
  const config = {
    division: {
      title: "Belum ada divisi",
      mobileTitle: "Divisi",
      description: "Data master yang dibuat akan muncul di tabel ini.",
      columns: [{ field: "name", headerName: "Nama Divisi", minWidth: 220 }],
    },
    department: {
      title: "Belum ada departemen",
      mobileTitle: "Departemen",
      description: "Data master yang dibuat akan muncul di tabel ini.",
      columns: [
        { field: "name", headerName: "Nama Departemen", minWidth: 220 },
        { field: "division_name", headerName: "Divisi", minWidth: 220 },
      ],
    },
    vendor: {
      title: "Belum ada vendor",
      mobileTitle: "Vendor",
      description: "Data master yang dibuat akan muncul di tabel ini.",
      columns: [
        { field: "name", headerName: "Nama Vendor", minWidth: 220 },
        { field: "phone", headerName: "Telepon", minWidth: 180 },
        { field: "address", headerName: "Alamat", minWidth: 260 },
      ],
    },
    menu: {
      title: "Belum ada menu",
      mobileTitle: "Menu",
      description: "Data master yang dibuat akan muncul di tabel ini.",
      columns: [
        { field: "name", headerName: "Nama Menu", minWidth: 220 },
        { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
        {
          field: "base_price",
          headerName: "Harga Pokok",
          minWidth: 140,
          render: (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`,
        },
        {
          field: "jastip_price",
          headerName: "Harga Jastip",
          minWidth: 140,
          render: (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`,
        },
      ],
    },
  };

  const current = config[type] || config.division;
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
          <Paper elevation={0} sx={{ border: "1px solid #F9D5DC", borderRadius: 2 }}>
            <Loading message="Memuat data master..." />
          </Paper>
        ) : !rows.length ? (
          <EmptyState title={current.title} description={current.description} />
        ) : (
          <Stack spacing={1.5}>
            {rows.map((row) => (
              <Paper
                key={row.id}
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid #F9D5DC",
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A">
                      {row.name || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type === "department"
                        ? row.division_name || "-"
                        : type === "menu"
                          ? row.vendor_name || "-"
                          : type === "vendor"
                            ? row.phone || "-"
                            : row.description || "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexShrink: 0 }}>
                    {actions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <Tooltip key={action.label} title={action.label}>
                          <IconButton size="small" color={action.color || "primary"} onClick={() => action.onClick(row)}>
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

export default MasterDataTable;