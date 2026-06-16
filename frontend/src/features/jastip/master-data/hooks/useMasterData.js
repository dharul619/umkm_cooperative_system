import { useCallback, useEffect, useState } from "react";
import { masterDataService } from "../services/masterDataService";

export const useMasterData = () => {
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [divisionData, departmentData, vendorData, menuData] = await Promise.all([
        masterDataService.getDivisions(),
        masterDataService.getDepartments(),
        masterDataService.getVendors(),
        masterDataService.getMenus(),
      ]);
      setDivisions(divisionData);
      setDepartments(departmentData);
      setVendors(vendorData);
      setMenus(menuData);
    } catch (err) {
      setError(err.message || "Gagal mengambil data master");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const runMutation = async (mutation, successMessage) => {
    try {
      setSaving(true);
      setError("");
      await mutation();
      await fetchMasterData();
      return successMessage;
    } catch (err) {
      setError(err.message || "Proses gagal");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    divisions,
    departments,
    vendors,
    menus,
    loading,
    saving,
    error,
    setError,
    refresh: fetchMasterData,
    createDivision: (payload) =>
      runMutation(() => masterDataService.createDivision(payload), "Divisi berhasil dibuat"),
    updateDivision: (id, payload) =>
      runMutation(() => masterDataService.updateDivision(id, payload), "Divisi berhasil diperbarui"),
    deleteDivision: (id) =>
      runMutation(() => masterDataService.deleteDivision(id), "Divisi berhasil dihapus"),
    createDepartment: (payload) =>
      runMutation(() => masterDataService.createDepartment(payload), "Departemen berhasil dibuat"),
    updateDepartment: (id, payload) =>
      runMutation(() => masterDataService.updateDepartment(id, payload), "Departemen berhasil diperbarui"),
    deleteDepartment: (id) =>
      runMutation(() => masterDataService.deleteDepartment(id), "Departemen berhasil dihapus"),
    createVendor: (payload) =>
      runMutation(() => masterDataService.createVendor(payload), "Vendor berhasil dibuat"),
    updateVendor: (id, payload) =>
      runMutation(() => masterDataService.updateVendor(id, payload), "Vendor berhasil diperbarui"),
    deleteVendor: (id) =>
      runMutation(() => masterDataService.deleteVendor(id), "Vendor berhasil dihapus"),
    createMenu: (payload) =>
      runMutation(() => masterDataService.createMenu(payload), "Menu berhasil dibuat"),
    updateMenu: (id, payload) =>
      runMutation(() => masterDataService.updateMenu(id, payload), "Menu berhasil diperbarui"),
    deleteMenu: (id) =>
      runMutation(() => masterDataService.deleteMenu(id), "Menu berhasil dihapus"),
  };
};
