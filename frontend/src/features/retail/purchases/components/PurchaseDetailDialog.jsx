import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import { AppButton } from "../../../../shared/components";

const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={700} sx={{ textAlign: "right" }}>
      {value}
    </Typography>
  </Box>
);

const PurchaseDetailDialog = ({ open, data, onClose }) => {
  const purchase = data?.purchase;
  const details = data?.details || [];
  const totalAmount =
    purchase?.total_amount ??
    details.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <ReceiptLongRounded sx={{ color: "#7A2E3A" }} />
          <Box>
            <Typography
              sx={{ fontWeight: 800, color: "#7A2E3A", lineHeight: 1.2 }}
            >
              Detail Pembelian
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ringkasan transaksi supplier dan rincian item
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 3 }}>
        {!purchase ? (
          <Typography color="text.secondary">
            Data pembelian belum dipilih.
          </Typography>
        ) : (
          <Stack spacing={2.25}>
            <Box sx={{ border: "1px solid #F9D5DC", borderRadius: 2, p: 2 }}>
              <Stack spacing={1.25}>
                <InfoRow
                  label="Supplier"
                  value={purchase.supplier_name || "-"}
                />
                <InfoRow
                  label="Tanggal"
                  value={purchase.purchase_date || "-"}
                />
                <InfoRow
                  label="Jumlah item"
                  value={`${details.length} baris`}
                />
              </Stack>
            </Box>

            <Box
              sx={{
                border: "1px solid #F9D5DC",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom: "1px solid #F9D5DC",
                  backgroundColor: "#FFF9FB",
                }}
              >
                <Inventory2Rounded fontSize="small" sx={{ color: "#7A2E3A" }} />
                <Typography fontWeight={800} color="#7A2E3A">
                  Item Pembelian
                </Typography>
              </Box>
              <Stack divider={<Divider flexItem />}>
                {details.length ? (
                  details.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1.6fr 1fr auto",
                        },
                        gap: 1.25,
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={800}>
                          {item.product_name || "-"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Harga beli {money(item.price)} per unit
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Qty
                        </Typography>
                        <Typography fontWeight={800}>{item.qty}</Typography>
                      </Box>
                      <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography variant="body2" color="text.secondary">
                          Subtotal
                        </Typography>
                        <Typography fontWeight={800}>
                          {money(item.subtotal)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ px: 2, py: 2 }}>
                    <Typography color="text.secondary">
                      Tidak ada detail item.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            <Box
              sx={{
                borderRadius: 2,
                p: 2,
                backgroundColor: "#7A2E3A",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StorefrontRounded />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Pembelian
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    Akumulasi semua subtotal item
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" fontWeight={900}>
                {money(totalAmount)}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <Box sx={{ px: 3, pb: 3, display: "flex", justifyContent: "flex-end" }}>
        <AppButton variant="outlined" onClick={onClose}>
          Tutup
        </AppButton>
      </Box>
    </Dialog>
  );
};

export default PurchaseDetailDialog;
