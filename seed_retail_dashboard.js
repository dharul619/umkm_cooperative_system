require("dotenv").config();
const db = require("./backend/config/db");

const seed = async () => {
  const promiseDb = db.promise();

  try {
    console.log("Memulai proses seeding data retail...");

    // 1. Bersihkan data retail lama agar tidak menumpuk/duplikat
    await promiseDb.query("SET FOREIGN_KEY_CHECKS = 0;");
    await promiseDb.query("TRUNCATE TABLE sales_details;");
    await promiseDb.query("TRUNCATE TABLE sales;");
    await promiseDb.query("TRUNCATE TABLE inventory_transactions;");
    await promiseDb.query("TRUNCATE TABLE products;");
    await promiseDb.query("TRUNCATE TABLE subcategories;");
    await promiseDb.query("TRUNCATE TABLE categories;");
    await promiseDb.query("TRUNCATE TABLE brands;");
    await promiseDb.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log("✔ Pembersihan tabel retail berhasil.");

    // 2. Insert Brands
    const brands = ["Indofood", "Mayora", "Kapal Api", "Wings Food", "Coca Cola Co."];
    const brandIds = [];
    for (const b of brands) {
      const [res] = await promiseDb.query("INSERT INTO brands (name) VALUES (?)", [b]);
      brandIds.push(res.insertId);
    }
    console.log("✔ Seed brands berhasil.");

    // 3. Insert Categories
    const categories = ["Makanan", "Minuman", "Sembako", "Alat Tulis"];
    const categoryIds = [];
    for (const c of categories) {
      const [res] = await promiseDb.query("INSERT INTO categories (name) VALUES (?)", [c]);
      categoryIds.push(res.insertId);
    }
    console.log("✔ Seed categories berhasil.");

    // 4. Insert Subcategories
    const subcategories = [
      { name: "Camilan & Mie", category_id: categoryIds[0] }, // Makanan
      { name: "Kopi & Teh", category_id: categoryIds[1] },     // Minuman
      { name: "Beras & Gula", category_id: categoryIds[2] },    // Sembako
      { name: "Pulpen & Buku", category_id: categoryIds[3] },   // Alat Tulis
    ];
    const subcategoryIds = [];
    for (const sc of subcategories) {
      const [res] = await promiseDb.query("INSERT INTO subcategories (name, category_id) VALUES (?, ?)", [
        sc.name,
        sc.category_id,
      ]);
      subcategoryIds.push(res.insertId);
    }
    console.log("✔ Seed subcategories berhasil.");

    // 5. Insert Products
    const products = [
      { name: "Indomie Goreng", subcategory_id: subcategoryIds[0], barcode: "8968601111", unit: "pcs", brand_id: brandIds[0], cost_price: 2500, selling_price: 3500 },
      { name: "Wafer Tango Cokelat", subcategory_id: subcategoryIds[0], barcode: "8968602222", unit: "pcs", brand_id: brandIds[1], cost_price: 6000, selling_price: 8000 },
      { name: "Kopi Kapal Api Mix", subcategory_id: subcategoryIds[1], barcode: "8968603333", unit: "pack", brand_id: brandIds[2], cost_price: 12000, selling_price: 15000 },
      { name: "Teh Pucuk Harum", subcategory_id: subcategoryIds[1], barcode: "8968604444", unit: "botol", brand_id: brandIds[1], cost_price: 2800, selling_price: 4000 },
      { name: "Beras Pandan Wangi 5kg", subcategory_id: subcategoryIds[2], barcode: "8968605555", unit: "karung", brand_id: brandIds[3], cost_price: 62000, selling_price: 75000 },
      { name: "Buku Tulis Sinar Dunia", subcategory_id: subcategoryIds[3], barcode: "8968606666", unit: "pack", brand_id: brandIds[3], cost_price: 32000, selling_price: 40000 },
    ];
    const productIds = [];
    for (const p of products) {
      const [res] = await promiseDb.query(
        "INSERT INTO products (name, subcategory_id, barcode, unit, brand_id, cost_price, selling_price, min_stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 5, 1)",
        [p.name, p.subcategory_id, p.barcode, p.unit, p.brand_id, p.cost_price, p.selling_price]
      );
      productIds.push({ id: res.insertId, ...p });
    }
    console.log("✔ Seed products berhasil.");

    // 6. Insert Inventory Transactions (Restock / IN)
    // Berikan stok awal agar inventori bernilai positif
    for (const p of productIds) {
      await promiseDb.query(
        "INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, 'IN', ?, 1, 'ADJUSTMENT', 'Stok Awal Seeding')",
        [p.id, p.name.includes("Beras") ? 20 : 100]
      );
    }
    console.log("✔ Seed inventory_transactions (IN) berhasil.");

    // 7. Insert Sales & Sales Details (Mock Penjualan)
    // Kita buat 3 transaksi penjualan tiruan pada tanggal yang berbeda
    const sales = [
      { date: "2026-06-10", items: [{ idx: 0, qty: 10 }, { idx: 1, qty: 5 }] }, // Indomie & Tango
      { date: "2026-06-12", items: [{ idx: 2, qty: 4 }, { idx: 3, qty: 20 }] }, // Kopi & Teh Pucuk
      { date: "2026-06-14", items: [{ idx: 4, qty: 2 }, { idx: 5, qty: 3 }] },  // Beras & Buku
    ];

    for (const s of sales) {
      let totalAmount = 0;
      let totalProfit = 0;

      // Hitung total dan profit dulu
      for (const item of s.items) {
        const prod = productIds[item.idx];
        const subtotal = prod.selling_price * item.qty;
        const cost = prod.cost_price * item.qty;
        totalAmount += subtotal;
        totalProfit += (subtotal - cost);
      }

      // Bagi hasil koperasi
      const koperasiShare = Math.round(totalProfit * 0.5);
      const coordinatorShare = totalProfit - koperasiShare;

      // Insert ke sales
      const [saleRes] = await promiseDb.query(
        "INSERT INTO sales (sale_date, operator_id, total_amount, total_profit, coordinator_share, koperasi_share) VALUES (?, 1, ?, ?, ?, ?)",
        [s.date, totalAmount, totalProfit, coordinatorShare, koperasiShare]
      );
      const saleId = saleRes.insertId;

      // Insert detail & catat OUT transaksi stok
      for (const item of s.items) {
        const prod = productIds[item.idx];
        const subtotal = prod.selling_price * item.qty;

        await promiseDb.query(
          "INSERT INTO sales_details (sale_id, product_id, qty, price, cost_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
          [saleId, prod.id, item.qty, prod.selling_price, prod.cost_price, subtotal]
        );

        await promiseDb.query(
          "INSERT INTO inventory_transactions (product_id, type, qty, reference_id, reference_type, note) VALUES (?, 'OUT', ?, ?, 'SALE', 'Penjualan Kasir Ritel')",
          [prod.id, item.qty, saleId]
        );
      }
    }
    console.log("✔ Seed sales & sales_details & inventory_transactions (OUT) berhasil.");

    console.log(" Seeding data retail selesai dengan sukses!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat seeding:", err);
    process.exit(1);
  }
};

seed();
