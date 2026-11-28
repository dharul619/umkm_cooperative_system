export const getStockStatusMeta = (stock, minStock) => {
  const qty = Number(stock || 0);
  const min = Number(minStock || 0);
  if (qty <= 0) return { key: "LOW", label: "Habis", color: "error" };
  if (qty <= min) return { key: "LOW", label: "Kritis", color: "error" };
  if (min > 0 && qty <= Math.ceil(min * 1.5)) {
    return { key: "WARNING", label: "Menipis", color: "warning" };
  }
  return { key: "SAFE", label: "Aman", color: "success" };
};
