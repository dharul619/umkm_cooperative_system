const model = require("../models/reportModel");

/**
 * Penjualan Retail - Summary
 * GET /api/admin/reports/penjualan-retail/summary
 */
exports.getPenjualanRetailSummary = async (req, res) => {
  try {
    const { from, to, category_id, subcategory_id, brand_id, mode } = req.query;
    const data = await model.getPenjualanRetailSummary({
      from,
      to,
      category_id,
      subcategory_id,
      brand_id,
    });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getPenjualanRetailSummary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Penjualan Retail - Details
 * GET /api/admin/reports/penjualan-retail/details
 */
exports.getPenjualanRetailDetails = async (req, res) => {
  try {
    const { from, to, category_id, subcategory_id, brand_id } = req.query;
    const data = await model.getPenjualanRetailDetails({
      from,
      to,
      category_id,
      subcategory_id,
      brand_id,
    });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getPenjualanRetailDetails error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Stok Retail
 * GET /api/admin/reports/stok-retail
 */
exports.getStokRetail = async (req, res) => {
  try {
    const { category_id, subcategory_id, brand_id } = req.query;
    const data = await model.getStokRetail({
      category_id,
      subcategory_id,
      brand_id,
    });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getStokRetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Pembelian Retail
 * GET /api/admin/reports/pembelian-retail
 */
exports.getPembelianRetail = async (req, res) => {
  try {
    const { from, to, supplier_id } = req.query;
    const data = await model.getPembelianRetail({
      from,
      to,
      supplier_id,
    });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getPembelianRetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Pesanan Jastip - Summary
 * GET /api/admin/reports/pesanan-jastip/summary
 */
exports.getPesananJastipSummary = async (req, res) => {
  try {
    const { from, to, vendor_id, session_id } = req.query;
    const data = await model.getPesananJastipSummary({ from, to, vendor_id, session_id });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getPesananJastipSummary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Pesanan Jastip - Details
 * GET /api/admin/reports/pesanan-jastip/details
 */
exports.getPesananJastipDetails = async (req, res) => {
  try {
    const { from, to, vendor_id, session_id } = req.query;
    const data = await model.getPesananJastipDetails({ from, to, vendor_id, session_id });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getPesananJastipDetails error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Pembayaran Jastip
 * GET /api/admin/reports/pembayaran-jastip
 */
exports.getPembayaranJastip = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await model.getPembayaranJastip({ from, to });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getPembayaranJastip error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * SHU Retail
 * GET /api/admin/reports/shu-retail
 */
exports.getSHURetail = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await model.getSHURetail({ from, to });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getSHURetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * SHU Jastip
 * GET /api/admin/reports/shu-jastip
 */
exports.getSHUJastip = async (req, res) => {
  try {
    const { from, to, vendor_id, session_id } = req.query;
    const data = await model.getSHUJastip({ from, to, vendor_id, session_id });

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getSHUJastip error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * SHU Summary (Gabungan)
 * GET /api/admin/reports/shu-summary
 */
exports.getSHUSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await model.getSHUSummary(from, to);

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getSHUSummary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Jastip Metadata
 * GET /api/admin/reports/jastip-metadata
 */
exports.getJastipMetadata = async (req, res) => {
  try {
    const data = await model.getJastipMetadata();
    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("getJastipMetadata error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
