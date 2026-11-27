export const RUPIAH_DENOMINATIONS = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100,
];

export const money = (value) =>
  `Rp ${Math.round(Number(value || 0)).toLocaleString("id-ID")}`;

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

export const formatDateOnly = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("id-ID", { dateStyle: "medium" });
};

export const PAYMENT_METHOD_LABELS = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
  MIXED: "Split / Campuran",
};

export const SALE_STATUS_META = {
  COMPLETED: { label: "Selesai", color: "success" },
  PARTIAL_RETURN: { label: "Retur Sebagian", color: "warning" },
  RETURNED: { label: "Diretur Penuh", color: "default" },
  VOIDED: { label: "Dibatalkan (Void)", color: "error" },
};

export const computeDiscountAmount = (type, value, baseAmount) => {
  const safeBase = Math.max(0, Math.round(Number(baseAmount || 0)));
  const numVal = Math.max(0, Number(value || 0));
  if (!type || type === "NONE" || numVal <= 0 || safeBase === 0) return 0;
  if (type === "PERCENT") {
    const pct = Math.min(100, numVal);
    return Math.min(safeBase, Math.round(safeBase * (pct / 100)));
  }
  return Math.min(safeBase, Math.round(numVal));
};

export const computeCartSummary = (items = [], orderDiscount = { type: "NONE", value: 0 }) => {
  let subtotalAmount = 0;
  let itemDiscountAmount = 0;

  const computedItems = items.map((item) => {
    const qty = Math.max(1, Math.round(Number(item.qty || 1)));
    const price = Math.max(0, Math.round(Number(item.selling_price ?? item.price ?? 0)));
    const lineGross = qty * price;
    const itemDisc = computeDiscountAmount(
      item.discount_type || "NONE",
      item.discount_value || 0,
      lineGross
    );
    const lineSubtotal = Math.max(0, lineGross - itemDisc);
    subtotalAmount += lineGross;
    itemDiscountAmount += itemDisc;
    return {
      ...item,
      qty,
      selling_price: price,
      line_gross: lineGross,
      discount_amount: itemDisc,
      line_subtotal: lineSubtotal,
    };
  });

  const afterItemSubtotal = Math.max(0, subtotalAmount - itemDiscountAmount);
  const orderDiscountAmount = computeDiscountAmount(
    orderDiscount?.type || "NONE",
    orderDiscount?.value || 0,
    afterItemSubtotal
  );
  const totalDiscount = itemDiscountAmount + orderDiscountAmount;
  const totalAmount = Math.max(0, subtotalAmount - totalDiscount);

  return {
    items: computedItems,
    totalQty: computedItems.reduce((sum, i) => sum + i.qty, 0),
    subtotalAmount,
    itemDiscountAmount,
    orderDiscountAmount,
    totalDiscount,
    totalAmount,
  };
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
