import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
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

const VendorPage = () => {
  const {
    vendors,
    loading,
    saving,
    error,
    refresh,
    createVendor,
    updateVendor,
    deleteVendor,
  } = useMasterData();
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredVendors = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return vendors;
    return vendors.filter((vendor) =>
      [vendor.name, vendor.phone, vendor.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [search, vendors]);

  const openCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    const message = selectedItem
      ? await updateVendor(selectedItem.id, payload)
      : await createVendor(payload);
    setSuccess(message);
    setFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const message = await deleteVendor(deleteTarget.id);
    setSuccess(message);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Master Data"
        title="Vendors"
        description="Kelola daftar vendor untuk kebutuhan jastip dan relasi menu harian."
        actions={
          <AppButton startIcon={<AddRounded />} onClick={openCreate}>
            Tambah Vendor
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
            <AppTextField
              label="Cari vendor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
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
          rows={filteredVendors}
          type="vendor"
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
        type="vendor"
        item={selectedItem}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus vendor"
        description={`Hapus vendor ${deleteTarget?.name}? Pastikan tidak ada menu yang masih memakai vendor ini.`}
        confirmText="Hapus"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default VendorPage;
