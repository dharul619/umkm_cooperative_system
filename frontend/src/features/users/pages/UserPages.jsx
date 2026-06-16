import { useEffect, useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { Box, MenuItem } from "@mui/material";
import { authService } from "../../auth/services/authService";
import {
  AppButton,
  AppCard,
  AppTextField,
  ConfirmModal,
  PageHeader,
  SectionToolbar,
  StatusAlert,
} from "../../../shared/components";
import UserForm from "../components/UserForm";
import UserTable from "../components/UserTable";
import { useUsers } from "../hooks/useUsers";

const UserPages = () => {
  const {
    users,
    loading,
    saving,
    error,
    setError,
    refresh,
    createUser,
    updateUser,
    deleteUser,
    approveUser,
    rejectUser,
  } = useUsers();

  const [roles, setRoles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [roleData, divisionData, departmentData] = await Promise.all([
          authService.getRoles(),
          authService.getDivisions(),
          authService.getDepartments(),
        ]);

        setRoles(roleData);
        setDivisions(divisionData);
        setDepartments(departmentData);
      } catch (err) {
        setError(err.message || "Gagal mengambil data master");
      }
    };

    fetchMasterData();
  }, [setError]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchStatus = statusFilter === "all" || user.status === statusFilter;
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        [
          user.name,
          user.phone_number,
          user.username,
          user.role_name,
          user.division,
          user.department,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      return matchStatus && matchSearch;
    });
  }, [search, statusFilter, users]);

  const handleCreate = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    const message = selectedUser
      ? await updateUser(selectedUser.id, payload)
      : await createUser(payload);

    setSuccess(message);
    setFormOpen(false);
    setSelectedUser(null);
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    const message = await confirmAction.action();
    setSuccess(message);
    setConfirmAction(null);
  };

  const openConfirm = (type, user) => {
    const config = {
      approve: {
        title: "Approve user",
        description: `Setujui akun ${user.name}? User akan dapat login ke sistem.`,
        confirmText: "Approve",
        tone: "info",
        action: () => approveUser(user.id),
      },
      reject: {
        title: "Reject user",
        description: `Tolak akun ${user.name}? Status user akan menjadi rejected.`,
        confirmText: "Reject",
        tone: "warning",
        action: () => rejectUser(user.id),
      },
      delete: {
        title: "Hapus user",
        description: `Hapus user ${user.name}? Tindakan ini tidak dapat dibatalkan.`,
        confirmText: "Hapus",
        tone: "danger",
        action: () => deleteUser(user.id),
      },
    };

    setConfirmAction(config[type]);
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Kelola akun, role, organisasi, dan status approval pengguna."
        actions={
          <AppButton startIcon={<AddRounded />} onClick={handleCreate}>
            Tambah User
          </AppButton>
        }
      />

      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("") }>
        {success}
      </StatusAlert>

      <AppCard contentSx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <SectionToolbar
          left={
            <>
              <AppTextField
                label="Cari user"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
              <AppTextField
                select
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ width: { xs: "100%", sm: 180 } }}
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
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
        <UserTable
          users={filteredUsers}
          loading={loading}
          onEdit={handleEdit}
          onApprove={(user) => openConfirm("approve", user)}
          onReject={(user) => openConfirm("reject", user)}
          onDelete={(user) => openConfirm("delete", user)}
        />
      </AppCard>

      <UserForm
        open={formOpen}
        user={selectedUser}
        roles={roles}
        divisions={divisions}
        departments={departments}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmText={confirmAction?.confirmText}
        tone={confirmAction?.tone}
        loading={saving}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
      />
    </Box>
  );
};

export default UserPages;
