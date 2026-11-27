import { useState } from "react";
import { salesService } from "../services/salesService";

export const useSales = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createSale = async (payload) => {
    try {
      setSaving(true);
      setError("");
      return await salesService.create(payload);
    } catch (err) {
      setError(err.message || "Gagal membuat penjualan");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const voidSale = async (id, payload) => {
    try {
      setSaving(true);
      setError("");
      return await salesService.voidSale(id, payload);
    } catch (err) {
      setError(err.message || "Gagal membatalkan transaksi");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const createReturn = async (id, payload) => {
    try {
      setSaving(true);
      setError("");
      return await salesService.createReturn(id, payload);
    } catch (err) {
      setError(err.message || "Gagal memproses retur penjualan");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const getSale = async (id) => salesService.getById(id);

  const lookupByInvoice = async (invoice) => salesService.lookupByInvoice(invoice);

  return {
    saving,
    error,
    createSale,
    voidSale,
    createReturn,
    getSale,
    lookupByInvoice,
  };
};
