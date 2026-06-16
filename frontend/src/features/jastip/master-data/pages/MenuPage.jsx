import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { MenuItem } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  ConfirmModal,
  PageHeader,
  SectionToolbar,
  StatusAlert,
} from "../../../../shared/components";
import MasterDataForm from "../components/MasterDataForm";
import MasterDataTable from "../components/MasterDataTable";
import { useMasterData } from "../hooks/useMasterData";

const MenuPage = () => {
  const {
    menus,
    vendors,
    loading,
    saving,
    error,
    refresh,
    createMenu,
    updateMenu,
    deleteMenu,
  } = useMasterData();
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return menus.filter((menu) => {
      const matchVendor =
        vendorFilter === "all" ||
        Number(menu.vendor_id) === Number(vendorFilter);
      const matchSearch =
        !keyword ||
        [menu.name, menu.vendor_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      return matchVendor && matchSearch;
    });
  }, [menus, search, vendorFilter]);

  const openCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    const message = selectedItem
      ? await updateMenu(selectedItem.id, payload)
      : await createMenu(payload);
    setSuccess(message);
    setFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const message = await deleteMenu(deleteTarget.id);
    setSuccess(message);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Master Data"
        title="Menus"
        description="Kelola menu harian yang terhubung ke vendor dan periode jastip."
        actions={
          <AppButton startIcon={<AddRounded />} onClick={openCreate}>
            Tambah Menu
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

      <AppCard
        contentSx={{
          p: { xs: 2, md: 3 },
          "&:last-child": { pb: { xs: 2, md: 3 } },
        }}
      >
        <SectionToolbar
          left={
            <>
              <AppTextField
                label="Cari menu"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
              <AppTextField
                select
                label="Vendor"
                value={vendorFilter}
                onChange={(event) => setVendorFilter(event.target.value)}
                sx={{ width: { xs: "100%", sm: 220 } }}
              >
                <MenuItem value="all">Semua Vendor</MenuItem>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </AppTextField>
            </>
          }
          right={
            <AppButton
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={refresh}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Refresh
            </AppButton>
          }
        />
        <MasterDataTable
          rows={filteredMenus}
          type="menu"
          loading={loading}
          onEdit={(item) => {
            setSelectedItem(item);
            setFormOpen(true);
          }}
          onDelete={setDeleteTarget}
        />
      </AppCard>

      <MasterDataForm
        open={formOpen}
        type="menu"
        item={selectedItem}
        vendors={vendors}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus menu"
        description={`Hapus menu ${deleteTarget?.name}?`}
        confirmText="Hapus"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default MenuPage;
