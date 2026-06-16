import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from "@mui/material";
import AppButton from "../../../shared/components/AppButton";
import AppTextField from "../../../shared/components/AppTextField";

const initialForm = {
  name: "",
  phone_number: "",
  username: "",
  password: "",
  role_id: "",
  division_id: "",
  department_id: "",
  status: "pending",
};

const UserForm = ({
  open,
  user,
  roles = [],
  divisions = [],
  departments = [],
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone_number: user.phone_number || "",
        username: user.username || "",
        password: "",
        role_id: user.role_id || "",
        division_id: user.division_id || "",
        department_id: user.department_id || "",
        status: user.status || "pending",
      });
    } else {
      setFormData(initialForm);
    }
  }, [user, open]);

  const filteredDepartments = useMemo(() => {
    if (!formData.division_id) return [];

    return departments.filter(
      (department) =>
        Number(department.division_id) === Number(formData.division_id),
    );
  }, [departments, formData.division_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "division_id" ? { department_id: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name,
      phone_number: formData.phone_number,
      username: formData.username,
      role_id: Number(formData.role_id),
      division_id: Number(formData.division_id),
      department_id: Number(formData.department_id),
      status: formData.status,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    await onSubmit(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#7A2E3A" }}>
        {user ? "Edit User" : "Tambah User"}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="user-form"
          onSubmit={handleSubmit}
          sx={{
            mt: 0.5,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
            "& > *": {
              minWidth: 0,
            },
          }}
        >
          <AppTextField
            label="Nama Lengkap"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <AppTextField
            label="Nomor HP"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
          <AppTextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <AppTextField
            label={user ? "Password Baru (opsional)" : "Password"}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required={!user}
          />
          <AppTextField
            select
            label="Role"
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                const role = roles.find((item) => item.id === Number(selected));
                return role?.role_name || "Pilih Role";
              },
            }}
          >
            <MenuItem value="" disabled>
              Pilih Role
            </MenuItem>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.role_name}
              </MenuItem>
            ))}
          </AppTextField>
          <AppTextField
            select
            label="Divisi"
            name="division_id"
            value={formData.division_id}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                const division = divisions.find(
                  (item) => item.id === Number(selected),
                );
                return division?.name || "Pilih Divisi";
              },
            }}
          >
            <MenuItem value="" disabled>
              Pilih Divisi
            </MenuItem>
            {divisions.map((division) => (
              <MenuItem key={division.id} value={division.id}>
                {division.name}
              </MenuItem>
            ))}
          </AppTextField>
          <AppTextField
            select
            label="Departemen"
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            disabled={!formData.division_id}
            required
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                const department = filteredDepartments.find(
                  (item) => item.id === Number(selected),
                );
                return department?.name || "Pilih Departemen";
              },
            }}
          >
            <MenuItem value="" disabled>
              Pilih Departemen
            </MenuItem>
            {filteredDepartments.map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </AppTextField>
          <AppTextField
            select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </AppTextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>
          Batal
        </AppButton>
        <AppButton type="submit" form="user-form" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;
