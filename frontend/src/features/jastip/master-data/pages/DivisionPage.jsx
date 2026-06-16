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

const DivisionPage = () => {
  const {
    divisions,
    loading,
    saving,
    error,
    refresh,
    createDivision,
    updateDivision,
    deleteDivision,
  } = useMasterData();
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredDivisions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return divisions;
    return divisions.filter((division) =>
      division.name?.toLowerCase().includes(keyword),
    );
  }, [divisions, search]);

  const openCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    const message = selectedItem
      ? await updateDivision(selectedItem.id, payload)
      : await createDivision(payload);
    setSuccess(message);
    setFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const message = await deleteDivision(deleteTarget.id);
    setSuccess(message);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Master Data"
        title="Divisions"
        description="Kelola daftar divisi organisasi untuk relasi user dan departemen."
        actions={
          <AppButton startIcon={<AddRounded />} onClick={openCreate}>
            Tambah Divisi
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
              label="Cari divisi"
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
          rows={filteredDivisions}
          type="division"
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
        type="division"
        item={selectedItem}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus divisi"
        description={`Hapus divisi ${deleteTarget?.name}? Pastikan tidak ada departemen atau user yang masih memakai divisi ini.`}
        confirmText="Hapus"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default DivisionPage;
