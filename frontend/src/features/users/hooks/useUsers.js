import { useCallback, useEffect, useState } from "react";
import { userService } from "../services/userService";

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const runMutation = async (mutation, successMessage) => {
    try {
      setSaving(true);
      setError("");
      await mutation();
      await fetchUsers();
      return successMessage;
    } catch (err) {
      setError(err.message || "Proses gagal");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    users,
    loading,
    saving,
    error,
    setError,
    refresh: fetchUsers,
    createUser: (payload) =>
      runMutation(() => userService.create(payload), "User berhasil dibuat"),
    updateUser: (id, payload) =>
      runMutation(() => userService.update(id, payload), "User berhasil diperbarui"),
    deleteUser: (id) =>
      runMutation(() => userService.delete(id), "User berhasil dihapus"),
    approveUser: (id) =>
      runMutation(() => userService.approve(id), "User berhasil disetujui"),
    rejectUser: (id) =>
      runMutation(() => userService.reject(id), "User berhasil ditolak"),
  };
};
