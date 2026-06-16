import { useEffect, useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import TimerRounded from "@mui/icons-material/TimerRounded";
import { Box, Grid, MenuItem, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  ConfirmModal,
  DataTable,
  PageHeader,
  StatusAlert,
} from "../../../shared/components";
import { useJastipSessions } from "../hooks/useJastipSessions";
import { useMasterData } from "../master-data/hooks/useMasterData";
import { jastipService } from "../services/jastipService";

const statusLabel = {
  OPEN: "Open",
  CONFIRMED: "Confirmed",
  ORDERED: "Ordered",
  DELIVERED: "Delivered",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T")
    ? stringValue.split("T")[0]
    : stringValue.split(" ")[0];
};

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const OpenSessionPage = () => {
  const { menus, vendors } = useMasterData();
  const {
    sessions,
    openSession,
    loading,
    saving,
    error,
    refresh,
    createSession,
    closeSession,
  } = useJastipSessions();
  const [success, setSuccess] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [selectedNotes, setSelectedNotes] = useState("");
  const [closeTarget, setCloseTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [sessionMenus, setSessionMenus] = useState([]);
  const [sessionMenusLoading, setSessionMenusLoading] = useState(false);

  useEffect(() => {
    if (openSession?.id) {
      setSelectedSessionId((current) => current || String(openSession.id));
    }
  }, [openSession?.id]);

  useEffect(() => {
    const loadSessionMenus = async () => {
      if (!selectedSessionId) {
        setSessionMenus([]);
        return;
      }

      try {
        setSessionMenusLoading(true);
        const data = await jastipService.getSessionMenus(selectedSessionId);
        setSessionMenus(Array.isArray(data) ? data : []);
      } catch (err) {
        setSessionMenus([]);
      } finally {
        setSessionMenusLoading(false);
      }
    };

    loadSessionMenus();
  }, [selectedSessionId]);

  const activeMenus = useMemo(() => {
    return menus
      .filter((menu) => Number(menu.is_active) === 1)
      .map((menu) => ({
        ...menu,
        vendor_name:
          vendors.find((vendor) => Number(vendor.id) === Number(menu.vendor_id))
            ?.name || "-",
      }));
  }, [menus, vendors]);

  const visibleMenus = useMemo(() => {
    return activeMenus.filter((menu) => {
      const matchVendor =
        selectedVendorFilter === "all" ||
        Number(menu.vendor_id) === Number(selectedVendorFilter);
      return matchVendor;
    });
  }, [activeMenus, selectedVendorFilter]);

  const menuOptions = useMemo(() => visibleMenus, [visibleMenus]);

  const selectedMenuLabel = useMemo(() => {
    const menu = menuOptions.find(
      (item) => String(item.id) === String(selectedMenuId),
    );
    if (!menu) return "";
    const vendorName =
      vendors.find((vendor) => Number(vendor.id) === Number(menu.vendor_id))
        ?.name || "-";
    return `${menu.name} - ${vendorName}`;
  }, [menuOptions, selectedMenuId, vendors]);

  const handleCreateSession = async (event) => {
    event.preventDefault();
    if (!sessionDate) return;
    await createSession({ order_date: sessionDate });
    setSuccess("Sesi jastip berhasil dibuka.");
  };

  const handleCloseSession = async () => {
    if (!closeTarget) return;
    await closeSession(closeTarget.id);
    setSuccess(
      `Sesi ${formatDateOnly(closeTarget.order_date)} berhasil ditutup.`,
    );
    setCloseTarget(null);
  };

  const handleAddMenuFromMaster = async () => {
    if (!selectedSessionId || !selectedMenuId) return;

    try {
      await jastipService.addSessionMenu({
        session_id: Number(selectedSessionId),
        menu_id: Number(selectedMenuId),
        notes: selectedNotes.trim() || null,
      });
      setSelectedMenuId("");
      setSelectedNotes("");
      setSuccess("Menu master berhasil ditautkan ke sesi yang dipilih.");
      await refresh();
      const latestMenus = await jastipService.getSessionMenus(selectedSessionId);
      setSessionMenus(Array.isArray(latestMenus) ? latestMenus : []);
    } catch (err) {
      if (err?.response?.status === 409) {
        const existing = err.response.data?.existing;
        setReplaceTarget({
          session_id: Number(selectedSessionId),
          menu_id: Number(selectedMenuId),
          notes: selectedNotes.trim() || null,
          existing,
          label: selectedMenuLabel,
        });
        return;
      }
      throw err;
    }
  };

  const handleConfirmReplace = async () => {
    if (!replaceTarget?.existing) return;
    await jastipService.updateSessionMenu(replaceTarget.existing.id, {
      notes: replaceTarget.notes,
    });
    setSuccess("Menu yang sudah ada berhasil diperbarui.");
    setReplaceTarget(null);
    setSelectedMenuId("");
    setSelectedNotes("");
    await refresh();
    const latestMenus = await jastipService.getSessionMenus(selectedSessionId);
    setSessionMenus(Array.isArray(latestMenus) ? latestMenus : []);
  };

  const handleDeleteMenu = async () => {
    if (!deleteTarget) return;
    await jastipService.removeSessionMenu(deleteTarget.id);
    setSuccess("Menu berhasil dilepas dari sesi aktif.");
    setDeleteTarget(null);
    await refresh();
    const latestMenus = await jastipService.getSessionMenus(selectedSessionId);
    setSessionMenus(Array.isArray(latestMenus) ? latestMenus : []);
  };

  const menuColumns = [
    { field: "menu_name", headerName: "Menu", minWidth: 220 },
    { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
    { field: "notes", headerName: "Notes", minWidth: 200 },
    {
      field: "base_price",
      headerName: "Harga Pokok",
      minWidth: 140,
      render: (value) => formatCurrency(value),
    },
    {
      field: "jastip_price",
      headerName: "Harga Jastip",
      minWidth: 140,
      render: (value) => formatCurrency(value),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Jastip Coordinator"
        title="Open Session"
        description="Buka sesi jastip harian dan pilih menu dari master menu tanpa membuat menu ulang."
        actions={
          <AppButton
            startIcon={<AddRounded />}
            onClick={refresh}
            variant="outlined"
          >
            Refresh
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert
        severity="success"
        show={!!success}
        onClose={() => setSuccess("")}
      >
        {success}
      </StatusAlert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <AppCard sx={{ height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventAvailableRounded sx={{ color: "#C93F58" }} />
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight={700}
              >
                Sesi Aktif
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#7A2E3A"
              sx={{ mt: 1 }}
            >
              {openSession
                ? formatDateOnly(openSession.order_date)
                : "Belum ada sesi aktif"}
            </Typography>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }} sx={{ mt: 2 }}>
        <Typography
          variant="subtitle1"
          fontWeight={800}
          color="#7A2E3A"
          sx={{ mb: 1.5 }}
        >
          Tambahkan Menu Master ke Sesi
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <AppTextField
              select
              label="Pilih Sesi"
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              disabled={!sessions.length}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="" disabled>
                Pilih sesi
              </MenuItem>
              {sessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  {formatDateOnly(session.order_date)} - {session.status}
                </MenuItem>
              ))}
            </AppTextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <AppTextField
              select
              label="Filter Vendor"
              value={selectedVendorFilter}
              onChange={(event) => setSelectedVendorFilter(event.target.value)}
              disabled={!selectedSessionId}
            >
              <MenuItem value="all">Semua Vendor</MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </MenuItem>
              ))}
            </AppTextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <AppTextField
              select
              label="Pilih Menu"
              value={selectedMenuId}
              onChange={(event) => setSelectedMenuId(event.target.value)}
              disabled={!selectedSessionId}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 250 }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "#9A9A9A" }}>
                        Pilih menu master
                      </span>
                    );
                  }
                  return selectedMenuLabel || "Pilih menu master";
                },
                MenuProps: {
                  PaperProps: {
                    sx: { minWidth: 360 },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                Pilih menu
              </MenuItem>
              {menuOptions.map((menu) => (
                <MenuItem key={menu.id} value={menu.id}>
                  {menu.name} - {vendors.find((vendor) => Number(vendor.id) === Number(menu.vendor_id))?.name || "-"}
                </MenuItem>
              ))}
            </AppTextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <AppTextField
              label="Notes"
              value={selectedNotes}
              onChange={(event) => setSelectedNotes(event.target.value)}
              disabled={!selectedSessionId}
              multiline
              minRows={3}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <AppButton
            onClick={handleAddMenuFromMaster}
            disabled={!selectedSessionId || !selectedMenuId || saving}
            startIcon={<AddRounded />}
          >
            Tambah ke Sesi
          </AppButton>
        </Box>

        <DataTable
          columns={menuColumns}
          rows={sessionMenus}
          loading={loading || sessionMenusLoading}
          emptyTitle="Belum ada menu di sesi aktif"
          emptyDescription="Menu master dipilih untuk sesi berjalan, bukan dibuat ulang."
          actions={[
            {
              label: "Hapus",
              icon: DeleteRounded,
              color: "error",
              onClick: (row) => setDeleteTarget(row),
            },
          ]}
        />
      </AppCard>

      <ConfirmModal
        open={!!replaceTarget}
        title="Menu sudah ada"
        description={`Menu ${replaceTarget?.label || "yang dipilih"} sudah ada di sesi ini. Apakah Anda ingin memperbarui notes-nya?`}
        confirmText="Update"
        tone="warning"
        loading={saving}
        onClose={() => setReplaceTarget(null)}
        onConfirm={handleConfirmReplace}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus menu dari sesi"
        description={`Hapus menu ${deleteTarget?.menu_name} dari sesi aktif? Ini tidak menghapus data menu master.`}
        confirmText="Hapus"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMenu}
      />
    </>
  );
};

export default OpenSessionPage;
