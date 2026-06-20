import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { AppButton, AppCard, AppTextField, ConfirmModal, PageHeader, SectionToolbar, StatusAlert } from "../../../../shared/components";
import RetailMasterDataForm from "../components/RetailMasterDataForm";
import RetailMasterDataTable from "../components/RetailMasterDataTable";
import { useRetailMasterData } from "../hooks/useRetailMasterData";

const SupplierPage = () => {
  const { suppliers, loading, saving, error, refresh, createSupplier, updateSupplier, deleteSupplier } = useRetailMasterData();
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredRows = useMemo(() => suppliers.filter((item) => !search.trim() || [item.name, item.phone, item.address].filter(Boolean).some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))), [suppliers, search]);

  const handleSubmit = async (payload) => {
    const message = selectedItem ? await updateSupplier(selectedItem.id, payload) : await createSupplier(payload);
    setSuccess(message);
    setFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const message = await deleteSupplier(deleteTarget.id);
    setSuccess(message);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader eyebrow="Master Data" title="Suppliers" description="Kelola supplier ritel." actions={<AppButton startIcon={<AddRounded />} onClick={() => { setSelectedItem(null); setFormOpen(true); }}>Tambah Supplier</AppButton>} />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>
      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <SectionToolbar left={<AppTextField label="Cari supplier" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: "100%", sm: 300 } }} />} right={<AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh}>Refresh</AppButton>} />
        <RetailMasterDataTable rows={filteredRows} type="supplier" loading={loading} onEdit={(item) => { setSelectedItem(item); setFormOpen(true); }} onDelete={setDeleteTarget} />
      </AppCard>
      <RetailMasterDataForm open={formOpen} type="supplier" item={selectedItem} loading={saving} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <ConfirmModal open={!!deleteTarget} title="Hapus supplier" description={`Hapus supplier ${deleteTarget?.name}?`} confirmText="Hapus" loading={saving} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
};

export default SupplierPage;

