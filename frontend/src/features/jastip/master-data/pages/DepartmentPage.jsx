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

const DepartmentPage = () => {
  const {
    divisions,
    departments,
    loading,
    saving,
    error,
    refresh,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useMasterData();
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredDepartments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return departments.filter((department) => {
      const matchDivision =
        divisionFilter === "all" ||
        Number(department.division_id) === Number(divisionFilter);
      const matchSearch =
        !keyword ||
        [department.name, department.division_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      return matchDivision && matchSearch;
    });
  }, [departments, divisionFilter, search]);

  const openCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    const message = selectedItem
      ? await updateDepartment(selectedItem.id, payload)
      : await createDepartment(payload);
    setSuccess(message);
    setFormOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const message = await deleteDepartment(deleteTarget.id);
    setSuccess(message);
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Master Data"
        title="Departments"
        description="Kelola departemen dan pastikan setiap departemen terhubung ke divisi yang benar."
        actions={
          <AppButton startIcon={<AddRounded />} onClick={openCreate}>
            Tambah Departemen
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
                label="Cari departemen"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
              <AppTextField
                select
                label="Filter Divisi"
                value={divisionFilter}
                onChange={(event) => setDivisionFilter(event.target.value)}
                sx={{ width: { xs: "100%", sm: 220 } }}
              >
                <MenuItem value="all">Semua Divisi</MenuItem>
                {divisions.map((division) => (
                  <MenuItem key={division.id} value={division.id}>
                    {division.name}
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
          rows={filteredDepartments}
          type="department"
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
        type="department"
        item={selectedItem}
        divisions={divisions}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus departemen"
        description={`Hapus departemen ${deleteTarget?.name}? Pastikan tidak ada user yang masih memakai departemen ini.`}
        confirmText="Hapus"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default DepartmentPage;
