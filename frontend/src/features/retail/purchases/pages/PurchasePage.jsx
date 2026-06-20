import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
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
  const {
    purchases,
    loading,
    saving,
    error,
    refresh,
    createPurchase,
    getPurchase,
  } = usePurchases();
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const filteredRows = useMemo(
    () =>
      purchases.filter(
        (item) =>
          !search.trim() ||
          [
            item.supplier_name,
            item.purchase_date,
            String(item.total_amount ?? ""),
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(search.trim().toLowerCase()),
            ),
      ),
    [purchases, search],
  );

  const handleSubmit = async (payload) => {
    const message = await createPurchase(payload);
    setSuccess(message);
    setFormOpen(false);
  };

  const handleOpenDetail = async (row) => {
    const response = await getPurchase(row.id);
    setDetailData(response);
    setDetailOpen(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Transaksi"
        title="Pembelian"
        description="Catat pembelian supplier dan stok masuk."
        actions={
          <AppButton
            startIcon={<AddRounded />}
            onClick={() => setFormOpen(true)}
          >
            Tambah Pembelian
          </AppButton>
        }
      />
      <StatusAlert severity="error">{error}</StatusAlert>
      <StatusAlert
        severity="success"
        show={!!success}
        onClose={() => setSuccess("")}
      >
        {success}
      </StatusAlert>
      <AppCard
        contentSx={{
          p: { xs: 2, md: 3 },
          "&:last-child": { pb: { xs: 2, md: 3 } },
        }}
      >
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
            <AppButton
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={refresh}
            >
              Refresh
            </AppButton>
          }
        />
        <PurchaseTable
          rows={filteredRows}
          loading={loading}
          onDetail={handleOpenDetail}
        />
      </AppCard>
      <PurchaseForm
        open={formOpen}
        loading={saving || masterLoading}
        suppliers={suppliers}
        products={products}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <PurchaseDetailDialog
        open={detailOpen}
        data={detailData}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
};

export default PurchasePage;
