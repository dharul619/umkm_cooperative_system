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
import { usePurchases } from "../hooks/usePurchases";
import PurchaseForm from "../components/PurchaseForm";
import PurchaseDetailDialog from "../components/PurchaseDetailDialog";
import PurchaseTable from "../components/PurchaseTable";

const PurchasePage = () => {
  const { suppliers, products, loading: masterLoading } = useRetailMasterData();
  const { purchases, loading, saving, error, refresh, createPurchase, getPurchase } = usePurchases();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const filteredRows = useMemo(
    () =>
      purchases.filter(
        (item) =>
          !search.trim() ||
          [item.supplier_name, item.purchase_date, String(item.total_amount ?? "")]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(search.trim().toLowerCase()),
            ),
      ),
    [purchases, search],
  );

  const openReceipt = async (purchasePayload) => {
    const candidate = purchasePayload?.data;
    if (candidate?.purchase && Array.isArray(candidate.details)) {
      setDetailData(candidate);
      setDetailOpen(true);
      return;
    }

    if (purchasePayload?.data?.id) {
      const detailResponse = await getPurchase(purchasePayload.data.id);
      setDetailData(detailResponse);
      setDetailOpen(true);
    }
  };

  const handleSubmit = async (payload) => {
    const response = await createPurchase(payload);
    setSuccess(response?.message || "Pembelian berhasil dibuat");
    setTab(1);
    await openReceipt(response);
  };

  const handleOpenDetail = async (row) => {
    const response = await getPurchase(row.id);
    setDetailData(response);
    setDetailOpen(true);
  };

  const renderTransactionTab = () => (
    <PurchaseForm
      suppliers={suppliers}
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
            label="Cari pembelian"
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
      <PurchaseTable rows={filteredRows} loading={loading} onDetail={handleOpenDetail} />
    </Box>
  );

  return (
    <>
      <PageHeader
        eyebrow="Transaksi"
        title="Pembelian"
        description="Tab pembelian langsung membuka form input, sedangkan daftar pembelian ada di tab terpisah."
      />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert severity="success" show={!!success} onClose={() => setSuccess("")}>{success}</StatusAlert>

      <AppCard contentSx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ px: 3, pt: 1.5, borderBottom: "1px solid #F9D5DC" }}
        >
          <Tab icon={<ReceiptLongRounded />} iconPosition="start" label="Pembelian" />
          <Tab icon={<ListAltRounded />} iconPosition="start" label="Daftar Pembelian" />
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 ? renderTransactionTab() : renderHistoryTab()}
        </Box>
      </AppCard>

      <PurchaseDetailDialog open={detailOpen} data={detailData} onClose={() => setDetailOpen(false)} />
    </>
  );
};

export default PurchasePage;
