const router = require("express").Router();
const c = require("../controllers/reportController");
const { auth, authorize } = require("../middleware/authMiddleware");

// All report routes require auth + System Administrator role
router.use(auth, authorize(["System Administrator"]));

// ==================== WARUNG RETAIL ====================

// Penjualan Retail - Summary & Details
router.get("/penjualan-retail/summary", c.getPenjualanRetailSummary);
router.get("/penjualan-retail/details", c.getPenjualanRetailDetails);

// Stok Retail
router.get("/stok-retail", c.getStokRetail);

// Pembelian Retail
router.get("/pembelian-retail", c.getPembelianRetail);

// SHU Retail
router.get("/shu-retail", c.getSHURetail);

// ==================== JASTIP ====================

// Pesanan Jastip - Summary & Details
router.get("/pesanan-jastip/summary", c.getPesananJastipSummary);
router.get("/pesanan-jastip/details", c.getPesananJastipDetails);

// Pembayaran Jastip
router.get("/pembayaran-jastip", c.getPembayaranJastip);

// SHU Jastip
router.get("/shu-jastip", c.getSHUJastip);

// Jastip Metadata (Vendors & Sessions)
router.get("/jastip-metadata", c.getJastipMetadata);

// ==================== SHU GABUNGAN ====================

// SHU Summary (Gabungan Retail + Jastip)
router.get("/shu-summary", c.getSHUSummary);

module.exports = router;
