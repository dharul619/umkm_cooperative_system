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
import PointOfSaleRounded from "@mui/icons-material/PointOfSaleRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PrintRounded from "@mui/icons-material/PrintRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { jsPDF } from "jspdf";
import { AppButton } from "../../../../shared/components";

const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

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

const SaleDetailDialog = ({ open, data, onClose }) => {
  const sale = data?.sale;
  const details = data?.details || [];
  const totalAmount =
    sale?.total_amount ??
    details.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const totalProfit =
    sale?.total_profit ??
    details.reduce(
      (sum, item) =>
        sum +
        (Number(item.price || 0) - Number(item.cost_price || 0)) *
          Number(item.qty || 0),
      0,
    );
  const transactionTime =
    sale?.created_at || sale?.updated_at || sale?.sale_date;

  const downloadPdf = () => {
    if (!sale) return;
    const pdf = new jsPDF();
    const margin = 14;
    let y = 18;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("BUKTI TRANSAKSI PENJUALAN", margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Waktu: ${formatDateTime(transactionTime)}`, margin, y);
    y += 6;
    pdf.text(`Operator: ${sale.operator_name || "-"}`, margin, y);
    y += 6;
    pdf.text(`Sale ID: ${sale.id}`, margin, y);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Rincian Item", margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    details.forEach((item) => {
      const lines = [
        `${item.product_name || "-"} (${item.product_barcode || "-"})`,
        `Qty ${item.qty} x ${money(item.price)} = ${money(item.subtotal)}`,
      ];
      lines.forEach((line) => {
        if (y > 270) {
          pdf.addPage();
          y = 18;
        }
        pdf.text(line, margin, y);
        y += 6;
      });
      y += 2;
    });
    y += 4;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total Penjualan: ${money(totalAmount)}`, margin, y);
    y += 6;
    pdf.text(`Total Laba: ${money(totalProfit)}`, margin, y);
    pdf.save(`bukti-penjualan-${sale.id}.pdf`);
  };

  const printReceipt = () => {
    if (!sale) return;
    const content = [
      `Koperasi 245`,
      `BUKTI TRANSAKSI PENJUALAN`,
      `Waktu: ${formatDateTime(transactionTime)}`,
      `Operator: ${sale.operator_name || "-"}`,
      `Sale ID: ${sale.id}`,
      ``,
      `Rincian Item`,
      ...details.map(
        (item) =>
          `${item.product_name || "-"} (${item.product_barcode || "-"}) | Qty ${item.qty} x ${money(item.price)} = ${money(item.subtotal)}`,
      ),
      ``,
      `Total Penjualan: ${money(totalAmount)}`,
      `Total Laba: ${money(totalProfit)}`,
    ].join("\n");
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(
      `<pre style="font-family: monospace; white-space: pre-wrap; padding: 24px;">${content}</pre>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <CheckCircleRounded sx={{ color: "#2E7D32" }} />
          <Box>
            <Typography
              sx={{ fontWeight: 900, color: "#2E7D32", lineHeight: 1.1 }}
            >
              Transaksi Berhasil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bukti penjualan siap dicetak atau diunduh
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 3 }}>
        {!sale ? (
          <Typography color="text.secondary">
            Data penjualan belum dipilih.
          </Typography>
        ) : (
          <Stack spacing={2.25}>
            <Box
              sx={{
                border: "1px solid #C8E6C9",
                borderRadius: 2,
                p: 2,
                backgroundColor: "#F6FBF6",
              }}
            >
              <Stack spacing={1.25}>
                <InfoRow
                  label="Waktu Transaksi"
                  value={formatDateTime(transactionTime)}
                />
                <InfoRow label="Operator" value={sale.operator_name || "-"} />
                <InfoRow label="Sale ID" value={`#${sale.id}`} />
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
                  Item Penjualan
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
                        {/* <Typography variant="body2" color="text.secondary">Barcode {item.product_barcode || "-"}</Typography>
                      <Typography variant="body2" color="text.secondary">Harga jual {money(item.price)} per unit</Typography>
                      <Typography variant="body2" color="text.secondary">Modal snapshot {money(item.cost_price)} per unit</Typography> */}
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

            <Stack spacing={1.25}>
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
                  <PointOfSaleRounded />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Penjualan
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
              {/* <Box
                sx={{
                  border: "1px solid #F9D5DC",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonRounded sx={{ color: "#7A2E3A" }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Laba
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hitung dari snapshot modal saat transaksi
                    </Typography>
                  </Box>
                </Box>
                <Typography fontWeight={900} color="#7A2E3A">
                  {money(totalProfit)}
                </Typography>
              </Box> */}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <Box
        sx={{
          px: 3,
          pb: 3,
          display: "flex",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <AppButton
            variant="outlined"
            startIcon={<PrintRounded />}
            onClick={printReceipt}
            disabled={!sale}
          >
            Print
          </AppButton>
          <AppButton
            variant="outlined"
            startIcon={<DownloadRounded />}
            onClick={downloadPdf}
            disabled={!sale}
          >
            PDF
          </AppButton>
        </Box>
        <AppButton variant="contained" onClick={onClose}>
          Selesai
        </AppButton>
      </Box>
    </Dialog>
  );
};

export default SaleDetailDialog;
