import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import { AppButton, Loading, Pagination } from "../../../../shared/components";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const money = (value) => `Rp ${formatNumber(value)}`;

const REFERENCE_FILTERS = [
  { value: "", label: "Semua" },
  { value: "SALE", label: "Penjualan" },
  { value: "PURCHASE", label: "Pembelian" },
  { value: "SALE_RETURN", label: "Retur" },
  { value: "SALE_VOID", label: "Void" },
  { value: "ADJUSTMENT", label: "Penyesuaian" },
  { value: "BEGINNING", label: "Stok Awal" },
];

const REFERENCE_LABELS = {
  SALE: { label: "Penjualan", bg: "#FEF2F2", color: "#B91C1C" },
  PURCHASE: { label: "Pembelian", bg: "#ECFDF5", color: "#047857" },
  SALE_RETURN: { label: "Retur", bg: "#EFF6FF", color: "#1D4ED8" },
  SALE_VOID: { label: "Void", bg: "#F5F3FF", color: "#6D28D9" },
  ADJUSTMENT: { label: "Penyesuaian", bg: "#FFFBEB", color: "#B45309" },
  BEGINNING: { label: "Stok Awal", bg: "#F1F5F9", color: "#334155" },
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const InventoryDetailDialog = ({
  open,
  data,
  loading = false,
  referenceType = "",
  onReferenceTypeChange,
  onPageChange,
  onClose,
}) => {
  const product = data?.product;
  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  const currentStock = Number(product?.current_stock || 0);
  const minStock = Number(product?.min_stock || 0);
  const costPrice = Number(product?.cost_price || 0);
  const stockValue = currentStock * costPrice;
  const unitSuffix = product?.unit ? ` ${product.unit}` : "";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Inventory2Rounded sx={{ color: "#7A2E3A" }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, color: "#7A2E3A", lineHeight: 1.2 }} noWrap>
              {product?.name || "Kartu Stok"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {product?.barcode ? `Barcode: ${product.barcode}` : "Kartu mutasi stok"}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2.5 }}>
        {loading && !product ? (
          <Loading message="Memuat kartu stok..." />
        ) : !product ? (
          <Typography color="text.secondary">Data produk belum dipilih.</Typography>
        ) : (
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                gap: 1.25,
              }}
            >
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid #F9D5DC", backgroundColor: "#FFF9FB" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Stok Saat Ini
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color={currentStock <= minStock ? "#DC2626" : "#7A2E3A"}>
                  {formatNumber(currentStock)}{unitSuffix}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Min Stok
                </Typography>
                <Typography variant="subtitle1" fontWeight={800}>
                  {formatNumber(minStock)}{unitSuffix}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Harga Modal
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ fontFamily: "monospace" }}>
                  {money(costPrice)}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Nilai Stok
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ fontFamily: "monospace" }}>
                  {money(stockValue)}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {REFERENCE_FILTERS.map((item) => (
                <Chip
                  key={item.value || "ALL"}
                  label={item.label}
                  size="small"
                  clickable
                  color={referenceType === item.value ? "primary" : "default"}
                  onClick={() => onReferenceTypeChange?.(item.value)}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>

            <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #F9D5DC", backgroundColor: "#FFF9FB" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A">
                  Riwayat Mutasi
                </Typography>
              </Box>
              {loading ? (
                <Loading message="Memuat mutasi..." />
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {transactions.length ? (
                    transactions.map((item) => {
                      const refMeta = REFERENCE_LABELS[item.reference_type] || {
                        label: item.reference_type || "-",
                        bg: "#F1F5F9",
                        color: "#334155",
                      };
                      const isIn = item.type === "IN";
                      const hasRefId =
                        item.reference_id &&
                        ["SALE", "PURCHASE", "SALE_VOID", "SALE_RETURN"].includes(item.reference_type);

                      return (
                        <Box
                          key={item.id}
                          sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Chip
                                size="small"
                                label={refMeta.label}
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  backgroundColor: refMeta.bg,
                                  color: refMeta.color,
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(item.created_at)}
                              </Typography>
                              {hasRefId && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                  #{item.reference_id}
                                </Typography>
                              )}
                            </Stack>
                            {item.note && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                {item.note}
                              </Typography>
                            )}
                          </Box>

                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{
                              px: 1.25,
                              py: 0.4,
                              borderRadius: 1.5,
                              whiteSpace: "nowrap",
                              fontFamily: "monospace",
                              backgroundColor: isIn ? "#ECFDF5" : "#FEF2F2",
                              color: isIn ? "#059669" : "#DC2626",
                            }}
                          >
                            {isIn ? `+${formatNumber(item.qty)}` : `-${formatNumber(item.qty)}`}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Belum ada mutasi stok.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            {pagination && pagination.total > 0 && onPageChange ? (
              <Pagination
                page={pagination.page}
                count={pagination.totalPages}
                total={pagination.total}
                rowsPerPage={pagination.limit}
                onPageChange={onPageChange}
              />
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <Box sx={{ px: 3, pb: 2.5, display: "flex", justifyContent: "flex-end" }}>
        <AppButton variant="contained" onClick={onClose}>
          Tutup
        </AppButton>
      </Box>
    </Dialog>
  );
};

export default InventoryDetailDialog;
