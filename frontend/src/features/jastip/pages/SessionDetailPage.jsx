import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import CalendarTodayRounded from "@mui/icons-material/CalendarTodayRounded";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import PaidRounded from "@mui/icons-material/PaidRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SendRounded from "@mui/icons-material/SendRounded";
import ReplayRounded from "@mui/icons-material/ReplayRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { jsPDF } from "jspdf";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
  Collapse,
  Tab,
  Tabs,
} from "@mui/material";
import {
  AppButton,
  AppCard,
  DataTable,
  PageHeader,
  StatusAlert,
  ConfirmModal,
} from "../../../shared/components";
import { jastipService } from "../services/jastipService";

/* ─── Constants ─── */
const STATUS_FLOW = ["OPEN", "CONFIRMED", "ORDERED", "DELIVERED", "DONE"];

const statusMeta = {
  OPEN: {
    label: "Buka",
    color: "#1976d2",
    bg: "#E3F2FD",
    bgGradient: "linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 100%)",
    icon: "🟢",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    color: "#E65100",
    bg: "#FFF3E0",
    bgGradient: "linear-gradient(135deg, #FFF3E0 0%, #FFFFFF 100%)",
    icon: "📋",
  },
  ORDERED: {
    label: "Dipesan ke Vendor",
    color: "#6A1B9A",
    bg: "#F3E5F5",
    bgGradient: "linear-gradient(135deg, #F3E5F5 0%, #FFFFFF 100%)",
    icon: "📦",
  },
  DELIVERED: {
    label: "Dijemput",
    color: "#2E7D32",
    bg: "#E8F5E9",
    bgGradient: "linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)",
    icon: "🚚",
  },
  DONE: {
    label: "Selesai",
    color: "#1B5E20",
    bg: "#C8E6C9",
    bgGradient: "linear-gradient(135deg, #C8E6C9 0%, #FFFFFF 100%)",
    icon: "✅",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "#C62828",
    bg: "#FFEBEE",
    bgGradient: "linear-gradient(135deg, #FFEBEE 0%, #FFFFFF 100%)",
    icon: "❌",
  },
};

const paymentStatusMeta = {
  UNPAID: { label: "Belum Bayar", color: "warning" },
  PARTIAL: { label: "Sebagian", color: "info" },
  PAID: { label: "Lunas", color: "success" },
  PENDING: { label: "Pending", color: "warning" },
  SETTLED: { label: "Lunas", color: "success" },
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const s = String(value);
  return s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
};
const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

/* ─── Tiny reusable pieces ─── */
const StatCard = ({ icon, label, value, sub, accent = "#7A2E3A" }) => (
  <AppCard sx={{ height: "100%" }}>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          {label}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={800}
          color={accent}
          sx={{ mt: 0.25 }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            {sub}
          </Typography>
        )}
      </Box>
      <Box sx={{ color: accent, display: "flex", alignItems: "center", ml: 1 }}>
        {icon}
      </Box>
    </Box>
  </AppCard>
);

