import { useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PrintRounded from "@mui/icons-material/PrintRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import AssignmentReturnRounded from "@mui/icons-material/AssignmentReturnRounded";
import { jsPDF } from "jspdf";
import { AppButton } from "../../../../shared/components";
import {
  escapeHtml,
  formatDateTime,
  money,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_META,
} from "../utils/posFormatters";

const SaleDetailDialog = ({
  open,
  data,
  onClose,
  onRequestVoid,
  onRequestReturn,
}) => {
  const [paperWidth, setPaperWidth] = useState("58mm");
  const sale = data?.sale;
  const details = data?.details || [];
  const payments = data?.payments || [];
  const returns = data?.returns || [];

  const invoiceNo = sale?.invoice_number || (sale?.id ? `#${sale.id}` : "-");
  const statusMeta = SALE_STATUS_META[sale?.status || "COMPLETED"] || SALE_STATUS_META.COMPLETED;
  const transactionTime = sale?.created_at || sale?.sale_date;
  const subtotalAmount = Number(sale?.subtotal_amount || sale?.total_amount || 0);
  const totalDiscount = Number(sale?.discount_amount || 0);
  const totalAmount = Number(sale?.total_amount || 0);
  const paidAmount = Number(sale?.paid_amount || totalAmount);
  const changeAmount = Number(sale?.change_amount || 0);
  const buyerLabel = sale?.member_name
    ? `${sale.member_name} (Anggota)`
    : "Pembeli Umum";

  const paymentSummaryLines = payments.length
    ? payments.map((p) => ({
        label: PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method,
        amount: Number(p.amount || 0),
        received: Number(p.received_amount || p.amount || 0),
        change: Number(p.change_amount || 0),
        reference: p.reference_no || "",
      }))
    : [
        {
          label: PAYMENT_METHOD_LABELS[sale?.payment_method || "CASH"] || "Tunai",
          amount: totalAmount,
          received: paidAmount,
          change: changeAmount,
          reference: "",
        },
      ];

  const downloadPdf = () => {
    if (!sale) return;
    const pdf = new jsPDF({ unit: "mm", format: [80, 210] });
    const margin = 6;
    let y = 10;

    const addLine = (text, opts = {}) => {
      if (y > 198) {
        pdf.addPage([80, 210]);
        y = 10;
      }
      pdf.setFont("courier", opts.bold ? "bold" : "normal");
      pdf.setFontSize(opts.size || 8.5);
      pdf.text(String(text), opts.x ?? margin, y, opts.align ? { align: opts.align } : undefined);
      y += opts.step || 4.2;
    };

    addLine("SIKOMU", { bold: true, size: 12, x: 40, align: "center", step: 4.5 });
    addLine("KOPERASI MULTI-UNIT RITEL", { size: 8, x: 40, align: "center", step: 5 });
    addLine("----------------------------------------", { step: 4 });
    addLine(`No     : ${invoiceNo}`);
    addLine(`Waktu  : ${formatDateTime(transactionTime)}`);
    addLine(`Kasir  : ${sale.operator_name || "-"}`);
    addLine(`Pembeli: ${buyerLabel}`);
    if (sale.status === "VOIDED") {
      addLine("STATUS : DIBATALKAN (VOID)", { bold: true });
    }
    addLine("----------------------------------------", { step: 4 });

    details.forEach((item) => {
      addLine(item.product_name || "-", { bold: true, step: 3.8 });
      const qtyPrice = `${item.qty} x ${money(item.price)}`;
      addLine(qtyPrice, { step: 0 });
      addLine(money(item.subtotal), { x: 74, align: "right", step: 4 });
      if (Number(item.discount_amount || 0) > 0) {
        addLine(`  Disc item: -${money(item.discount_amount)}`, { size: 7.5, step: 3.8 });
      }
    });

    addLine("----------------------------------------", { step: 4 });
    addLine("Subtotal", { step: 0 });
    addLine(money(subtotalAmount), { x: 74, align: "right" });
    if (totalDiscount > 0) {
      addLine("Diskon", { step: 0 });
      addLine(`-${money(totalDiscount)}`, { x: 74, align: "right" });
    }
    addLine("TOTAL", { bold: true, size: 10, step: 0 });
    addLine(money(totalAmount), { bold: true, size: 10, x: 74, align: "right", step: 5 });

    paymentSummaryLines.forEach((p) => {
      addLine(`Bayar (${p.label})`, { step: 0 });
      addLine(money(p.received), { x: 74, align: "right" });
    });
    if (changeAmount > 0) {
      addLine("Kembali", { step: 0 });
      addLine(money(changeAmount), { x: 74, align: "right" });
    }

    if (Number(sale.returned_amount || 0) > 0) {
      addLine("----------------------------------------", { step: 4 });
      addLine("Total Diretur", { step: 0 });
      addLine(`-${money(sale.returned_amount)}`, { x: 74, align: "right" });
    }

    addLine("----------------------------------------", { step: 4 });
    addLine("Terima kasih atas kunjungan Anda", { size: 8, x: 40, align: "center" });
    pdf.save(`struk-${invoiceNo}.pdf`);
  };

  const printThermalReceipt = () => {
    if (!sale) return;
    const widthCss = paperWidth === "58mm" ? "58mm" : "80mm";
    const bodyWidth = paperWidth === "58mm" ? "52mm" : "72mm";
    const fontSize = paperWidth === "58mm" ? "11px" : "12px";

    const itemsHtml = details
      .map((item) => {
        const discLine =
          Number(item.discount_amount || 0) > 0
            ? `<div class="sub">  Disc item: -${escapeHtml(money(item.discount_amount))}</div>`
            : "";
        return `
          <div class="item">
            <div class="item-name">${escapeHtml(item.product_name || "-")}</div>
            <div class="row">
              <span>${Number(item.qty)} x ${escapeHtml(money(item.price))}</span>
              <span>${escapeHtml(money(item.subtotal))}</span>
            </div>
            ${discLine}
          </div>
        `;
      })
      .join("");

    const paymentsHtml = paymentSummaryLines
      .map(
        (p) => `
        <div class="row">
          <span>Bayar (${escapeHtml(p.label)})${p.reference ? ` [${escapeHtml(p.reference)}]` : ""}</span>
          <span>${escapeHtml(money(p.received))}</span>
        </div>`
      )
      .join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Struk ${escapeHtml(invoiceNo)}</title>
  <style>
    @page { size: ${widthCss} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0 auto;
      padding: 4px 2px;
      width: ${bodyWidth};
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .title { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
    .dash { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; }
    .item { margin-bottom: 5px; }
    .item-name { font-weight: 700; word-break: break-word; }
    .sub { font-size: 10px; }
    .void-banner {
      border: 1px dashed #000;
      padding: 3px;
      text-align: center;
      font-weight: 700;
      margin: 6px 0;
    }
    .total-row { font-size: 13px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">SIKOMU</div>
    <div class="sub">Koperasi Multi-Unit • Unit Ritel</div>
  </div>
  <div class="dash"></div>
  <div>No: ${escapeHtml(invoiceNo)}</div>
  <div>Tgl: ${escapeHtml(formatDateTime(transactionTime))}</div>
  <div>Kasir: ${escapeHtml(sale.operator_name || "-")}</div>
  <div>Pembeli: ${escapeHtml(buyerLabel)}</div>
  ${sale.status === "VOIDED" ? `<div class="void-banner">TRANSAKSI DIBATALKAN (VOID)</div>` : ""}
  <div class="dash"></div>
  ${itemsHtml}
  <div class="dash"></div>
  <div class="row"><span>Subtotal</span><span>${escapeHtml(money(subtotalAmount))}</span></div>
  ${
    totalDiscount > 0
      ? `<div class="row"><span>Diskon</span><span>-${escapeHtml(money(totalDiscount))}</span></div>`
      : ""
  }
  <div class="row total-row"><span>TOTAL</span><span>${escapeHtml(money(totalAmount))}</span></div>
  <div class="dash"></div>
  ${paymentsHtml}
  ${
    changeAmount > 0
      ? `<div class="row bold"><span>Kembalian</span><span>${escapeHtml(money(changeAmount))}</span></div>`
      : ""
  }
  ${
    Number(sale.returned_amount || 0) > 0
      ? `<div class="dash"></div><div class="row"><span>Total Retur</span><span>-${escapeHtml(money(sale.returned_amount))}</span></div>`
      : ""
  }
  ${sale.notes ? `<div class="dash"></div><div class="sub">Catatan: ${escapeHtml(sale.notes)}</div>` : ""}
  <div class="dash"></div>
  <div class="center sub">
    Terima kasih telah berbelanja di SIKOMU!<br/>
    Barang yang sudah dibeli sesuai ketentuan retur.
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=420,height=720");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 150);
  };

  const canVoid = sale?.status === "COMPLETED" && typeof onRequestVoid === "function";
  const canReturn =
    (sale?.status === "COMPLETED" || sale?.status === "PARTIAL_RETURN") &&
    typeof onRequestReturn === "function";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <CheckCircleRounded sx={{ color: sale?.status === "VOIDED" ? "#DC2626" : "#2E7D32" }} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={900} color="#7A2E3A">
                  Struk {invoiceNo}
                </Typography>
                {sale ? (
                  <Chip size="small" color={statusMeta.color} label={statusMeta.label} sx={{ fontWeight: 700 }} />
                ) : null}
              </Stack>
            </Box>
          </Box>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={paperWidth}
            onChange={(_, val) => val && setPaperWidth(val)}
          >
            <ToggleButton value="58mm" sx={{ fontWeight: 700 }}>
              58mm
            </ToggleButton>
            <ToggleButton value="80mm" sx={{ fontWeight: 700 }}>
              80mm
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {!sale ? (
          <Typography color="text.secondary">Data penjualan belum dipilih.</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "auto 1fr" },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            {/* Thermal Receipt Preview */}
            <Paper
              elevation={0}
              sx={{
                width: paperWidth === "58mm" ? 260 : 320,
                maxWidth: "100%",
                mx: { xs: "auto", md: 0 },
                p: 2,
                border: "1px dashed #CBD5E1",
                borderRadius: 1.5,
                backgroundColor: "#FFFEFA",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: paperWidth === "58mm" ? 12 : 13,
                color: "#0F172A",
              }}
            >
              <Box sx={{ textAlign: "center", mb: 1 }}>
                <Typography fontFamily="inherit" fontWeight={900} fontSize={15}>
                  SIKOMU
                </Typography>
                <Typography fontFamily="inherit" fontSize={11}>
                  Koperasi Multi-Unit • Unit Ritel
                </Typography>
              </Box>

              <Divider sx={{ borderStyle: "dashed", my: 1 }} />

              <Box sx={{ fontSize: 11.5 }}>
                <div>No     : {invoiceNo}</div>
                <div>Waktu  : {formatDateTime(transactionTime)}</div>
                <div>Kasir  : {sale.operator_name || "-"}</div>
                <div>Pembeli: {buyerLabel}</div>
              </Box>

              {sale.status === "VOIDED" ? (
                <Box
                  sx={{
                    my: 1,
                    p: 0.5,
                    border: "1px dashed #DC2626",
                    textAlign: "center",
                    fontWeight: 800,
                    color: "#DC2626",
                    fontSize: 11.5,
                  }}
                >
                  TRANSAKSI VOID / BATAL
                </Box>
              ) : null}

              <Divider sx={{ borderStyle: "dashed", my: 1 }} />

              <Stack spacing={0.75}>
                {details.map((item) => (
                  <Box key={item.id}>
                    <div style={{ fontWeight: 700 }}>{item.product_name || "-"}</div>
                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                      <span>
                        {item.qty} x {money(item.price)}
                      </span>
                      <span>{money(item.subtotal)}</span>
                    </Box>
                    {Number(item.discount_amount || 0) > 0 ? (
                      <div style={{ fontSize: 10.5, color: "#B91C1C" }}>
                        Disc item: -{money(item.discount_amount)}
                      </div>
                    ) : null}
                    {Number(item.returned_qty || 0) > 0 ? (
                      <div style={{ fontSize: 10.5, color: "#B45309" }}>
                        Diretur: {item.returned_qty} pcs
                      </div>
                    ) : null}
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ borderStyle: "dashed", my: 1 }} />

              <Stack spacing={0.35} sx={{ fontSize: 11.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal</span>
                  <span>{money(subtotalAmount)}</span>
                </Box>
                {totalDiscount > 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "space-between", color: "#B91C1C" }}>
                    <span>Diskon</span>
                    <span>-{money(totalDiscount)}</span>
                  </Box>
                ) : null}
                <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13 }}>
                  <span>TOTAL</span>
                  <span>{money(totalAmount)}</span>
                </Box>
              </Stack>

              <Divider sx={{ borderStyle: "dashed", my: 1 }} />

              <Stack spacing={0.35} sx={{ fontSize: 11.5 }}>
                {paymentSummaryLines.map((p, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Bayar ({p.label})</span>
                    <span>{money(p.received)}</span>
                  </Box>
                ))}
                {changeAmount > 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                    <span>Kembalian</span>
                    <span>{money(changeAmount)}</span>
                  </Box>
                ) : null}
                {Number(sale.returned_amount || 0) > 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "space-between", color: "#B45309", fontWeight: 700 }}>
                    <span>Total Retur</span>
                    <span>-{money(sale.returned_amount)}</span>
                  </Box>
                ) : null}
              </Stack>

              <Divider sx={{ borderStyle: "dashed", my: 1 }} />

              <Box sx={{ textAlign: "center", fontSize: 10.5 }}>
                Terima kasih telah berbelanja di SIKOMU!
              </Box>
            </Paper>

            {/* Right Info: Payment Breakdown, Void & Returns */}
            <Stack spacing={1.5}>
              {sale.status === "VOIDED" ? (
                <Alert severity="error">
                  <strong>Transaksi Dibatalkan</strong> oleh {sale.voided_by_name || "-"} pada{" "}
                  {formatDateTime(sale.voided_at)}
                  {sale.void_approved_by_name ? ` (Otorisasi Admin: ${sale.void_approved_by_name})` : ""}.
                  <br />
                  Alasan: {sale.void_reason || "-"}
                </Alert>
              ) : null}

              <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #F9D5DC" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1 }}>
                  Rincian Pembayaran ({PAYMENT_METHOD_LABELS[sale.payment_method || "CASH"] || sale.payment_method})
                </Typography>
                <Stack spacing={0.75}>
                  {paymentSummaryLines.map((p, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <Box>
                        <strong>{p.label}</strong>
                        {p.reference ? ` • Ref: ${p.reference}` : ""}
                      </Box>
                      <Typography fontWeight={800} variant="body2">
                        {money(p.amount)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {returns.length > 0 ? (
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #FDE68A", backgroundColor: "#FFFBEB" }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#92400E" sx={{ mb: 1 }}>
                    Riwayat Retur ({returns.length})
                  </Typography>
                  <Stack spacing={1}>
                    {returns.map((ret) => (
                      <Box key={ret.id} sx={{ fontSize: 12.5, borderBottom: "1px dashed #FCD34D", pb: 0.75 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                          <span>{ret.return_number}</span>
                          <span>-{money(ret.total_refund)} ({ret.refund_method})</span>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDateTime(ret.created_at)} • Kasir: {ret.operator_name || "-"}
                          {ret.approved_by_name ? ` • Otorisasi Admin: ${ret.approved_by_name}` : ""}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Alasan: {ret.reason}
                        </Typography>
                        {(ret.details || []).map((d) => (
                          <Typography key={d.id} variant="caption" color="text.secondary" display="block">
                            • {d.product_name} x{d.qty} ({d.restock ? "Kembali ke stok" : "Barang rusak"})
                          </Typography>
                        ))}
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ) : null}

              {(canVoid || canReturn) ? (
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#7A2E3A" sx={{ mb: 1 }}>
                    Aksi Koreksi Transaksi
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {canReturn ? (
                      <AppButton
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<AssignmentReturnRounded />}
                        onClick={() => onRequestReturn(data)}
                      >
                        Retur Barang
                      </AppButton>
                    ) : null}
                    {canVoid ? (
                      <AppButton
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<BlockRounded />}
                        onClick={() => onRequestVoid(sale)}
                      >
                        Void Transaksi
                      </AppButton>
                    ) : null}
                  </Stack>
                </Paper>
              ) : null}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <Box
        sx={{
          px: 3,
          pb: 2.5,
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
            onClick={printThermalReceipt}
            disabled={!sale}
          >
            Print Thermal ({paperWidth})
          </AppButton>
          <AppButton
            variant="outlined"
            startIcon={<DownloadRounded />}
            onClick={downloadPdf}
            disabled={!sale}
          >
            Unduh PDF
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
