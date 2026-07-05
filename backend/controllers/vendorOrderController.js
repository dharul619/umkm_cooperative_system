const model = require("../models/vendorOrderModel");
const sessionModel = require("../models/jastipSessionModel");
const db = require("../config/db");

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const formatDateOnly = (value) => {
  if (!value) return "-";
  const stringValue = String(value);
  return stringValue.includes("T") ? stringValue.split("T")[0] : stringValue.split(" ")[0];
};

exports.getBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Always regenerate vendor orders on fetch if session is not OPEN to keep them synchronized with member details
    const [sessionRows] = await sessionModel.getById(sessionId);
    const session = sessionRows[0];
    if (session && session.status !== "OPEN" && Number(session.order_count || 0) > 0) {
      await exports.generateVendorOrdersInternal(Number(sessionId));
    }
    
    const [rows] = await model.getBySessionId(sessionId);
    const data = rows.map((row) => {
      const encodedText = encodeURIComponent(row.order_summary);
      return {
        ...row,
        wa_link: `https://wa.me/${row.vendor_phone}?text=${encodedText}`
      };
    });
    
    res.json(data);
  } catch (err) {
    console.error("getBySessionId error:", err);
    res.status(500).json({ message: err.message || "Gagal mengambil rekap vendor" });
  }
};

exports.generateVendorOrdersInternal = async (sessionId) => {
  const connection = db.promise();
  
  // Fetch session details grouped by vendor, joining users table to get member names
  const [rows] = await connection.query(
    `SELECT jod.qty, jod.price, jod.subtotal,
            m.name AS menu_name, m.vendor_id, v.name AS vendor_name, jo.order_date,
            u.name AS member_name
     FROM jastip_order_details jod
     INNER JOIN jastip_orders jo ON jod.order_id = jo.id
     INNER JOIN menus m ON jod.menu_id = m.id
     INNER JOIN vendors v ON m.vendor_id = v.id
     LEFT JOIN users u ON jod.user_id = u.id
     WHERE jod.order_id = ?`,
    [sessionId]
  );
  
  if (rows.length === 0) return;
  
  // Group by vendor_id
  const vendorGroups = {};
  for (const row of rows) {
    const vid = row.vendor_id;
    if (!vendorGroups[vid]) {
      vendorGroups[vid] = {
        vendorName: row.vendor_name,
        orderDate: row.order_date,
        members: {},
        totalAmount: 0
      };
    }
    
    const mName = row.member_name || "Anggota Tanpa Nama";
    if (!vendorGroups[vid].members[mName]) {
      vendorGroups[vid].members[mName] = {
        items: [],
        memberTotal: 0
      };
    }
    
    vendorGroups[vid].members[mName].items.push({
      menuName: row.menu_name,
      qty: Number(row.qty),
      price: Number(row.price || 0),
      subtotal: Number(row.subtotal)
    });
    
    vendorGroups[vid].members[mName].memberTotal += Number(row.subtotal);
    vendorGroups[vid].totalAmount += Number(row.subtotal);
  }
  
  // Generate rekap text and upsert
  for (const [vid, group] of Object.entries(vendorGroups)) {
    let summary = `*REKAP PESANAN JASTIP*\n`;
    summary += `Sesi Tanggal: ${formatDateOnly(group.orderDate)}\n`;
    summary += `Vendor: ${group.vendorName}\n\n`;
    summary += `*DAFTAR PESANAN PER PEMESAN:*\n\n`;
    
    for (const [mName, memberData] of Object.entries(group.members)) {
      summary += `*${mName}*:\n`;
      for (const item of memberData.items) {
        summary += `  - ${item.menuName} x ${item.qty} porsi (${formatCurrency(item.subtotal)})\n`;
      }
      summary += `  *Total:* ${formatCurrency(memberData.memberTotal)}\n\n`;
    }
    
    summary += `*TOTAL GRAND BELANJA:* ${formatCurrency(group.totalAmount)}\n\n`;
    summary += `Mohon segera diproses, terima kasih!`;
    
    await model.upsert({
      jastip_order_id: sessionId,
      vendor_id: Number(vid),
      order_summary: summary
    });
  }
};

exports.generateVendorOrders = async (req, res) => {
  try {
    const { id } = req.params;
    await exports.generateVendorOrdersInternal(Number(id));
    res.json({ message: "Rekap vendor berhasil digenerate" });
  } catch (err) {
    console.error("generateVendorOrders error:", err);
    res.status(500).json({ message: err.message || "Gagal mengenerate rekap vendor" });
  }
};

exports.markAsSent = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorOrder = await model.getById(id);
    if (!vendorOrder) {
      return res.status(404).json({ message: "Rekap vendor tidak ditemukan" });
    }
    
    await model.markAsSent(id);
    
    const sessionId = vendorOrder.jastip_order_id;
    
    // Check if all other vendor orders for the session are also SENT
    const [allVendorOrders] = await model.getBySessionId(sessionId);
    const allSent = allVendorOrders.every((vo) => vo.whatsapp_status === "SENT");
    
    if (allSent) {
      // Transition session status to ORDERED
      const connection = db.promise();
      await connection.query(
        "UPDATE jastip_orders SET status = 'ORDERED' WHERE id = ? AND status = 'CONFIRMED'",
        [sessionId]
      );
    }
    
    res.json({ message: "Status WhatsApp diubah menjadi SENT", allSent });
  } catch (err) {
    console.error("markAsSent error:", err);
    res.status(500).json({ message: err.message || "Gagal mengubah status kirim" });
  }
};
