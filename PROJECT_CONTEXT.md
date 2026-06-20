# PROJECT_CONTEXT.md

> File konteks untuk AI coding assistant (Codex/ Cursor / Copilot / Windsurf / Claude / ChatGPT).
> **Selalu sertakan / rujuk file ini** sebelum meminta AI menghasilkan kode.
> Tujuan: semua kode yang dihasilkan AI konsisten dengan arsitektur, skema, dan aturan bisnis proyek ini.

---

## 1. Gambaran Proyek

Sistem manajemen multi-unit usaha **Koperasi Karyawan Ciledug Jaya Makmur**.
Terdiri dari dua modul utama:

- **Modul Jastip (Jasa Titip Kuliner)** — sudah ~80% selesai. **JANGAN diubah** kecuali diminta.
- **Modul Warung Ritel** — sedang dibangun. **Fokus pekerjaan ada di sini.**

Proyek ini adalah Tugas Akhir (skripsi). Karena itu:

- Kode harus **mudah dipahami dan dijelaskan** (bukan "pintar" tapi membingungkan).
- **Selalu jelaskan logika** tiap lapisan saat menghasilkan kode.
- **Jangan mengubah skema database** tanpa diminta eksplisit.

---

## 2. Tech Stack & Konvensi

| Komponen | Teknologi                                    |
| -------- | -------------------------------------------- |
| Frontend | React (JavaScript)                           |
| Backend  | Node.js + Express                            |
| Database | MySQL / MariaDB                              |
| Auth     | JWT + bcrypt (password sudah di-hash bcrypt) |

### Konvensi backend

- Arsitektur berlapis: **route → controller → service → query/model**.
  - `route`: definisi endpoint + middleware (auth, role).
  - `controller`: parsing request, panggil service, bentuk response.
  - `service`: **logika bisnis** (validasi, perhitungan, transaksi DB).
  - `query/model`: akses database (prepared statement).
- **WAJIB pakai prepared statement / parameterized query** (cegah SQL injection). Jangan pernah merangkai SQL dengan string concatenation.
- Format response API yang konsisten:
  ```json
  { "success": true, "data": {}, "message": "" }
  ```
- Error pakai HTTP status yang tepat (400 validasi, 401 auth, 403 role, 404 not found, 409 konflik, 500 server).
- Penamaan kolom database: `snake_case`. Penamaan variabel JS: `camelCase`.

### Konvensi frontend

- Komponen fungsional + hooks.
- Pisahkan layer pemanggilan API (mis. folder `services/api`).
- Tampilkan loading & error state.

---

## 3. Role & Hak Akses

Tabel `roles`:

| id  | role_name            |
| --- | -------------------- |
| 1   | System Administrator |
| 2   | Jastip Coordinator   |
| 3   | Business Coordinator |
| 4   | Cooperative Member   |

Untuk **modul ritel**, akses operasional (master produk, pembelian, penjualan/POS, stok opname, laporan) diperuntukkan **System Administrator** dan **Business Coordinator**. Member tidak mengakses operasi ritel internal.

---

## 4. Skema Database (Modul Ritel) — SUMBER KEBENARAN

> Gunakan **persis** nama tabel & kolom ini. Jangan menebak nama lain (mis. jangan pakai `Name`, `stock`, `qty_stock`, dll yang tidak ada).

### 4.1 Master Produk

Hirarki: `categories (1) -> (N) subcategories (1) -> (N) products`.
`brands` adalah dimensi **mandiri** (label opsional), BUKAN anak dari subcategory.

```sql
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);

CREATE TABLE `subcategories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) DEFAULT NULL,   -- FK -> categories(id)
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);

CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `subcategory_id` int(11) NOT NULL,    -- FK -> subcategories(id). WAJIB.
  `barcode` varchar(100) DEFAULT NULL,  -- UNIQUE (boleh NULL)
  `unit` varchar(20) NOT NULL DEFAULT 'pcs',  -- satuan: pcs, kg, pack, renteng, dus
  `brand_id` int(11) DEFAULT NULL,      -- FK -> brands(id). OPSIONAL (NULL = tanpa merek)
  `cost_price` int(11) DEFAULT NULL,    -- harga modal terkini (Rupiah, tanpa desimal)
  `selling_price` int(11) DEFAULT NULL, -- harga jual (Rupiah)
  `min_stock` int(11) NOT NULL DEFAULT 0, -- titik reorder / notifikasi restok
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`)
);
```

### 4.2 Supplier & Pembelian

`suppliers` (pemasok barang ritel) **terpisah** dari `vendors` (mitra jastip kuliner). Jangan disatukan — beda domain/modul.

```sql
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) DEFAULT NULL,   -- FK -> suppliers(id)
  `purchase_date` date DEFAULT NULL,
  `total_amount` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(), -- TANPA ON UPDATE
  PRIMARY KEY (`id`)
);

CREATE TABLE `purchase_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_id` int(11) DEFAULT NULL,   -- FK -> purchases(id)
  `product_id` int(11) DEFAULT NULL,    -- FK -> products(id)
  `qty` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,         -- harga beli per unit saat itu
  `subtotal` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### 4.3 Penjualan

```sql
CREATE TABLE `sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_date` date DEFAULT NULL,
  `operator_id` int(11) DEFAULT NULL,   -- FK -> users(id), kasir/operator
  `total_amount` int(11) DEFAULT NULL,
  `total_profit` int(11) DEFAULT NULL,
  `coordinator_share` int(11) DEFAULT NULL,
  `koperasi_share` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