/* ─── Main Component ─── */
const SessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessionMenus, setSessionMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null);
  const [sentExpanded, setSentExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  /* ── Data fetching ── */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sessionData, menuData, orderData] = await Promise.all([
        jastipService.getSessionById(id),
        jastipService.getSessionMenus(id),
        jastipService.getOrders(),
      ]);
      setSession(sessionData || null);
      setSessionMenus(Array.isArray(menuData) ? menuData : []);
      setOrders(
        (Array.isArray(orderData) ? orderData : []).filter(
          (item) => String(item.order_id) === String(id),
        ),
      );

      if (sessionData && sessionData.status !== "OPEN") {
        try {
          const voData = await jastipService.getVendorOrders(id);
          setVendorOrders(Array.isArray(voData) ? voData : []);
        } catch {
          setVendorOrders([]);
        }
      } else {
        setVendorOrders([]);
      }
    } catch (err) {
      setError(err.message || "Gagal memuat detail session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  /* ── Derived ── */
  const uniqueMembers = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => set.add(o.member_name));
    return set.size;
  }, [orders]);

  const totalQty = useMemo(
    () => orders.reduce((s, o) => s + Number(o.qty || 0), 0),
    [orders],
  );

  const activeStepIndex = useMemo(() => {
    if (!session) return 0;
    if (session.status === "CANCELLED") return -1;
    return STATUS_FLOW.indexOf(session.status);
  }, [session]);

  const waSentCount = vendorOrders.filter(
    (v) => v.whatsapp_status === "SENT",
  ).length;
  const waTotal = vendorOrders.length;

  /* ── Handlers ── */
  const handleSendWA = async (vo) => {
    window.open(vo.wa_link, "_blank");
    try {
      setError("");
      await jastipService.markVendorOrderSent(vo.id);
      setSuccess(
        `Status pengiriman WA ke ${vo.vendor_name} berhasil diperbarui.`,
      );
      await loadData();
    } catch (err) {
      setError(err.message || "Gagal memperbarui status kirim WA");
    }
  };

  const downloadVendorPdf = (vo) => {
    try {
      const pdf = new jsPDF();
      const marginLeft = 14;
      let cursorY = 18;

      // Primary color accent: cooperative dark red #7A2E3A
      const primaryColor = [122, 46, 58];
      const grayColor = [110, 110, 110];

      // Header Brand
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text("REKAP PESANAN JASTIP VENDOR", marginLeft, cursorY);
      cursorY += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text("Koperasi Karyawan 245", marginLeft, cursorY);

      // Horizontal Line
      cursorY += 4;
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, cursorY, 196, cursorY);
      cursorY += 10;

      // Meta Info Card (Bordered Box)
      pdf.setDrawColor(240, 213, 220); // soft pink #F9D5DC
      pdf.setLineWidth(0.25);
      pdf.setFillColor(255, 253, 253);
      pdf.rect(marginLeft, cursorY, 182, 28, "FD");

      // Card Content
      let textY = cursorY + 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text("INFORMASI VENDOR & SESI", marginLeft + 4, textY);
      textY += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Nama Vendor   : ${vo.vendor_name}`, marginLeft + 4, textY);
      pdf.text(
        `Tanggal Sesi  : ${formatDateOnly(session?.order_date)}`,
        marginLeft + 100,
        textY,
      );
      textY += 6;
      pdf.text(
        `No. HP Vendor : ${vo.vendor_phone || "-"}`,
        marginLeft + 4,
        textY,
      );
      pdf.text(
        `Status Sesi   : ${statusMeta[session?.status]?.label || session?.status || "-"}`,
        marginLeft + 100,
        textY,
      );

      cursorY += 36;

      // Table Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text("RINCIAN PESANAN", marginLeft, cursorY);
      cursorY += 6;

      // Filter orders for this vendor
      const vendorItems = orders.filter(
        (o) => String(o.vendor_name) === String(vo.vendor_name),
      );

      // Group items by member_name
      const groupedByMember = {};
      vendorItems.forEach((item) => {
        const mName = item.member_name || "Anggota Tanpa Nama";
        if (!groupedByMember[mName]) {
          groupedByMember[mName] = { items: [], total: 0 };
        }
        groupedByMember[mName].items.push({
          menuName: item.menu_name,
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
          subtotal: Number(item.subtotal || 0),
        });
        groupedByMember[mName].total += Number(item.subtotal || 0);
      });

      // Table Header Row
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, cursorY, 196, cursorY);
      cursorY += 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Pemesan / Menu", marginLeft, cursorY);
      pdf.text("Qty", marginLeft + 104, cursorY);
      pdf.text("Harga Satuan", marginLeft + 129, cursorY);
      pdf.text("Subtotal", marginLeft + 159, cursorY);

      cursorY += 3;
      pdf.line(marginLeft, cursorY, 196, cursorY);
      cursorY += 7;

      // Table Body Rows Grouped by Member
      let totalBelanja = 0;
      Object.entries(groupedByMember).forEach(([mName, data]) => {
        // Check if page needs break before printing next member block
        if (cursorY > 255) {
          pdf.addPage();
          cursorY = 20;
        }

        // Print Member Header (bold, accent color)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text(mName, marginLeft, cursorY);
        cursorY += 6;

        // Print items for this member
        data.items.forEach((item) => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);

          pdf.text(`- ${item.menuName}`, marginLeft + 4, cursorY);
          pdf.text(`${item.qty} porsi`, marginLeft + 104, cursorY);
          pdf.text(formatCurrency(item.price), marginLeft + 129, cursorY);
          pdf.text(formatCurrency(item.subtotal), marginLeft + 159, cursorY);

          cursorY += 6;

          // Page break if near bottom
          if (cursorY > 265) {
            pdf.addPage();
            cursorY = 20;
          }
        });

        // Print Member Subtotal (aligned to subtotal column, highlighted in bold)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text(`Subtotal`, marginLeft + 17, cursorY, {
          align: "right",
        });
        pdf.text(formatCurrency(data.total), marginLeft + 159, cursorY);

        totalBelanja += data.total;
        cursorY += 9;
      });

      // Footer Summary
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, cursorY - 3, 196, cursorY - 3);
      cursorY += 4;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text("Grand total", marginLeft, cursorY);
      pdf.text(formatCurrency(totalBelanja), marginLeft + 159, cursorY);

      cursorY += 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      // pdf.text("Dicetak secara otomatis melalui Aplikasi Cooperative System.", marginLeft, cursorY);

      // Save PDF file
      const fileName = `rekap-vendor-${vo.vendor_name.replace(/\s+/g, "_")}-${formatDateOnly(session?.order_date)}.pdf`;
      pdf.save(fileName);
      setSuccess(`Rekap PDF vendor "${vo.vendor_name}" berhasil diunduh.`);
    } catch (err) {
      setError("Gagal mengunduh PDF rekap vendor: " + err.message);
    }
  };

  const handleStatusChangeClick = (status, label) => {
    setStatusConfirmTarget({ status, label });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirmTarget) return;
    const { status } = statusConfirmTarget;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (status === "CONFIRMED") {
        await jastipService.closeSession(id);
        setSuccess(
          "Sesi jastip berhasil ditutup (CONFIRMED) dan rekap vendor telah digenerate.",
        );
      } else {
        await jastipService.updateSessionStatus(id, status);
        if (status === "DONE") {
          setSuccess(
            "Sesi jastip telah selesai (DONE)! Mengalihkan kembali ke halaman Sesi Aktif...",
          );
          setTimeout(() => {
            navigate("/jastip/sessions");
          }, 1500);
        } else {
          setSuccess(`Status sesi berhasil diubah menjadi ${status}.`);
        }
      }
      setStatusConfirmTarget(null);
      if (status !== "DONE") {
        await loadData();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal mengubah status sesi",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Table columns ── */
  const menuColumns = useMemo(
    () => [
      { field: "menu_name", headerName: "Menu", minWidth: 220 },
      { field: "vendor_name", headerName: "Vendor", minWidth: 180 },
      { field: "notes", headerName: "Catatan", minWidth: 200 },
      {
        field: "jastip_price",
        headerName: "Harga Jastip",
        minWidth: 140,
        render: (value) => (
          <Typography variant="body2" fontWeight={600}>
            {formatCurrency(value)}
          </Typography>
        ),
      },
    ],
    [],
  );

  const orderColumns = useMemo(
    () => [
      {
        field: "member_name",
        headerName: "Member",
        minWidth: 180,
        render: (value) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: 13,
                bgcolor: "#E8D5DA",
                color: "#7A2E3A",
              }}
            >
              {String(value || "?")
                .charAt(0)
                .toUpperCase()}
            </Avatar>
            <Typography variant="body2">{value}</Typography>
          </Box>
        ),
      },
      { field: "menu_name", headerName: "Menu", minWidth: 200 },
      { field: "vendor_name", headerName: "Vendor", minWidth: 160 },
      {
        field: "qty",
        headerName: "Qty",
        minWidth: 80,
        render: (value) => (
          <Chip label={`${value} pcs`} size="small" sx={{ fontWeight: 600 }} />
        ),
      },
      {
        field: "subtotal",
        headerName: "Subtotal",
        minWidth: 140,
        render: (value) => (
          <Typography variant="body2" fontWeight={600}>
            {formatCurrency(value)}
          </Typography>
        ),
      },
      {
        field: "payment_status",
        headerName: "Bayar",
        minWidth: 110,
        render: (value) => {
          const meta = paymentStatusMeta[value] || {
            label: value,
            color: "default",
          };
          return <Chip label={meta.label} size="small" color={meta.color} />;
        },
      },
    ],
    [],
  );

  /* ── Status action helpers ── */
  const nextAction = useMemo(() => {
    if (!session) return null;
    const s = session.status;
    if (s === "OPEN")
      return {
        status: "CONFIRMED",
        label: "Tutup Penerimaan Pesanan",
        color: "primary",
        icon: <LockRounded fontSize="small" />,
      };
    if (s === "CONFIRMED")
      return {
        status: "ORDERED",
        label: "Tandai Diteruskan ke Vendor",
        color: "primary",
        icon: <ArrowForwardRounded fontSize="small" />,
        disabled: vendorOrders.some((v) => v.whatsapp_status !== "SENT"),
      };
    if (s === "ORDERED")
      return {
        status: "DELIVERED",
        label: "Tandai Dijemput",
        color: "primary",
        icon: <LocalShippingRounded fontSize="small" />,
      };
    if (s === "DELIVERED")
      return {
        status: "DONE",
        label: "Selesaikan Sesi",
        color: "success",
        icon: <CheckCircleRounded fontSize="small" />,
      };
    return null;
  }, [session, vendorOrders]);

  const canCancel =
    session &&
    ["OPEN", "CONFIRMED", "ORDERED", "DELIVERED"].includes(session.status);
  const isFinal = session && ["DONE", "CANCELLED"].includes(session.status);

  /* ─────────────── RENDER ─────────────── */
  const sm = session
    ? statusMeta[session.status] || statusMeta.OPEN
    : statusMeta.OPEN;

  const pendingVendors = useMemo(
    () => vendorOrders.filter((v) => v.whatsapp_status !== "SENT"),
    [vendorOrders],
  );
  const sentVendors = useMemo(
    () => vendorOrders.filter((v) => v.whatsapp_status === "SENT"),
    [vendorOrders],
  );

  return (
    <>
      {/* Back to List Button */}
      <Box sx={{ mb: 1 }}>
        <AppButton
          variant="text"
          color="inherit"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/jastip/sessions")}
          sx={{ color: "text.secondary", fontWeight: 700, px: 0, "&:hover": { background: "none", color: "#7A2E3A" } }}
        >
          Kembali ke Daftar Sesi
        </AppButton>
      </Box>

      <PageHeader
        eyebrow="Jastip Coordinator"
        title={`Sesi ${formatDateOnly(session?.order_date)}`}
        description="Pantau progres sesi jastip aktif, kirim rekap pesanan vendor, dan kelola pembayaran."
        actions={
          <AppButton
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={loadData}
            sx={{ borderColor: "#7A2E3A", color: "#7A2E3A", "&:hover": { borderColor: "#C93F58", color: "#C93F58" } }}
          >
            Refresh Data
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

      {/* ── Top Summary Banner Card (Full Width) ── */}
      <AppCard contentSx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: { xs: 3, md: 2 }
          }}
        >
          {/* Column 1: Detail Sesi */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, width: "100%" }}>
            <Avatar sx={{ bgcolor: "#FFF0F2", color: "#7A2E3A", width: 44, height: 44 }}>
              <CalendarTodayRounded fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.5, display: "block" }}>
                TANGGAL SESI
              </Typography>
              <Typography variant="body1" fontWeight={800} color="#7A2E3A" sx={{ mt: 0.25 }}>
                {formatDateOnly(session?.order_date)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Coord: {session?.coordinator_name || "-"}
              </Typography>
            </Box>
          </Box>

          {/* Divider 1 */}
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" }, bgcolor: "#FDE8EC" }} />

          {/* Column 2: Member & Pesanan */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, width: "100%", pl: { md: 2 } }}>
            <Avatar sx={{ bgcolor: "#FFF0F2", color: "#7A2E3A", width: 44, height: 44 }}>
              <PersonRounded fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.5, display: "block" }}>
                PARTISIPAN MEMBER
              </Typography>
              <Typography variant="body1" fontWeight={800} color="#7A2E3A" sx={{ mt: 0.25 }}>
                {uniqueMembers} Member
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {totalQty} item ({orders.length} baris)
              </Typography>
            </Box>
          </Box>

          {/* Divider 2 */}
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" }, bgcolor: "#FDE8EC" }} />

          {/* Column 3: Keuangan (IDR) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, width: "100%", pl: { md: 2 } }}>
            <Avatar sx={{ bgcolor: "#FFF0F2", color: "#7A2E3A", width: 44, height: 44 }}>
              <PaidRounded fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.5, display: "block" }}>
                TRANSAKSI SESI
              </Typography>
              <Typography variant="body1" fontWeight={800} color="#7A2E3A" sx={{ mt: 0.25 }}>
                {formatCurrency(session?.total_amount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Profit: {formatCurrency(session?.total_profit)}
              </Typography>
            </Box>
          </Box>

          {/* Divider 3 */}
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" }, bgcolor: "#FDE8EC" }} />

          {/* Column 4: Status & Logistik */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, width: "100%", pl: { md: 2 } }}>
            <Avatar sx={{ bgcolor: "#FFF0F2", color: "#7A2E3A", width: 44, height: 44 }}>
              <StorefrontRounded fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.5, display: "block" }}>
                STATUS & LOGISTIK
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.25 }}>
                <Chip
                  label={paymentStatusMeta[session?.payment_status]?.label || session?.payment_status || "-"}
                  sx={{
                    bgcolor: "#FFF0F2",
                    color: "#7A2E3A",
                    fontWeight: 800,
                    border: "1px solid #7A2E3A",
                    height: 22,
                    fontSize: "0.75rem",
                    px: 0.5
                  }}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {session?.menu_count ?? sessionMenus.length} menu · {session?.vendor_count || "-"} vendor
              </Typography>
            </Box>
          </Box>
        </Box>
      </AppCard>

      {/* ── Operational Area (Full Width Stack) ── */}
      <Stack spacing={3}>
        {/* Card 1: Status & Kontrol Sesi */}
        <AppCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
              STATUS SESI JASTIP
            </Typography>
            <Chip
              label={sm.label}
              size="medium"
              sx={{
                bgcolor: "#FFF0F2",
                color: "#7A2E3A",
                border: "1px solid #7A2E3A",
                fontWeight: 800,
                fontSize: "0.875rem",
                height: 32,
                px: 1,
              }}
            />
          </Box>

          {/* Status Action Controls */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            {nextAction && (
              <AppButton
                startIcon={nextAction.icon}
                color="inherit"
                disabled={nextAction.disabled}
                onClick={() =>
                  handleStatusChangeClick(nextAction.status, nextAction.label)
                }
                sx={{
                  bgcolor: "#7A2E3A",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#C93F58" },
                }}
              >
                {nextAction.label}
              </AppButton>
            )}
            {canCancel && (
              <AppButton
                variant="outlined"
                color="inherit"
                startIcon={<CancelRounded />}
                onClick={() =>
                  handleStatusChangeClick("CANCELLED", "Batalkan Sesi Jastip")
                }
                sx={{
                  borderColor: "#7A2E3A",
                  color: "#7A2E3A",
                  fontWeight: 800,
                  "&:hover": { borderColor: "#C93F58", color: "#C93F58" },
                }}
              >
                Batalkan
              </AppButton>
            )}
            {isFinal && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", py: 0.75 }}
              >
                Sesi sudah final — tidak ada aksi lebih lanjut.
              </Typography>
            )}
          </Box>

          {/* Progress Stepper inside Card */}
          {session && session.status !== "CANCELLED" && (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #FDE8EC" }}>
              <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ py: 1 }}>
                {STATUS_FLOW.map((step) => {
                  const stepMeta = statusMeta[step];
                  const isActive = step === session.status;
                  return (
                    <Step key={step}>
                      <StepLabel
                        StepIconProps={{
                          sx: {
                            "&.Mui-active": { color: "#7A2E3A" },
                            "&.Mui-completed": { color: "#7A2E3A" },
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={isActive ? 800 : 600}
                          color={isActive ? "#7A2E3A" : "text.secondary"}
                        >
                          {stepMeta.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>
          )}

          {session && session.status === "CANCELLED" && (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #FDE8EC", display: "flex", alignItems: "center", gap: 1.5 }}>
              <CancelRounded sx={{ color: "#7A2E3A", fontSize: 24 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Sesi ini telah dibatalkan. Tidak ada proses selanjutnya.
              </Typography>
            </Box>
          )}
        </AppCard>

        {/* Card 2: Rekap Pesanan Vendor (Shown when session is not OPEN) */}
        {session && session.status !== "OPEN" && vendorOrders.length > 0 && (
          <AppCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <StorefrontRounded sx={{ color: "#7A2E3A", fontSize: 24 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    color="#7A2E3A"
                  >
                    Rekap Pesanan Vendor
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Kirim rekap pesanan ke setiap vendor melalui WhatsApp
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${waSentCount} / ${waTotal} terkirim`}
                size="small"
                sx={{
                  bgcolor: "#FFF0F2",
                  color: "#7A2E3A",
                  fontWeight: 800,
                  border: "1px solid #7A2E3A",
                }}
              />
            </Box>

            {/* WA Progress */}
            {waTotal > 0 && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress
                  variant="determinate"
                  value={(waSentCount / waTotal) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "#FDE8EC",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#7A2E3A",
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}

            <Stack spacing={1.5}>
              {/* Pending List */}
              {pendingVendors.map((vo) => (
                <Box
                  key={vo.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #E5E7EB",
                    bgcolor: "#FAFAFA",
                    transition: "all 0.2s ease",
                    "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      minWidth: 0,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#FFF0F2",
                        color: "#7A2E3A",
                        width: 36,
                        height: 36,
                      }}
                    >
                      <StorefrontRounded fontSize="small" />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {vo.vendor_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vo.vendor_phone || "-"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <Chip
                      label="Belum Kirim"
                      size="small"
                      sx={{
                        bgcolor: "#FFF0F2",
                        color: "#7A2E3A",
                        border: "1px solid #F3C6CE",
                        fontWeight: 700,
                      }}
                    />

                    <AppButton
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<DownloadRounded />}
                      onClick={() => downloadVendorPdf(vo)}
                      sx={{ borderColor: "#7A2E3A", color: "#7A2E3A" }}
                    >
                      Unduh PDF
                    </AppButton>

                    <AppButton
                      size="small"
                      variant="contained"
                      color="inherit"
                      startIcon={<SendRounded />}
                      onClick={() => handleSendWA(vo)}
                      sx={{
                        minWidth: 130,
                        bgcolor: "#7A2E3A",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "#C93F58" },
                      }}
                    >
                      Kirim WA
                    </AppButton>
                  </Box>
                </Box>
              ))}

              {/* Collapsible Sent List Header */}
              {sentVendors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box
                    onClick={() => setSentExpanded(!sentExpanded)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#F9FAFB",
                      border: "1px solid #E5E7EB",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      "&:hover": { bgcolor: "#F3F4F6" },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label="Terkirim"
                        size="small"
                        sx={{
                          bgcolor: "#E5E7EB",
                          color: "#6B7280",
                          fontWeight: 700,
                        }}
                      />
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        Sudah Terkirim ({sentVendors.length} Vendor)
                      </Typography>
                    </Stack>
                    {sentExpanded ? (
                      <ExpandLessRounded sx={{ color: "#7A2E3A" }} />
                    ) : (
                      <ExpandMoreRounded sx={{ color: "#7A2E3A" }} />
                    )}
                  </Box>

                  {/* Collapsible Content */}
                  <Collapse in={sentExpanded} timeout="auto" unmountOnExit>
                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                      {sentVendors.map((vo) => (
                        <Box
                          key={vo.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #E5E7EB",
                            bgcolor: "#FAFAFA",
                            transition: "all 0.2s ease",
                            "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.02)" },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              minWidth: 0,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: "#EEEEEE",
                                color: "#757575",
                                width: 36,
                                height: 36,
                              }}
                            >
                              <StorefrontRounded fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap color="text.secondary">
                                {vo.vendor_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vo.vendor_phone || "-"}
                              </Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              flexShrink: 0,
                            }}
                          >
                            <Tooltip
                              title={`Dikirim pada ${vo.sent_at ? new Date(vo.sent_at).toLocaleString("id-ID") : "-"}`}
                            >
                              <Chip
                                label="Terkirim"
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: "#757575",
                                  borderColor: "#E0E0E0",
                                  fontWeight: 600,
                                }}
                              />
                            </Tooltip>

                            <AppButton
                              size="small"
                              variant="outlined"
                              color="inherit"
                              startIcon={<DownloadRounded />}
                              onClick={() => downloadVendorPdf(vo)}
                              sx={{ borderColor: "#E0E0E0", color: "#757575" }}
                            >
                              Unduh PDF
                            </AppButton>

                            <AppButton
                              size="small"
                              variant="outlined"
                              color="inherit"
                              startIcon={<ReplayRounded />}
                              onClick={() => handleSendWA(vo)}
                              sx={{ minWidth: 130, borderColor: "#E0E0E0", color: "#757575" }}
                            >
                              Kirim Ulang
                            </AppButton>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Collapse>
                </Box>
              )}
            </Stack>
          </AppCard>
        )}

        {/* Card 3: Tabbed Tables Card (Daftar Pesanan & Daftar Menu Session) */}
        <AppCard>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 2.5,
              "& .MuiTab-root": { fontWeight: 800, color: "text.secondary", textTransform: "none", fontSize: "0.95rem" },
              "& .Mui-selected": { color: "#7A2E3A !important" },
              "& .MuiTabs-indicator": { bgcolor: "#7A2E3A", height: 3 },
            }}
          >
            <Tab label={`Pesanan Member (${orders.length})`} />
            <Tab label={`Daftar Menu Tersedia (${sessionMenus.length})`} />
          </Tabs>

          {activeTab === 0 ? (
            <DataTable
              columns={orderColumns}
              rows={orders}
              loading={loading}
              emptyTitle="Belum ada pesanan"
              emptyDescription="Belum ada member yang memesan pada session ini."
            />
          ) : (
            <DataTable
              columns={menuColumns}
              rows={sessionMenus}
              loading={loading}
              emptyTitle="Belum ada menu"
              emptyDescription="Menu pada session ini belum diinput."
            />
          )}
        </AppCard>
      </Stack>

      {/* ── Confirm Status Modal ── */}
      <ConfirmModal
        open={!!statusConfirmTarget}
        title={statusConfirmTarget?.label || "Konfirmasi Status"}
        description={
          statusConfirmTarget?.status === "CANCELLED"
            ? "Apakah Anda yakin ingin membatalkan sesi ini? Tindakan ini tidak dapat dikembalikan."
            : "Apakah Anda yakin ingin mengubah status sesi ini? Pastikan semua persyaratan tahapan sebelumnya telah terpenuhi."
        }
        confirmText={
          statusConfirmTarget?.status === "CANCELLED"
            ? "Ya, Batalkan"
            : "Ubah Status"
        }
        tone={
          statusConfirmTarget?.status === "CANCELLED" ? "danger" : "warning"
        }
        loading={saving}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={handleConfirmStatusChange}
      />
    </>
  );
};

export default SessionDetailPage;
