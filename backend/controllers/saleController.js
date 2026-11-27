const bcrypt = require('bcrypt');
const db = require('../config/db');
const model = require('../models/saleModel');
const activityLogModel = require('../models/activityLogModel');

const PAYMENT_METHODS = ['CASH', 'QRIS', 'TRANSFER'];
const DISCOUNT_TYPES = ['NONE', 'AMOUNT', 'PERCENT'];
const RUPIAH_DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

const isAdminUser = (user) =>
  (user?.role_name || user?.role) === 'System Administrator';

const sanitizeBlindShift = (shift) => {
  if (!shift) return null;
  return {
    id: shift.id,
    shift_code: shift.shift_code,
    operator_id: shift.operator_id,
    operator_name: shift.operator_name || null,
    opened_at: shift.opened_at,
    closed_at: shift.closed_at,
    opening_cash: Number(shift.opening_cash || 0),
    actual_cash: shift.actual_cash === null || shift.actual_cash === undefined ? null : Number(shift.actual_cash),
    actual_qris: shift.actual_qris === null || shift.actual_qris === undefined ? null : Number(shift.actual_qris),
    actual_transfer: shift.actual_transfer === null || shift.actual_transfer === undefined ? null : Number(shift.actual_transfer),
    denominations: model.parseDenominationsJson(shift.denominations_json || shift.denominations),
    status: shift.status,
    notes: shift.notes || null,
  };
};

const normalizeCloseDenominations = (rawList) => {
  if (!Array.isArray(rawList) || !rawList.length) {
    throw createHttpError('Rincian jumlah lembar/koin per pecahan uang Rupiah wajib diisi');
  }

  const countMap = new Map();
  for (const item of rawList) {
    const denom = Number(item?.denomination);
    const count = Number(item?.count ?? 0);
    if (!RUPIAH_DENOMINATIONS.includes(denom)) {
      throw createHttpError(`Pecahan nominal ${item?.denomination} tidak valid`);
    }
    if (!Number.isInteger(count) || count < 0) {
      throw createHttpError(`Jumlah lembar/koin untuk pecahan ${formatCurrencyText(denom)} harus bilangan bulat >= 0`);
    }
    countMap.set(denom, (countMap.get(denom) || 0) + count);
  }

  let actualCash = 0;
  const normalized = RUPIAH_DENOMINATIONS.map((denom) => {
    const count = countMap.get(denom) || 0;
    const subtotal = denom * count;
    actualCash += subtotal;
    return { denomination: denom, count, subtotal };
  });

  return { normalized, actualCash };
};

const isValidId = (value) => Number.isInteger(value) && value > 0;

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateOnlyString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return getLocalDateString(value);
  return String(value).slice(0, 10);
};

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const verifyAdminAuthorization = async (req) => {
  const rawUsername = String(req.body?.admin_username || '').trim();
  const rawPassword = String(req.body?.admin_password || '');

  if (isAdminUser(req.user) && !rawUsername && !rawPassword) {
    return {
      id: req.user.id,
      name: req.user.name || req.user.username || 'System Administrator',
      username: req.user.username || 'admin',
    };
  }

  if (!rawUsername || !rawPassword) {
    throw createHttpError(
      'Otorisasi System Administrator (username dan password) wajib diisi',
      400
    );
  }

  const [adminRows] = await model.getAdminByUsername(rawUsername);
  const adminUser = adminRows[0];
  if (!adminUser || !adminUser.password) {
    throw createHttpError('Username atau password System Administrator tidak valid', 403);
  }

  const isPasswordMatch = await bcrypt.compare(rawPassword, adminUser.password);
  if (!isPasswordMatch) {
    throw createHttpError('Username atau password System Administrator tidak valid', 403);
  }

  return {
    id: adminUser.id,
    name: adminUser.name,
    username: adminUser.username,
  };
};

const normalizeDiscount = (typeRaw, valueRaw, baseAmount, label = 'Diskon') => {
  const type = String(typeRaw || 'NONE').toUpperCase();
  if (!DISCOUNT_TYPES.includes(type)) {
    throw createHttpError(`${label} tidak valid`);
  }
  const valueNum = Number(valueRaw || 0);
  if (Number.isNaN(valueNum) || valueNum < 0) {
    throw createHttpError(`${label} tidak boleh negatif`);
  }
  if (type === 'NONE' || valueNum === 0) {
    return { type: 'NONE', value: 0, amount: 0 };
  }
  if (type === 'PERCENT') {
    if (valueNum > 100) {
      throw createHttpError(`${label} persen maksimal 100%`);
    }
    const amount = Math.min(baseAmount, Math.round(baseAmount * (valueNum / 100)));
    return { type: 'PERCENT', value: Math.round(valueNum), amount };
  }
  const intAmount = Math.round(valueNum);
  return {
    type: 'AMOUNT',
    value: intAmount,
    amount: Math.min(baseAmount, intAmount),
  };
};

