import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { Box, Grid, MenuItem, Typography } from "@mui/material";
import { AppButton, AppCard, AppTextField, DataTable, PageHeader, StatusAlert } from "../../../shared/components";
import { useMasterData } from "../master-data/hooks/useMasterData";
import { jastipService } from "../services/jastipService";

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const { vendors, menus, loading: masterLoading } = useMasterData();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [selectedNotes, setSelectedNotes] = useState("");
  const [sessionMenus, setSessionMenus] = useState([]);
  const [saving, setSaving] = useState(false);

  const vendorMenus = useMemo(() => {
    return menus.filter((menu) => Number(menu.vendor_id) === Number(selectedVendorId) && Number(menu.is_active) === 1);
  }, [menus, selectedVendorId]);

  const selectedMenu = useMemo(() => {
    return menus.find((menu) => String(menu.id) === String(selectedMenuId));
  }, [menus, selectedMenuId]);

  const handleAddMenu = () => {
    if (!selectedMenuId) return;
    const existing = sessionMenus.find((item) => String(item.menu_id) === String(selectedMenuId));
    if (existing) {
      setError("Menu yang sama sudah dipilih untuk sesi ini.");
      return;
    }

    setSessionMenus((current) => [
      ...current,
      {
        menu_id: Number(selectedMenuId),
        menu_name: selectedMenu?.name || "-",
        vendor_name: vendors.find((vendor) => String(vendor.id) === String(selectedMenu?.vendor_id))?.name || "-",
        notes: selectedNotes.trim() || null,
        base_price: selectedMenu?.base_price || 0,
        jastip_price: selectedMenu?.jastip_price || 0,
      },
    ]);
    setSelectedMenuId("");
    setSelectedNotes("");
    setError("");
  };

  const handleRemoveMenu = (menuId) => {
    setSessionMenus((current) => current.filter((item) => String(item.menu_id) !== String(menuId)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sessionDate) {
      setError("Tanggal session harus diisi.");
      return;
    }
    if (!sessionMenus.length) {
      setError("Minimal satu menu harus ditambahkan ke session.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await jastipService.createSessionWithMenus({
        order_date: sessionDate,
        menus: sessionMenus.map((item) => ({
          menu_id: Number(item.menu_id),
          notes: item.notes || null,
        })),
      });
      setSuccess("Sesi jastip berhasil dibuka.");
      setSessionDate("");
      setSelectedVendorId("");
      setSelectedMenuId("");
      setSessionMenus([]);
      navigate(`/jastip/sessions/${response.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Gagal membuat sesi jastip");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "notes", headerName: "Notes", minWidth: 200 },
    { field: "base_price", headerName: "Harga Pokok", minWidth: 140, render: (value) => formatCurrency(value) },
    { field: "jastip_price", headerName: "Harga Jastip", minWidth: 140, render: (value) => formatCurrency(value) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Tambah Session"
        description="Buat session baru dan pilih menu dari vendor yang tersedia sebelum disimpan."
        actions={
          <AppButton variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate('/jastip/sessions')}>
            Kembali
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <AppCard>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} color="#7A2E3A">
            Form Session Baru
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "grid", gap: 0.75, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  Tanggal Session
                </Typography>
                <AppTextField
                  type="date"
                  value={sessionDate}
                  onChange={(event) => setSessionDate(event.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: { xs: "100%", md: 220 } }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "grid", gap: 0.75, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  Vendor
                </Typography>
                <AppTextField
                  select
                  value={selectedVendorId}
                  onChange={(event) => {
                    setSelectedVendorId(event.target.value);
                    setSelectedMenuId("");
                  }}
                  disabled={masterLoading}
                  SelectProps={{ displayEmpty: true }}
                  sx={{ minWidth: { xs: "100%", md: 280 } }}
                >
                  <MenuItem value="" disabled>
                    Pilih vendor
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </AppTextField>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "grid", gap: 0.75, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  Menu
                </Typography>
                <AppTextField
                  select
                  value={selectedMenuId}
                  onChange={(event) => setSelectedMenuId(event.target.value)}
                  disabled={!selectedVendorId}
                  SelectProps={{ displayEmpty: true }}
                  sx={{ minWidth: { xs: "100%", md: 280 } }}
                >
                  <MenuItem value="" disabled>
                    Pilih menu
                  </MenuItem>
                  {vendorMenus.map((menu) => (
                    <MenuItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </MenuItem>
                  ))}
                </AppTextField>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <AppTextField
                label="Notes"
                value={selectedNotes}
                onChange={(event) => setSelectedNotes(event.target.value)}
                multiline
                minRows={3}
                sx={{ minWidth: { xs: "100%", md: 340 } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <AppButton type="button" variant="outlined" startIcon={<AddRounded />} onClick={handleAddMenu} disabled={!selectedMenuId}>
              Tambah Menu
            </AppButton>
          </Box>

          <DataTable
            columns={columns}
            rows={sessionMenus}
            loading={false}
            emptyTitle="Belum ada menu dipilih"
            emptyDescription="Pilih vendor dan menu lalu tambahkan ke daftar session."
            actions={[
              {
                label: "Hapus",
                icon: DeleteRounded,
                color: "error",
                onClick: (row) => handleRemoveMenu(row.menu_id),
              },
            ]}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <AppButton type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Session"}
            </AppButton>
          </Box>
        </Box>
      </AppCard>
    </>
  );
};

export default CreateSessionPage;
