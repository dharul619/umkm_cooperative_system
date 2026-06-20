import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { AppButton, AppCard, AppTextField, ConfirmModal, PageHeader, SectionToolbar, StatusAlert } from "../../../../shared/components";
import RetailMasterDataForm from "../components/RetailMasterDataForm";
import RetailMasterDataTable from "../components/RetailMasterDataTable";
import { useRetailMasterData } from "../hooks/useRetailMasterData";

const SubcategoryPage = () => {
  const { categories, subcategories, loading, saving, error, refresh, createSubcategory, updateSubcategory, deleteSubcategory } = useRetailMasterData();
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredRows = useMemo(() => subcategories.filter((item) => !search.trim() || [item.name, item.category_name].filter(Boolean).some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))), [search, subcategories]);

  const handleSubmit = async (payload) => {
    const message = selectedItem ? await updateSubcategory(selectedItem.id, payload) : await createSubcategory(payload);
    setSuccess(message);
    setFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const message = await deleteSubcategory(deleteTarget.id);
    setSuccess(message);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader eyebrow="Master Data" title="Subcategories" description="Kelola subkategori produk ritel." actions={<AppButton startIcon={<AddRounded />} onClick={() => { setSelectedItem(null); setFormOpen(true); }}>Tambah Subkategori</AppButton>} />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>
      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <SectionToolbar left={<AppTextField label="Cari subkategori" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: "100%", sm: 300 } }} />} right={<AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh}>Refresh</AppButton>} />
        <RetailMasterDataTable rows={filteredRows} type="subcategory" loading={loading} onEdit={(item) => { setSelectedItem(item); setFormOpen(true); }} onDelete={setDeleteTarget} />
      </AppCard>
      <RetailMasterDataForm open={formOpen} type="subcategory" item={selectedItem} categories={categories} loading={saving} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <ConfirmModal open={!!deleteTarget} title="Hapus subkategori" description={`Hapus subkategori ${deleteTarget?.name}?`} confirmText="Hapus" loading={saving} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
};

export default SubcategoryPage;