const formatCurrencyText = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

// ===================== POS PRODUCTS & MEMBERS =====================

exports.getPosProducts = async (req, res) => {
  try {
    const [rows] = await model.getPosProducts();
    res.json({ success: true, data: rows, message: 'POS products fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchMembers = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const [rows] = await model.searchMembers(search);
    res.json({ success: true, data: rows, message: 'Members fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== SHIFT & CASH DRAWER =====================

exports.getActiveShift = async (req, res) => {
  try {
    const operatorId = req.user?.id;
    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const shift = await model.getActiveShiftByOperator(operatorId);
    if (!shift) {
      return res.json({ success: true, data: null, message: 'No active shift' });
    }
    if (isAdminUser(req.user)) {
      const liveData = await model.getShiftLiveSummary(shift.id);
      return res.json({ success: true, data: liveData, message: 'Active shift fetched' });
    }
    return res.json({
      success: true,
      data: { shift: sanitizeBlindShift(shift) },
      message: 'Active shift fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getShiftHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const isAdmin = isAdminUser(req.user);
    const operatorId = isAdmin && !req.query.mine ? null : req.user?.id;

    const [[rows], [countRows]] = await Promise.all([
      model.getShiftHistory({ operatorId, limit, offset }),
      model.getShiftHistoryCount({ operatorId }),
    ]);
    const total = Number(countRows?.[0]?.total || 0);
    const responseRows = isAdmin
      ? rows.map((r) => ({ ...r, denominations: model.parseDenominationsJson(r.denominations_json) }))
      : rows.map(sanitizeBlindShift);

    res.json({
      success: true,
      data: responseRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      message: 'Shift history fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.openShift = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const operatorId = req.user?.id;
    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const openingCash = Math.round(Number(req.body?.opening_cash ?? 0));
    const notes = req.body?.notes ? String(req.body.notes).trim().slice(0, 255) : null;

    if (Number.isNaN(openingCash) || openingCash < 0) {
      return res.status(400).json({ success: false, message: 'Modal awal kasir harus >= 0' });
    }

    await conn.beginTransaction();

    const todayStr = getLocalDateString(new Date());
    const closedDay = await model.getDayClosingByDate(todayStr, conn);
    if (closedDay) {
      throw createHttpError(
        `Pembukuan tanggal ${todayStr} sudah ditutup (${closedDay.closing_code}). Tidak dapat membuka shift baru hari ini.`,
        409
      );
    }

    const existing = await model.getActiveShiftByOperator(operatorId, conn);
    if (existing) {
      throw createHttpError(`Shift ${existing.shift_code} masih aktif. Tutup shift terlebih dahulu.`, 409);
    }

    const shiftCode = await model.generateShiftCode(conn, new Date());
    const [result] = await model.createShift(conn, {
      shift_code: shiftCode,
      operator_id: operatorId,
      opening_cash: openingCash,
      notes,
    });

    await conn.commit();

    await activityLogModel.log(
      operatorId,
      `Membuka shift kasir ${shiftCode} dengan modal awal ${formatCurrencyText(openingCash)}`
    );

    if (isAdminUser(req.user)) {
      const liveData = await model.getShiftLiveSummary(result.insertId);
      return res.status(201).json({ success: true, data: liveData, message: `Shift ${shiftCode} berhasil dibuka` });
    }
    const createdShift = await model.getShiftById(result.insertId);
    return res.status(201).json({
      success: true,
      data: { shift: sanitizeBlindShift(createdShift) },
      message: `Shift ${shiftCode} berhasil dibuka`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.closeShift = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const operatorId = req.user?.id;
    const shiftId = Number(req.params.id);
    if (!isValidId(operatorId) || !isValidId(shiftId)) {
      return res.status(400).json({ success: false, message: 'ID shift tidak valid' });
    }

    const { normalized, actualCash } = normalizeCloseDenominations(req.body?.denominations);
    const actualQris = Math.round(Number(req.body?.actual_qris ?? 0));
    const actualTransfer = Math.round(Number(req.body?.actual_transfer ?? 0));
    const notes = req.body?.notes ? String(req.body.notes).trim().slice(0, 255) : null;

    if (!Number.isFinite(actualQris) || actualQris < 0) {
      return res.status(400).json({ success: false, message: 'Total settlement EDC QRIS harus >= 0' });
    }
    if (!Number.isFinite(actualTransfer) || actualTransfer < 0) {
      return res.status(400).json({ success: false, message: 'Total settlement EDC Transfer/Bank harus >= 0' });
    }

    await conn.beginTransaction();

    const shift = await model.getShiftById(shiftId, conn, true);
    if (!shift) throw createHttpError('Shift tidak ditemukan', 404);
    if (shift.status !== 'OPEN') throw createHttpError('Shift sudah ditutup sebelumnya', 409);
    if (Number(shift.operator_id) !== Number(operatorId) && !isAdminUser(req.user)) {
      throw createHttpError('Anda tidak berhak menutup shift ini', 403);
    }

    const heldCount = await model.countHeldCartsByOperator(shift.operator_id, conn);
    if (heldCount > 0) {
      throw createHttpError(
        `Masih ada ${heldCount} transaksi yang ditahan (Hold). Selesaikan atau hapus terlebih dahulu sebelum tutup shift.`,
        409
      );
    }

    const liveData = await model.getShiftLiveSummary(shiftId, conn);
    const s = liveData.summary;
    const cashDifference = actualCash - s.expected_cash;
    const qrisDifference = actualQris - s.total_qris_sales;
    const transferDifference = actualTransfer - s.total_transfer_sales;

    await model.closeShift(conn, shiftId, {
      expected_cash: s.expected_cash,
      actual_cash: actualCash,
      denominations_json: JSON.stringify(normalized),
      cash_difference: cashDifference,
      actual_qris: actualQris,
      actual_transfer: actualTransfer,
      qris_difference: qrisDifference,
      transfer_difference: transferDifference,
      total_sales_count: s.total_sales_count,
      total_cash_sales: s.total_cash_sales,
      total_qris_sales: s.total_qris_sales,
      total_transfer_sales: s.total_transfer_sales,
      total_refund_cash: s.total_refund_cash,
      total_refund_non_cash: s.total_refund_non_cash,
      notes,
    });

    await conn.commit();

    await activityLogModel.log(
      operatorId,
      `Tutup shift ${shift.shift_code} | Tunai: ${formatCurrencyText(actualCash)} (selisih ${formatCurrencyText(cashDifference)}) | QRIS: ${formatCurrencyText(actualQris)} (selisih ${formatCurrencyText(qrisDifference)}) | Transfer: ${formatCurrencyText(actualTransfer)} (selisih ${formatCurrencyText(transferDifference)})`
    );

    if (isAdminUser(req.user)) {
      const closedSummary = await model.getShiftLiveSummary(shiftId);
      return res.json({ success: true, data: closedSummary, message: `Shift ${shift.shift_code} berhasil ditutup` });
    }

    const closedShift = await model.getShiftById(shiftId);
    return res.json({
      success: true,
      data: { shift: sanitizeBlindShift(closedShift) },
      message: `Shift ${shift.shift_code} berhasil ditutup`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ===================== HELD CARTS =====================

exports.getHeldCarts = async (req, res) => {
  try {
    const operatorId = req.user?.id;
    const [rows] = await model.getHeldCartsByOperator(operatorId);
    const parsed = rows.map((row) => {
      let items = [];
      let discount = { type: 'NONE', value: 0 };
      try {
        items = JSON.parse(row.items_json || '[]');
      } catch {
        items = [];
      }
      try {
        discount = row.discount_json ? JSON.parse(row.discount_json) : { type: 'NONE', value: 0 };
      } catch {
        discount = { type: 'NONE', value: 0 };
      }
      return {
        ...row,
        items,
        discount,
      };
    });
    res.json({ success: true, data: parsed, message: 'Held carts fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createHeldCart = async (req, res) => {
  try {
    const operatorId = req.user?.id;
    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { label, member_id, items, discount, notes } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Keranjang kosong tidak dapat ditahan' });
    }

    const activeShift = await model.getActiveShiftByOperator(operatorId);
    const safeLabel =
      String(label || '').trim().slice(0, 100) ||
      `Antrean ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    const [result] = await model.createHeldCart({
      shift_id: activeShift?.id || null,
      operator_id: operatorId,
      label: safeLabel,
      member_id: isValidId(Number(member_id)) ? Number(member_id) : null,
      items_json: JSON.stringify(items),
      discount_json: discount ? JSON.stringify(discount) : null,
      notes: notes ? String(notes).trim().slice(0, 255) : null,
    });

    res.status(201).json({
      success: true,
      data: { id: result.insertId, label: safeLabel },
      message: 'Transaksi berhasil ditahan (Hold)',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteHeldCart = async (req, res) => {
  try {
    const operatorId = req.user?.id;
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'ID keranjang tidak valid' });
    }
    const existing = await model.getHeldCartById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Keranjang tertahan tidak ditemukan' });
    }
    if (Number(existing.operator_id) !== Number(operatorId) && (req.user?.role_name || req.user?.role) !== 'System Administrator') {
      return res.status(403).json({ success: false, message: 'Tidak diizinkan menghapus keranjang ini' });
    }
    await model.deleteHeldCart(id, null);
    res.json({ success: true, message: 'Keranjang tertahan dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== SALES LIST & DETAIL =====================

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, from, to, status, payment_method, shift_id } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 20));
    const filters = {
      search: search ? String(search).trim() : undefined,
      from: from || undefined,
      to: to || undefined,
      status: status ? String(status).toUpperCase() : undefined,
      payment_method: payment_method ? String(payment_method).toUpperCase() : undefined,
      shift_id: shift_id ? Number(shift_id) : undefined,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    };

    const [[rows], [countRows]] = await Promise.all([
      model.getAll(filters),
      model.getTotalCount(filters),
    ]);
    const total = Number(countRows?.[0]?.total || 0);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
      message: 'Sales fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    if (!isValidId(saleId)) {
      return res.status(400).json({ success: false, message: 'Invalid sale id' });
    }
    const [saleRows] = await model.getById(saleId);
    if (!saleRows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    const [[detailRows], [paymentRows], returns] = await Promise.all([
      model.getDetailsBySaleId(saleId),
      model.getSalePaymentsBySaleId(saleId),
      model.getSaleReturnsBySaleId(saleId),
    ]);

    res.json({
      success: true,
      data: {
        sale: saleRows[0],
        details: detailRows,
        payments: paymentRows,
        returns,
      },
      message: 'Sale fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.lookupByInvoice = async (req, res) => {
  try {
    const invoice = String(req.query?.invoice || '').trim();
    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: 'Nomor invoice wajib diisi',
      });
    }

    const [saleRows] = await model.getByInvoiceNumber(invoice);
    if (!saleRows.length) {
      return res.status(404).json({
        success: false,
        message: `Struk dengan nomor invoice "${invoice}" tidak ditemukan`,
      });
    }

    const sale = saleRows[0];
    const [[detailRows], [paymentRows], returns] = await Promise.all([
      model.getDetailsBySaleId(sale.id),
      model.getSalePaymentsBySaleId(sale.id),
      model.getSaleReturnsBySaleId(sale.id),
    ]);

    res.json({
      success: true,
      data: {
        sale,
        details: detailRows,
        payments: paymentRows,
        returns,
      },
      message: 'Sale fetched',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===================== POS CHECKOUT =====================

exports.create = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const {
      items,
      member_id,
      order_discount_type = 'NONE',
      order_discount_value = 0,
      payments,
      notes,
      held_cart_id,
    } = req.body || {};
    const operatorId = req.user?.id;

    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Minimal satu item produk harus dipilih' });
    }

    await conn.beginTransaction();

    const todayStr = getLocalDateString(new Date());
    const closedDay = await model.getDayClosingByDate(todayStr, conn);
    if (closedDay) {
      throw createHttpError(
        `Pembukuan tanggal ${todayStr} sudah ditutup (${closedDay.closing_code}). Tidak dapat membuat transaksi baru hari ini.`,
        409
      );
    }

    // 1. Require active OPEN shift
    const activeShift = await model.getActiveShiftByOperator(operatorId, conn);
    if (!activeShift) {
      throw createHttpError('Shift kasir belum dibuka. Buka shift kasir terlebih dahulu sebelum melakukan transaksi.', 409);
    }

    // 2. Validate optional member
    let validMemberId = null;
    if (member_id !== undefined && member_id !== null && member_id !== '') {
      const parsedMemberId = Number(member_id);
      if (!isValidId(parsedMemberId)) {
        throw createHttpError('ID member koperasi tidak valid');
      }
      const [memberRows] = await model.getApprovedMemberById(conn, parsedMemberId);
      if (!memberRows.length) {
        throw createHttpError('Member koperasi tidak ditemukan atau belum disetujui', 404);
      }
      validMemberId = parsedMemberId;
    }

    // 3. Resolve & merge duplicate items before locking
    const mergedByProduct = new Map();
    for (const rawItem of items) {
      const productId = rawItem.product_id ? Number(rawItem.product_id) : null;
      const barcode = rawItem.barcode ? String(rawItem.barcode).trim() : '';
      const qty = Number(rawItem.qty);

      if ((!isValidId(productId) && !barcode) || !Number.isInteger(qty) || qty <= 0) {
        throw createHttpError('Setiap item harus memiliki produk/barcode dan qty bilangan bulat > 0');
      }

      const [metaRows] = await model.resolveProductMeta(conn, { product_id: productId, barcode });
      if (!metaRows.length) {
        throw createHttpError(`Produk ${barcode || productId} tidak ditemukan`, 404);
      }
      const meta = metaRows[0];
      if (!Number(meta.is_active)) {
        throw createHttpError(`Produk ${meta.name} berstatus non-aktif dan tidak dapat dijual`, 409);
      }

      const discType = String(rawItem.discount_type || 'NONE').toUpperCase();
      const discValue = Number(rawItem.discount_value || 0);

      if (!mergedByProduct.has(meta.id)) {
        mergedByProduct.set(meta.id, {
          product_id: meta.id,
          qty,
          discount_type: discType,
          discount_value: discValue,
        });
      } else {
        const existing = mergedByProduct.get(meta.id);
        existing.qty += qty;
        if (existing.discount_type === 'AMOUNT' && discType === 'AMOUNT') {
          existing.discount_value += discValue;
        } else if (discType !== 'NONE' && existing.discount_type === 'NONE') {
          existing.discount_type = discType;
          existing.discount_value = discValue;
        }
      }
    }

    // Sort by product_id ascending to avoid lock deadlocks
    const orderedItems = Array.from(mergedByProduct.values()).sort(
      (a, b) => a.product_id - b.product_id
    );

    let subtotalAmount = 0;
    let itemDiscountAmount = 0;
    let totalCost = 0;
    const saleDetails = [];

    // 4. Lock products, check stock, compute line totals
    for (const item of orderedItems) {
      const [productRows] = await model.getProductForUpdate(conn, item.product_id);
      if (!productRows.length) {
        throw createHttpError(`Produk #${item.product_id} tidak ditemukan atau non-aktif`, 404);
      }
      const product = productRows[0];

      const stock = await model.getStockByProductId(conn, product.id);
      if (stock < item.qty) {
        throw createHttpError(`Stok produk "${product.name}" tidak cukup (tersedia: ${stock})`, 409);
      }

      const sellingPrice = Math.round(Number(product.selling_price || 0));
      const costPrice = Math.round(Number(product.cost_price || 0));
      const lineGross = item.qty * sellingPrice;

      const lineDisc = normalizeDiscount(
        item.discount_type,
        item.discount_value,
        lineGross,
        `Diskon item ${product.name}`
      );
      const lineSubtotal = Math.max(0, lineGross - lineDisc.amount);

      subtotalAmount += lineGross;
      itemDiscountAmount += lineDisc.amount;
      totalCost += costPrice * item.qty;

      saleDetails.push({
        product_id: product.id,
        product_name: product.name,
        qty: item.qty,
        price: sellingPrice,
        cost_price: costPrice,
        discount_type: lineDisc.type,
        discount_value: lineDisc.value,
        discount_amount: lineDisc.amount,
        subtotal: lineSubtotal,
      });
    }

    const afterItemSubtotal = Math.max(0, subtotalAmount - itemDiscountAmount);
    const orderDisc = normalizeDiscount(
      order_discount_type,
      order_discount_value,
      afterItemSubtotal,
      'Diskon transaksi'
    );

    const discountAmount = itemDiscountAmount + orderDisc.amount;
    const taxAmount = 0;
    const totalAmount = Math.max(0, subtotalAmount - discountAmount + taxAmount);
    const totalProfit = totalAmount - totalCost;
    const positiveProfit = Math.max(0, totalProfit);
    const coordinatorShare = Math.floor(positiveProfit * 0.2);
    const koperasiShare = totalProfit > 0 ? totalProfit - coordinatorShare : 0;

    // 5. Validate payments (single or split)
    let normalizedPayments = [];
    if (Array.isArray(payments) && payments.length > 0) {
      let appliedSum = 0;
      for (const rawPay of payments) {
        const method = String(rawPay.payment_method || '').toUpperCase();
        if (!PAYMENT_METHODS.includes(method)) {
          throw createHttpError('Metode pembayaran harus CASH, QRIS, atau TRANSFER');
        }
        const amount = Math.round(Number(rawPay.amount ?? 0));
        if (Number.isNaN(amount) || amount < 0 || (totalAmount > 0 && amount === 0)) {
          throw createHttpError('Nominal pembayaran tidak valid');
        }
        let receivedAmount = amount;
        let changeAmount = 0;
        if (method === 'CASH') {
          receivedAmount = Math.round(Number(rawPay.received_amount ?? amount));
          if (Number.isNaN(receivedAmount) || receivedAmount < amount) {
            throw createHttpError('Uang tunai diterima kurang dari nominal tagihan tunai');
          }
          changeAmount = receivedAmount - amount;
        }
        const referenceNo =
          method === 'CASH'
            ? null
            : rawPay.reference_no
            ? String(rawPay.reference_no).trim().slice(0, 100)
            : null;

        appliedSum += amount;
        normalizedPayments.push({
          payment_method: method,
          amount,
          received_amount: receivedAmount,
          change_amount: changeAmount,
          reference_no: referenceNo,
        });
      }

      if (appliedSum !== totalAmount) {
        throw createHttpError(
          `Total alokasi pembayaran (${formatCurrencyText(appliedSum)}) harus sama dengan total belanja (${formatCurrencyText(totalAmount)})`
        );
      }
    } else if (totalAmount === 0) {
      normalizedPayments = [
        {
          payment_method: 'CASH',
          amount: 0,
          received_amount: 0,
          change_amount: 0,
          reference_no: null,
        },
      ];
    } else {
      throw createHttpError('Data pembayaran wajib diisi');
    }

    const uniqueMethods = [...new Set(normalizedPayments.map((p) => p.payment_method))];
    const headerPaymentMethod = uniqueMethods.length > 1 ? 'MIXED' : uniqueMethods[0];
    const paidAmount = normalizedPayments.reduce((sum, p) => sum + p.received_amount, 0);
    const changeAmount = normalizedPayments.reduce((sum, p) => sum + p.change_amount, 0);

    // 6. Generate invoice & persist records
    const now = new Date();
    const saleDate = getLocalDateString(now);
    const invoiceNumber = await model.generateInvoiceNumber(conn, now);

    const [saleResult] = await model.createSale(conn, {
      invoice_number: invoiceNumber,
      sale_date: saleDate,
      operator_id: operatorId,
      shift_id: activeShift.id,
      member_id: validMemberId,
      status: 'COMPLETED',
      subtotal_amount: subtotalAmount,
      item_discount_amount: itemDiscountAmount,
      order_discount_type: orderDisc.type,
      order_discount_value: orderDisc.value,
      order_discount_amount: orderDisc.amount,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      total_profit: totalProfit,
      coordinator_share: coordinatorShare,
      koperasi_share: koperasiShare,
      payment_method: headerPaymentMethod,
      paid_amount: paidAmount,
      change_amount: changeAmount,
      notes: notes ? String(notes).trim().slice(0, 255) : null,
    });
    const saleId = saleResult.insertId;

    for (const detail of saleDetails) {
      await model.createDetail(conn, {
        sale_id: saleId,
        ...detail,
      });

      await model.createInventoryTransaction(conn, {
        product_id: detail.product_id,
        type: 'OUT',
        qty: detail.qty,
        reference_id: saleId,
        reference_type: 'SALE',
        note: `Penjualan ${invoiceNumber}`,
      });
    }

    for (const pay of normalizedPayments) {
      await model.createSalePayment(conn, {
        sale_id: saleId,
        ...pay,
        status: 'SETTLED',
      });
    }

    if (isValidId(Number(held_cart_id))) {
      await model.deleteHeldCart(Number(held_cart_id), operatorId, conn);
    }

    await conn.commit();

    await activityLogModel.log(
      operatorId,
      `Transaksi POS ${invoiceNumber} (${headerPaymentMethod}) sebesar ${formatCurrencyText(totalAmount)}`
    );

    const [[saleRows], [detailRows], [paymentRows], returns] = await Promise.all([
      model.getById(saleId),
      model.getDetailsBySaleId(saleId),
      model.getSalePaymentsBySaleId(saleId),
      model.getSaleReturnsBySaleId(saleId),
    ]);

    res.status(201).json({
      success: true,
      data: {
        sale: saleRows[0] || null,
        details: detailRows,
        payments: paymentRows,
        returns,
      },
      message: `Transaksi ${invoiceNumber} berhasil`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ===================== VOID TRANSACTION =====================

exports.voidSale = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const operatorId = req.user?.id;
    const saleId = Number(req.params.id);
    const reason = String(req.body?.reason || '').trim();

    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!isValidId(saleId)) {
      return res.status(400).json({ success: false, message: 'ID transaksi tidak valid' });
    }
    if (reason.length < 3) {
      return res.status(400).json({ success: false, message: 'Alasan pembatalan (void) wajib diisi minimal 3 karakter' });
    }

    const approver = await verifyAdminAuthorization(req);

    await conn.beginTransaction();

    const [saleRows] = await model.getSaleByIdForUpdate(conn, saleId);
    if (!saleRows.length) {
      throw createHttpError('Transaksi penjualan tidak ditemukan', 404);
    }
    const sale = saleRows[0];

    if (sale.status === 'VOIDED') {
      throw createHttpError('Transaksi ini sudah dibatalkan (VOIDED) sebelumnya', 409);
    }
    if (sale.status !== 'COMPLETED') {
      throw createHttpError('Transaksi yang sudah memiliki retur tidak dapat di-void penuh', 409);
    }

    const saleDateStr = toDateOnlyString(sale.sale_date);
    if (saleDateStr) {
      const closedDay = await model.getDayClosingByDate(saleDateStr, conn);
      if (closedDay) {
        throw createHttpError(
          `Transaksi tanggal ${saleDateStr} tidak dapat di-void karena pembukuan hari tersebut sudah ditutup (${closedDay.closing_code}). Gunakan fitur Retur untuk pengembalian barang di hari berjalan.`,
          409
        );
      }
    }

    const [details] = await model.getDetailsBySaleIdForUpdate(conn, saleId);

    await model.markSaleVoided(conn, saleId, {
      voided_by: operatorId,
      void_approved_by: approver.id,
      void_reason: reason.slice(0, 255),
    });
    await model.markPaymentsVoided(conn, saleId);

    for (const detail of details) {
      await model.createInventoryTransaction(conn, {
        product_id: detail.product_id,
        type: 'IN',
        qty: Number(detail.qty),
        reference_id: saleId,
        reference_type: 'SALE_VOID',
        note: `Void ${sale.invoice_number || `#${saleId}`}: ${reason.slice(0, 180)}`,
      });
    }

    await conn.commit();

    await activityLogModel.log(
      operatorId,
      `VOID transaksi ${sale.invoice_number || `#${saleId}`} (${formatCurrencyText(sale.total_amount)}). Alasan: ${reason} | Otorisasi Admin: ${approver.name} (${approver.username})`
    );

    const [[updatedSaleRows], [detailRows], [paymentRows], returns] = await Promise.all([
      model.getById(saleId),
      model.getDetailsBySaleId(saleId),
      model.getSalePaymentsBySaleId(saleId),
      model.getSaleReturnsBySaleId(saleId),
    ]);

    res.json({
      success: true,
      data: {
        sale: updatedSaleRows[0] || null,
        details: detailRows,
        payments: paymentRows,
        returns,
      },
      message: `Transaksi ${sale.invoice_number || `#${saleId}`} berhasil di-void`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// ===================== RETURN / REFUND =====================

exports.createReturn = async (req, res) => {
  const conn = await db.promise().getConnection();
  try {
    const operatorId = req.user?.id;
    const saleId = Number(req.params.id);
    const { items, refund_method = 'CASH', reason } = req.body || {};
    const cleanReason = String(reason || '').trim();
    const normalizedRefundMethod = String(refund_method || 'CASH').toUpperCase();

    if (!isValidId(operatorId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!isValidId(saleId)) {
      return res.status(400).json({ success: false, message: 'ID transaksi tidak valid' });
    }
    if (!PAYMENT_METHODS.includes(normalizedRefundMethod)) {
      return res.status(400).json({ success: false, message: 'Metode refund harus CASH, QRIS, atau TRANSFER' });
    }
    if (cleanReason.length < 3) {
      return res.status(400).json({ success: false, message: 'Alasan retur wajib diisi minimal 3 karakter' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Pilih minimal satu item yang diretur' });
    }

    const approver = await verifyAdminAuthorization(req);

    await conn.beginTransaction();

    const returnDate = getLocalDateString(new Date());
    const closedToday = await model.getDayClosingByDate(returnDate, conn);
    if (closedToday) {
      throw createHttpError(
        `Pembukuan tanggal ${returnDate} sudah ditutup (${closedToday.closing_code}). Tidak dapat memproses retur hari ini.`,
        409
      );
    }

    const [saleRows] = await model.getSaleByIdForUpdate(conn, saleId);
    if (!saleRows.length) {
      throw createHttpError('Transaksi penjualan tidak ditemukan', 404);
    }
    const sale = saleRows[0];

    if (sale.status === 'VOIDED') {
      throw createHttpError('Transaksi yang sudah di-void tidak dapat diretur', 409);
    }
    if (sale.status === 'RETURNED') {
      throw createHttpError('Seluruh item pada transaksi ini sudah diretur', 409);
    }

    const [detailRows] = await model.getDetailsBySaleIdForUpdate(conn, saleId);
    const detailMap = new Map(detailRows.map((d) => [Number(d.id), d]));

    // Merge duplicate sale_detail_id entries
    const requestedMap = new Map();
    for (const rawItem of items) {
      const detailId = Number(rawItem.sale_detail_id);
      const qty = Number(rawItem.qty);
      const restock = rawItem.restock !== false && rawItem.restock !== 0;
      if (!isValidId(detailId) || !Number.isInteger(qty) || qty <= 0) {
        throw createHttpError('Detail item dan jumlah retur harus valid');
      }
      if (!requestedMap.has(detailId)) {
        requestedMap.set(detailId, { sale_detail_id: detailId, qty, restock });
      } else {
        const prev = requestedMap.get(detailId);
        prev.qty += qty;
        prev.restock = prev.restock && restock;
      }
    }

    const afterItemTotal = detailRows.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
    const netRatio = afterItemTotal > 0 ? Number(sale.total_amount || 0) / afterItemTotal : 1;

    const preparedReturnItems = [];
    let totalCostReturned = 0;

    for (const reqItem of requestedMap.values()) {
      const detail = detailMap.get(reqItem.sale_detail_id);
      if (!detail) {
        throw createHttpError(`Item transaksi #${reqItem.sale_detail_id} tidak ditemukan`, 404);
      }
      const remainingQty = Number(detail.qty || 0) - Number(detail.returned_qty || 0);
      if (reqItem.qty > remainingQty) {
        throw createHttpError(
          `Jumlah retur untuk "${detail.product_name || 'produk'}" melebihi sisa qty yang dapat diretur (${remainingQty})`
        );
      }

      const grossPerUnit = Number(detail.qty) > 0 ? Number(detail.subtotal || 0) / Number(detail.qty) : 0;
      const netUnitPrice = Math.round(grossPerUnit * netRatio);
      const itemSubtotal = Math.round(grossPerUnit * reqItem.qty * netRatio);
      const costPrice = Math.round(Number(detail.cost_price || 0));

      totalCostReturned += costPrice * reqItem.qty;
      preparedReturnItems.push({
        sale_detail_id: detail.id,
        product_id: detail.product_id,
        qty: reqItem.qty,
        unit_price: netUnitPrice,
        cost_price: costPrice,
        subtotal: itemSubtotal,
        restock: reqItem.restock,
      });
    }

    // Determine whether all items in the sale will be returned after this action
    let allReturned = true;
    for (const d of detailRows) {
      const reqAdd = requestedMap.get(Number(d.id))?.qty || 0;
      if (Number(d.returned_qty || 0) + reqAdd < Number(d.qty || 0)) {
        allReturned = false;
        break;
      }
    }

    const prevReturnedAmount = Number(sale.returned_amount || 0);
    const prevReturnedProfit = Number(sale.returned_profit || 0);
    const maxRemainingRefund = Math.max(0, Number(sale.total_amount || 0) - prevReturnedAmount);

    let totalRefund = preparedReturnItems.reduce((sum, i) => sum + i.subtotal, 0);
    if (allReturned) {
      totalRefund = maxRemainingRefund;
    } else {
      totalRefund = Math.min(totalRefund, maxRemainingRefund);
    }

    let profitReversal = totalRefund - totalCostReturned;
    if (allReturned) {
      profitReversal = Number(sale.total_profit || 0) - prevReturnedProfit;
    }

    const activeShift = await model.getActiveShiftByOperator(operatorId, conn);
    const now = new Date();
    const returnNumber = await model.generateReturnNumber(conn, now);

    const [retResult] = await model.createSaleReturn(conn, {
      return_number: returnNumber,
      sale_id: saleId,
      shift_id: activeShift?.id || null,
      operator_id: operatorId,
      approved_by: approver.id,
      return_date: getLocalDateString(now),
      total_refund: totalRefund,
      total_profit_reversal: profitReversal,
      refund_method: normalizedRefundMethod,
      reason: cleanReason.slice(0, 255),
    });
    const saleReturnId = retResult.insertId;

    for (const item of preparedReturnItems) {
      await model.createSaleReturnDetail(conn, {
        sale_return_id: saleReturnId,
        ...item,
      });

      await model.incrementReturnedQty(conn, item.sale_detail_id, item.qty);

      if (item.restock) {
        await model.createInventoryTransaction(conn, {
          product_id: item.product_id,
          type: 'IN',
          qty: item.qty,
          reference_id: saleReturnId,
          reference_type: 'SALE_RETURN',
          note: `Retur ${returnNumber} (${sale.invoice_number || `#${saleId}`})`,
        });
      }
    }

    const newStatus = allReturned ? 'RETURNED' : 'PARTIAL_RETURN';
    await model.updateSaleReturnSummary(conn, saleId, {
      status: newStatus,
      returned_amount: prevReturnedAmount + totalRefund,
      returned_profit: prevReturnedProfit + profitReversal,
    });

    await conn.commit();

    await activityLogModel.log(
      operatorId,
      `Retur ${returnNumber} untuk ${sale.invoice_number || `#${saleId}`} sebesar ${formatCurrencyText(totalRefund)} (${normalizedRefundMethod}). Alasan: ${cleanReason} | Otorisasi Admin: ${approver.name} (${approver.username})`
    );

    const [[updatedSaleRows], [updatedDetails], [paymentRows], returns] = await Promise.all([
      model.getById(saleId),
      model.getDetailsBySaleId(saleId),
      model.getSalePaymentsBySaleId(saleId),
      model.getSaleReturnsBySaleId(saleId),
    ]);

    res.status(201).json({
      success: true,
      data: {
        return_number: returnNumber,
        sale: updatedSaleRows[0] || null,
        details: updatedDetails,
        payments: paymentRows,
        returns,
      },
      message: `Retur ${returnNumber} berhasil diproses`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
