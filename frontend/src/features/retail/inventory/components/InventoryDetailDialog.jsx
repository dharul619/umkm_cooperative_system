import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import { AppButton, Loading, Pagination } from "../../../../shared/components";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const InventoryDetailDialog = ({ open, data, loading = false, onPageChange, onClose }) => {
  const product = data?.product;
  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Inventory2Rounded sx={{ color: "#7A2E3A" }} />
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#7A2E3A", lineHeight: 1.1 }}>
              Kartu Stok
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Riwayat transaksi stok per produk
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 3 }}>
        {loading && !product ? (
          <Loading message="Memuat kartu stok..." />
        ) : !product ? (
          <Typography color="text.secondary">Data produk belum dipilih.</Typography>
        ) : (
          <Stack spacing={2.25}>
            <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, p: 2 }}>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">Produk</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ textAlign: "right" }}>
                    {product.name || "-"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">Barcode</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ textAlign: "right" }}>
                    {product.barcode || "-"}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #F9D5DC", backgroundColor: "#FFF9FB" }}>
                <Typography fontWeight={800} color="#7A2E3A">
                  Riwayat Transaksi
                </Typography>
              </Box>
              {loading ? (
                <Loading message="Memuat riwayat stok..." />
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {transactions.length ? (
                    transactions.map((item) => (
                      <Box key={item.id} sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Box>
                          <Typography fontWeight={800}>{item.reference_type || "-"}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(item.created_at)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Note: {item.note || "-"}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography fontWeight={800}>{item.type} {Number(item.qty || 0)}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {["SALE", "PURCHASE", "SALE_VOID", "SALE_RETURN"].includes(item.reference_type)
                              ? `Ref #${item.reference_id || "-"}`
                              : ""}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ px: 2, py: 2 }}>
                      <Typography color="text.secondary">Tidak ada riwayat stok.</Typography>
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
      <Box sx={{ px: 3, pb: 3, display: "flex", justifyContent: "flex-end" }}>
        <AppButton variant="contained" onClick={onClose}>
          Tutup
        </AppButton>
      </Box>
    </Dialog>
  );
};

export default InventoryDetailDialog;