CREATE TABLE `sales_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) DEFAULT NULL,       -- FK -> sales(id)
  `product_id` int(11) DEFAULT NULL,    -- FK -> products(id)
  `qty` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,         -- harga jual per unit saat transaksi
  `cost_price` int(11) DEFAULT NULL,    -- SNAPSHOT harga modal saat jual (untuk laba akurat)
  `subtotal` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### 4.4 Stok (Inventory) — event log

Stok **TIDAK disimpan sebagai kolom** di `products`. Stok dihitung dari log transaksi ini.

```sql
CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) DEFAULT NULL,    -- FK -> products(id)
  `type` enum('IN','OUT') DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,           -- selalu positif; arah ditentukan oleh `type`
  `reference_id` int(11) DEFAULT NULL,  -- id dokumen sumber (purchase_id / sale_id), NULL untuk ADJUSTMENT/BEGINNING
  `reference_type` enum('PURCHASE','SALE','ADJUSTMENT','BEGINNING') DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,     -- WAJIB diisi untuk ADJUSTMENT (alasan)
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(), -- TANPA ON UPDATE
  PRIMARY KEY (`id`)
);
```

Semantik:

| reference_type | type            | reference_id | note                                        |
| -------------- | --------------- | ------------ | ------------------------------------------- |
| `BEGINNING`    | `IN`            | NULL         | "Stok awal"                                 |
| `PURCHASE`     | `IN`            | purchase_id  | -                                           |
| `SALE`         | `OUT`           | sale_id      | -                                           |
| `ADJUSTMENT`   | `IN` atau `OUT` | NULL         | **WAJIB** (rusak/kadaluarsa/selisih opname) |

### 4.5 Prediksi (untuk Random Forest)

```sql
CREATE TABLE `sales_predictions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) DEFAULT NULL,    -- FK -> products(id)
  `predicted_demand` int(11) DEFAULT NULL,
  `actual_demand` int(11) DEFAULT NULL,
  `prediction_date` date DEFAULT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);
```

---

## 5. ATURAN BISNIS KRITIKAL (sering dilewatkan AI — patuhi!)

1. **Stok = SUM(qty IN) − SUM(qty OUT)** dari `inventory_transactions` per `product_id`. Jangan baca stok dari kolom di `products` (tidak ada).
2. **Setiap pembelian** → simpan `purchases` + `purchase_details`, lalu **buat baris `inventory_transactions`** (`type='IN'`, `reference_type='PURCHASE'`, `reference_id=purchase_id`) untuk tiap item.
3. **Setiap penjualan** → simpan `sales` + `sales_details`, lalu **buat baris `inventory_transactions`** (`type='OUT'`, `reference_type='SALE'`, `reference_id=sale_id`) untuk tiap item.
4. **Snapshot harga modal**: saat menjual, salin `products.cost_price` saat itu ke `sales_details.cost_price`. Laba = `(price - cost_price) * qty`. Jangan hitung laba dari `cost_price` terkini.
5. **DB Transaction wajib**: operasi yang menulis ke beberapa tabel (mis. sales + sales_details + inventory_transactions) HARUS dalam satu transaksi (BEGIN/COMMIT/ROLLBACK). Kalau salah satu gagal, rollback semua.
6. **Stok tidak boleh minus**: sebelum menyimpan penjualan, validasi stok tersedia >= qty. Tolak (HTTP 409) jika tidak cukup.
7. **Stok awal** dicatat via `reference_type='BEGINNING'` (`type='IN'`, `reference_id=NULL`).
8. **Stok opname / koreksi** via `reference_type='ADJUSTMENT'` dengan `note` wajib; `type` bisa IN (tambah) atau OUT (kurang).
9. **Soft delete**: nonaktifkan produk via `is_active=0`, jangan hapus baris (menjaga integritas riwayat transaksi).
10. **Urutan input master** (karena FK): categories → subcategories → brands → products.

---

## 6. Roadmap Pembangunan (urutan fitur)

- [ ] Fase 1: Fondasi — (skema sudah siap)
- [ ] Fase 2: CRUD master (kategori, subkategori, brand, produk) + CRUD supplier
- [ ] Fase 3: Input stok awal (BEGINNING) + query/VIEW stok berjalan
- [ ] Fase 4: Modul Pembelian (purchases + details -> inventory IN)
- [ ] Fase 5: Modul Penjualan/POS (sales + details -> inventory OUT, snapshot cost)
- [ ] Fase 6: Stok opname (ADJUSTMENT)
- [ ] Fase 7: Laporan (stok, kartu stok, laba, produk terlaris)
- [ ] Fase 8: Data prep + integrasi model Random Forest -> sales_predictions

---

## 7. Cara Bekerja dengan AI (aturan untuk asisten)

- Kerjakan **satu fitur per permintaan**. Jangan generate seluruh modul sekaligus.
- **Desain/kontrak API dulu**, baru kode, setelah disetujui.
- Hasilkan kode berlapis: query → service → controller → route.
- **Jelaskan logika tiap lapisan** dan sebutkan **kasus uji** yang harus diperiksa.
- **Jangan mengubah skema database** kecuali diminta eksplisit.
- Gunakan **prepared statement** untuk semua query.
- Pastikan operasi multi-tabel dibungkus **DB transaction**.

### Template prompt

```
Konteks: ikuti PROJECT_CONTEXT.md (skema & aturan bisnis).
Tugas: buat [FITUR] untuk modul warung ritel.
Endpoint: [METHOD] /api/...
Aturan khusus: [validasi & aturan bisnis spesifik fitur ini].
Hasilkan: query -> service -> controller -> route.
Jelaskan logika tiap lapisan, dan sebutkan kasus uji yang harus saya cek.
JANGAN ubah skema database.
```
