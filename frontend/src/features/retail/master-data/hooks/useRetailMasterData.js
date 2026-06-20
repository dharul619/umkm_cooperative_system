import { useCallback, useEffect, useState } from "react";
import { retailMasterDataService } from "../services/masterDataService";

export const useRetailMasterData = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [categoryData, subcategoryData, brandData, productData, supplierData] = await Promise.all([
        retailMasterDataService.getCategories(),
        retailMasterDataService.getSubcategories(),
        retailMasterDataService.getBrands(),
        retailMasterDataService.getProducts(),
        retailMasterDataService.getSuppliers(),
      ]);
      setCategories(categoryData);
      setSubcategories(subcategoryData);
      setBrands(brandData);
      setProducts(productData);
      setSuppliers(supplierData);
    } catch (err) {
      setError(err.message || "Gagal mengambil data master ritel");
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
      const response = await mutation();
      await fetchMasterData();
      return response?.message || successMessage;
    } catch (err) {
      setError(err.message || "Proses gagal");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    categories,
    subcategories,
    brands,
    products,
    suppliers,
    loading,
    saving,
    error,
    setError,
    refresh: fetchMasterData,
    createCategory: (payload) =>
      runMutation(() => retailMasterDataService.createCategory(payload), "Kategori berhasil dibuat"),
    updateCategory: (id, payload) =>
      runMutation(() => retailMasterDataService.updateCategory(id, payload), "Kategori berhasil diperbarui"),
    deleteCategory: (id) =>
      runMutation(() => retailMasterDataService.deleteCategory(id), "Kategori berhasil dihapus"),
    createSubcategory: (payload) =>
      runMutation(() => retailMasterDataService.createSubcategory(payload), "Subkategori berhasil dibuat"),
    updateSubcategory: (id, payload) =>
      runMutation(() => retailMasterDataService.updateSubcategory(id, payload), "Subkategori berhasil diperbarui"),
    deleteSubcategory: (id) =>
      runMutation(() => retailMasterDataService.deleteSubcategory(id), "Subkategori berhasil dihapus"),
    createBrand: (payload) =>
      runMutation(() => retailMasterDataService.createBrand(payload), "Brand berhasil dibuat"),
    updateBrand: (id, payload) =>
      runMutation(() => retailMasterDataService.updateBrand(id, payload), "Brand berhasil diperbarui"),
    deleteBrand: (id) =>
      runMutation(() => retailMasterDataService.deleteBrand(id), "Brand berhasil dihapus"),
    createProduct: (payload) =>
      runMutation(() => retailMasterDataService.createProduct(payload), "Produk berhasil dibuat"),
    updateProduct: (id, payload) =>
      runMutation(() => retailMasterDataService.updateProduct(id, payload), "Produk berhasil diperbarui"),
    deleteProduct: (id) =>
      runMutation(() => retailMasterDataService.deleteProduct(id), "Produk berhasil dihapus"),
    createSupplier: (payload) =>
      runMutation(() => retailMasterDataService.createSupplier(payload), "Supplier berhasil dibuat"),
    updateSupplier: (id, payload) =>
      runMutation(() => retailMasterDataService.updateSupplier(id, payload), "Supplier berhasil diperbarui"),
    deleteSupplier: (id) =>
      runMutation(() => retailMasterDataService.deleteSupplier(id), "Supplier berhasil dihapus"),
  };
};

