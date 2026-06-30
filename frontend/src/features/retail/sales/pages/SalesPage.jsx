import { useMemo, useState } from "react";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import ListAltRounded from "@mui/icons-material/ListAltRounded";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import {
  AppButton,
  AppCard,
  AppTextField,
  PageHeader,
  SectionToolbar,
  StatusAlert,
} from "../../../../shared/components";
import { useRetailMasterData } from "../../master-data/hooks/useRetailMasterData";
import { useSales } from "../hooks/useSales";
import SaleForm from "../components/SaleForm";
import SaleDetailDialog from "../components/SaleDetailDialog";

const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const getSaleErrorMessage = (err) => {
  const message = err?.message || err?.error || "";
  if (String(err?.status || err?.statusCode) === "409" || /stok|tidak cukup/i.test(message)) {
    return message || "Stok produk tidak cukup. Transaksi ditolak.";
  }
  return message || "Gagal membuat penjualan";
};

const SalesPage = () => {
  const { products, loading: masterLoading } = useRetailMasterData();
  const { sales, loading, saving, error, refresh, createSale, getSale } = useSales();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const filteredRows = useMemo(
    () =>
      sales.filter(
        (item) =>
          !search.trim() ||
          [item.operator_name, item.sale_date, String(item.total_amount ?? "")]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(search.trim().toLowerCase()),
            ),
      ),
    [sales, search],
  );

  const openReceipt = async (salePayload) => {
    const candidate = salePayload?.data;
    if (candidate?.sale && Array.isArray(candidate.details)) {
      setDetailData(candidate);
      setDetailOpen(true);
      return;
    }

    if (salePayload?.data?.id) {
      const detailResponse = await getSale(salePayload.data.id);
      setDetailData(detailResponse);
      setDetailOpen(true);
    }
  };

  const handleSubmit = async (payload) => {
    try {
      const response = await createSale(payload);
      setSuccess(response?.message || "Penjualan berhasil dibuat");
      setTab(1);
      await openReceipt(response);
    } catch (err) {
      const message = getSaleErrorMessage(err);
      setSuccess("");
      setDetailOpen(false);
      setDetailData(null);
      throw new Error(message);
    }
  };

  const handleOpenDetail = async (row) => {
    const response = await getSale(row.id);
    setDetailData(response);
    setDetailOpen(true);
  };

  const renderTransactionTab = () => (
    <SaleForm
      products={products}
      loading={saving || masterLoading}
      onSubmit={handleSubmit}
    />
  );

  const renderHistoryTab = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <SectionToolbar
        left={
          <AppTextField
            label="Cari penjualan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: "100%", sm: 300 } }}
          />
        }
        right={
          <AppButton variant="outlined" startIcon={<RefreshRounded />} onClick={refresh}>
            Refresh
          </AppButton>
        }
      />
      {filteredRows.map((row) => (
        <Box
          key={row.id}
          sx={{
            border: "1px solid #F9D5DC",
            borderRadius: 2,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={800} color="#7A2E3A">{row.sale_date || "-"}</Typography>
            <Typography variant="body2" color="text.secondary">{formatDateTime(row.created_at)}</Typography>
            <Typography variant="caption" color="text.secondary">{row.operator_name || "-"}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography fontWeight={800}>{money(row.total_amount)}</Typography>
            <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }} onClick={() => handleOpenDetail(row)}>Detail</Typography>
          </Box>
        </Box>
      ))}
      {!loading && !filteredRows.length ? <Typography color="text.secondary">Belum ada data penjualan.</Typography> : null}
    </Box>
  );

  return (
    <>
      <PageHeader
        eyebrow="Transaksi"
        title="Penjualan / POS"
        description="Tab transaksi langsung membuka form penjualan, sedangkan daftar transaksi ada di tab terpisah."
      />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <AppCard contentSx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ px: 3, pt: 1.5, borderBottom: "1px solid #F9D5DC" }}
        >
          <Tab icon={<ReceiptLongRounded />} iconPosition="start" label="Transaksi" />
          <Tab icon={<ListAltRounded />} iconPosition="start" label="Daftar Transaksi" />
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 ? renderTransactionTab() : renderHistoryTab()}
        </Box>
      </AppCard>

      <SaleDetailDialog open={detailOpen} data={detailData} onClose={() => setDetailOpen(false)} />
    </>
  );
};

export default SalesPage;
