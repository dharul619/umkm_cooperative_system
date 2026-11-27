const model = require("../models/reportModel");
const activityLogModel = require("../models/activityLogModel");

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
    const { from, to, category_id, subcategory_id, brand_id } = req.query;
    const data = await model.getStokRetail({
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

/**
 * Audit Shift & Z-Report Retail
 * GET /api/admin/reports/shifts-retail
 */
exports.getShiftsRetail = async (req, res) => {
  try {
    const { from, to, status, audit_status, operator_id, page, limit } = req.query;
    const data = await model.getShiftsRetail({
      from,
      to,
      status,
      audit_status,
      operator_id,
      page,
      limit,
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error("getShiftsRetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Detail Z-Report Shift Retail
 * GET /api/admin/reports/shifts-retail/:id
 */
exports.getShiftRetailDetail = async (req, res) => {
  try {
    const shiftId = Number(req.params.id);
    if (!Number.isInteger(shiftId) || shiftId <= 0) {
      return res.status(400).json({ success: false, message: "ID shift tidak valid" });
    }
    const data = await model.getShiftRetailDetail(shiftId);
    if (!data) {
      return res.status(404).json({ success: false, message: "Shift tidak ditemukan" });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error("getShiftRetailDetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Verifikasi Shift Retail oleh Admin
 * POST /api/admin/reports/shifts-retail/:id/verify
 */
exports.verifyShiftRetail = async (req, res) => {
  try {
    const shiftId = Number(req.params.id);
    if (!Number.isInteger(shiftId) || shiftId <= 0) {
      return res.status(400).json({ success: false, message: "ID shift tidak valid" });
    }
    const adminId = req.user?.id;
    const auditNotes = req.body?.audit_notes ?? req.body?.notes ?? "";

    const data = await model.verifyShiftRetail(shiftId, { adminId, auditNotes });
    const shiftCode = data?.shift?.shift_code || `#${shiftId}`;

    await activityLogModel.log(
      adminId,
      `Verifikasi audit shift ${shiftCode}${auditNotes ? `. Catatan: ${String(auditNotes).trim()}` : ""}`
    );

    res.json({
      success: true,
      data,
      message: `Shift ${shiftCode} berhasil diverifikasi`,
    });
  } catch (err) {
    console.error("verifyShiftRetail error:", err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * Preview Tutup Hari (Day Close / EOD)
 * GET /api/admin/reports/day-closings/preview?date=YYYY-MM-DD
 */
exports.getDayClosePreview = async (req, res) => {
  try {
    const { date } = req.query;
    const data = await model.getDayClosePreview(date);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getDayClosePreview error:", err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * Daftar Riwayat Day Close
 * GET /api/admin/reports/day-closings
 */
exports.getDayClosings = async (req, res) => {
  try {
    const { from, to, page, limit } = req.query;
    const data = await model.getDayClosings({ from, to, page, limit });
    res.json({ success: true, data });
  } catch (err) {
    console.error("getDayClosings error:", err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * Detail Day Close
 * GET /api/admin/reports/day-closings/:id
 */
exports.getDayCloseDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "ID Day Close tidak valid" });
    }
    const data = await model.getDayCloseById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Data Day Close tidak ditemukan" });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error("getDayCloseDetail error:", err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * Proses Tutup Hari (Day Close / EOD)
 * POST /api/admin/reports/day-closings
 */
exports.createDayClose = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { business_date, notes } = req.body || {};

    const data = await model.createDayClose({
      businessDate: business_date,
      adminId,
      notes,
    });
    const dc = data?.day_closing;

    await activityLogModel.log(
      adminId,
      `Tutup Hari (Day Close) ${dc?.closing_code || business_date} untuk tanggal ${dc?.business_date || business_date}${notes ? `. Catatan: ${String(notes).trim()}` : ""}`
    );

    res.status(201).json({
      success: true,
      data,
      message: `Day Close ${dc?.closing_code || ""} berhasil diproses dan tanggal buku dikunci`,
    });
  } catch (err) {
    console.error("createDayClose error:", err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
