# PROJECT_CONTEXT_ADMIN.md

> File konteks untuk AI coding assistant (Codex / Cursor / Copilot / Claude / ChatGPT).
> **Selalu rujuk file ini** sebelum meminta AI menghasilkan kode untuk modul Administrasi (role: System Administrator).
> Pelengkap dari `PROJECT_CONTEXT.md` (sistem utama / modul ritel) dan `PROJECT_CONTEXT_ML.md` (prediksi). Baca ketiganya bila relevan.

---

## 1. Gambaran Fitur

Modul **Administrasi** adalah pusat kendali sistem koperasi yang dipegang oleh **System Administrator**. Fungsinya:

- Mengelola **pengguna** (akun, role, divisi/departemen) dan **menyetujui pendaftaran** anggota.
- Mengelola **master organisasi** (divisi & departemen).
- Memantau **jejak aktivitas (audit trail)**.
- Menyediakan **dashboard** dan **laporan/analisa lintas modul** (Jastip + Ritel) sebagai dasar pengambilan keputusan pengurus koperasi.

> Konteks akademik (Tugas Akhir): kode harus **mudah dijelaskan**, tiap lapisan diberi komentar, dan **jangan mengubah skema database** tanpa diminta eksplisit.

---

## 2. Cakupan & Batas

- Modul admin **bersifat lintas modul**: berhak melihat & menganalisis data dari **Jastip** maupun **Ritel**, namun fokus operasional ada pada **administrasi sistem + pelaporan**.
- **Laporan bersifat READ-ONLY.** Modul admin **tidak** membuat/mengubah transaksi jastip atau ritel (itu domain masing-masing modul). Admin hanya **membaca & mengagregasi** untuk laporan.
- **JANGAN** mengubah modul Jastip (sudah berjalan) maupun struktur tabel mana pun tanpa izin eksplisit.

---

## 3. Tech Stack & Konvensi

| Komponen | Teknologi |
| --- | --- |
| Frontend | React (JavaScript) |
| Backend | Node.js + Express |
| Database | MariaDB (kompatibel MySQL), DB `cooperative_system_db` |
| Auth | JWT + bcrypt |

### Konvensi backend (sama dengan sistem utama)

- Arsitektur berlapis: **route → controller → service → query/model**.
- **WAJIB parameterized query** (cegah SQL injection). Jangan rangkai SQL dengan string.
- Format response konsisten: `{ "success": true, "data": {}, "message": "" }`.
- HTTP status tepat: 400 validasi, 401 auth, 403 role, 404 not found, 409 konflik, 500 server.
- Kolom DB `snake_case`; variabel JS `camelCase`.

---

## 4. Role & Hak Akses

Tabel `roles` (statis — **admin tidak menambah role baru**, hanya menetapkan ke user):

| id | role_name |
| --- | --- |
| 1 | System Administrator |
| 2 | Jastip Coordinator |
| 3 | Business Coordinator |
| 4 | Cooperative Member |

- **Seluruh endpoint modul admin hanya boleh diakses role `System Administrator`** (role_id = 1). Lindungi dengan middleware auth + role guard.
- Beberapa **laporan** boleh dibagikan ke `Business Coordinator` (ritel) / `Jastip Coordinator` (jastip) bila diperlukan — atur per-endpoint, default-nya admin saja.

---

## 5. Skema Database (Administrasi) — SUMBER KEBENARAN

> Gunakan **persis** nama tabel & kolom ini.

```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,         -- HASH bcrypt. JANGAN pernah dikirim ke client.
  `role_id` int(11) DEFAULT NULL,               -- FK -> roles(id)
  `division_id` int(11) DEFAULT NULL,           -- FK -> divisions(id)
  `department_id` int(11) DEFAULT NULL,         -- FK -> departments(id)
  `status` enum('pending','approved','rejected') DEFAULT 'pending', -- alur persetujuan
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),      -- (lihat catatan bug)
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `divisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL,           -- FK -> divisions(id)
  PRIMARY KEY (`id`)
);

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,               -- FK -> users(id)
  `activity` text DEFAULT NULL,                 -- deskripsi aksi
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(), -- (lihat catatan bug)
  PRIMARY KEY (`id`)
);
```

> ⚠️ **Catatan skema (perbaiki bila diizinkan):** `users.created_at` dan `activity_logs.created_at` saat ini memakai `ON UPDATE current_timestamp()` — keliru, timestamp pembuatan tidak boleh berubah saat baris di-update. Hapus `ON UPDATE` pada kolom `created_at` ini.
>
> ℹ️ **Asumsi desain (boleh dikoreksi):** penonaktifan user dilakukan secara **soft** (tidak hapus permanen). Karena `users` belum punya kolom `is_active`, gunakan `status='rejected'` untuk menonaktifkan, **atau** tambahkan kolom `is_active tinyint(1) DEFAULT 1` (disarankan, perlu izin perubahan skema).

---

## 6. Area Fitur Administrasi

### A. Manajemen Pengguna
- Lihat daftar user (filter by role/divisi/departemen/status, pencarian nama/username, paginasi).
- Tambah user, edit profil, atur `role_id` / `division_id` / `department_id`.
- **Reset password** user (admin set password baru → hash bcrypt). Tidak pernah menampilkan password lama.
- Nonaktifkan/aktifkan user (soft, lihat asumsi di §5).
- **Detail user tidak boleh menyertakan kolom `password`.**

### B. Persetujuan Pendaftaran
- Daftar user `status='pending'`.
- Aksi **approve** (`status='approved'`) atau **reject** (`status='rejected'`).
- Saat approve, pastikan `role_id` sudah ditetapkan (default `Cooperative Member` bila tidak ditentukan).
- Setiap aksi dicatat ke `activity_logs`.

### C. Manajemen Role
- Tampilkan daftar role (read-only; 4 role tetap).
- Tetapkan/ubah role pada user.
- **Tidak** membuat/menghapus role baru (kecuali diminta eksplisit + izin skema).

### D. Master Organisasi (Divisi & Departemen)
- CRUD `divisions`.
- CRUD `departments` (punya `division_id` → wajib valid).
- Cegah hapus divisi/departemen yang masih dipakai user (validasi referensial → 409 konflik).

### E. Log Aktivitas / Audit Trail
- Tampilkan `activity_logs` (join `users` untuk nama pelaku), filter by user & rentang tanggal, paginasi.
- **Catat otomatis** aksi sensitif: approve/reject user, ubah role, reset password, CRUD divisi/departemen, login admin.
- Format `activity` deskriptif & konsisten, mis. `"Approve user #12 (budi) sebagai Cooperative Member"`.

### F. Dashboard Admin
- Ringkasan: jumlah user per role, jumlah pending approval, jumlah divisi/departemen.
- Cuplikan KPI lintas modul (lihat §7): total pendapatan & laba periode berjalan, jumlah transaksi ritel & jastip.
- Daftar pendek: pendaftaran menunggu persetujuan, produk ritel di bawah `min_stock`.

### G. Analisa & Laporan Lintas Modul (READ-ONLY)

Semua laporan: punya **filter rentang tanggal**, agregasi via SQL `GROUP BY`, dan opsi **ekspor (PDF/Excel/CSV)**. Tidak mengubah data apa pun.

**G.1 Laporan Keuangan Gabungan (Jastip + Ritel)**
- Pendapatan, laba, dan **bagi hasil koperasi** per periode dari kedua modul.
- Ritel: dari `sales` (`total_amount`, `total_profit`, `koperasi_share`).
- Jastip: dari `jastip_orders` (`total_amount`, `total_profit`, `coordinator_share`, `koperasi_share`), hanya order `status='DONE'`/valid.

**G.2 Laporan Penjualan Ritel**
- Per periode / produk / subkategori / kategori / merek.
- Produk terlaris (SUM `qty`), omzet (SUM `subtotal`), **laba = SUM(qty × (price − cost_price))** — gunakan **`cost_price` snapshot di `sales_details`**, bukan harga modal produk terkini.
- Sumber: `sales` × `sales_details` × `products` (× `subcategories`/`categories`/`brands`).

**G.3 Laporan Jastip**
- Per periode / koordinator (`coordinator_id`) / vendor / menu.
- Status pesanan (`jastip_orders.status`) & status pembayaran (`payment_status`).
- Pembayaran detail dari tabel `payments` (`amount`, `state`, `payment_method`, `paid_at`).
- Sumber: `jastip_orders` × `jastip_order_details` × `menus` × `vendors`; `payments`.

**G.4 Laporan Stok Ritel**
- **Stok terkini = SUM(qty IN) − SUM(qty OUT)** dari `inventory_transactions` per produk (stok TIDAK disimpan sebagai kolom).
- Produk di bawah `min_stock` (rekomendasi restok).
- Nilai persediaan = stok × `cost_price`.

**G.5 Laporan Pembelian Ritel**
- Per supplier / periode, dari `purchases` × `purchase_details` × `suppliers`.

**G.6 Laporan Prediksi Penjualan (integrasi modul ML)**
- Tampilkan isi `sales_predictions` (predicted_demand per produk per `prediction_date`).
- Rekomendasi restok berbasis prediksi vs stok terkini.
- Akurasi: bandingkan `predicted_demand` vs `actual_demand` (bila terisi).

**G.7 Laporan Aktivitas Pengguna**
- Rekap `activity_logs` per user/periode (audit).

---

## 7. Tabel Lintas Modul untuk Laporan (referensi kolom)

```text
-- RITEL
sales(id, sale_date, operator_id, total_amount, total_profit, coordinator_share, koperasi_share, created_at)
sales_details(id, sale_id, product_id, qty, price, cost_price, subtotal)   -- cost_price = SNAPSHOT
purchases(id, supplier_id, purchase_date, total_amount, created_at)
purchase_details(id, purchase_id, product_id, qty, price, subtotal)
inventory_transactions(id, product_id, type('IN','OUT'), qty, reference_id, reference_type, note, created_at)
products(id, name, subcategory_id, brand_id, cost_price, selling_price, min_stock, is_active, ...)
sales_predictions(id, product_id, predicted_demand, actual_demand, prediction_date, model_version, created_at)

-- JASTIP
jastip_orders(id, order_date, coordinator_id, total_amount, total_profit, coordinator_share, koperasi_share, payment_status, status, created_at)
jastip_order_details(id, order_id, user_id, menu_id, qty, price, subtotal, profit, created_at)
menus(id, vendor_id, name, base_price, jastip_price, is_active, created_at)
vendors(id, name, phone, address)
vendor_orders(id, jastip_order_id, vendor_id, order_summary, whatsapp_status, sent_at, created_at)
payments(id CHAR(36), order_id, member_id, amount DECIMAL(12,2), currency, payment_method, state, external_reference, expires_at, paid_at, ...)
```

---

## 8. Aturan Bisnis & Keamanan (WAJIB)

- **Password**: selalu hash **bcrypt**; **tidak pernah** dikembalikan dalam response apa pun (exclude kolom `password` di setiap SELECT user).
- **Role guard**: semua endpoint admin wajib cek `role_name = 'System Administrator'`.
- **Proteksi diri sendiri**: admin **tidak boleh** menghapus/menonaktifkan/menurunkan role akunnya sendiri.
- **Minimal 1 admin aktif**: cegah aksi yang membuat sistem tanpa System Administrator aktif (409).
- **Audit**: catat setiap aksi sensitif ke `activity_logs`.
- **Laporan read-only**: endpoint laporan tidak melakukan INSERT/UPDATE/DELETE pada data transaksi.
- **Pemisahan domain**: jangan campur logika jastip ke dalam ritel atau sebaliknya; laporan hanya membaca.
- **Validasi referensial**: tolak hapus divisi/departemen/role yang masih dirujuk user.
- **Uang**: nilai ritel/jastip pakai integer Rupiah; `payments.amount` pakai DECIMAL(12,2) — hati-hati saat menjumlah lintas tipe.

---

## 9. Daftar Endpoint (usulan)

```text
# Pengguna
GET    /api/admin/users                 # daftar + filter (role, division, department, status, q)
GET    /api/admin/users/:id             # detail (tanpa password)
POST   /api/admin/users                 # tambah user
PUT    /api/admin/users/:id             # edit profil/role/divisi/departemen
PATCH  /api/admin/users/:id/status      # approve / reject (status)
PATCH  /api/admin/users/:id/reset-password
PATCH  /api/admin/users/:id/deactivate  # nonaktif (soft)

# Pendaftaran
GET    /api/admin/registrations         # daftar status=pending

# Role (read-only)
GET    /api/admin/roles

# Organisasi
GET    /api/admin/divisions
POST   /api/admin/divisions
PUT    /api/admin/divisions/:id
DELETE /api/admin/divisions/:id
GET    /api/admin/departments           # ?division_id=
POST   /api/admin/departments
PUT    /api/admin/departments/:id
DELETE /api/admin/departments/:id

# Audit
GET    /api/admin/activity-logs         # ?user_id= &from= &to=

# Dashboard & Laporan
GET    /api/admin/dashboard             # ringkasan KPI
GET    /api/admin/reports/finance       # gabungan jastip+ritel ?from= &to=
GET    /api/admin/reports/sales         # penjualan ritel
GET    /api/admin/reports/jastip        # penjualan jastip
GET    /api/admin/reports/stock         # stok ritel + di bawah min_stock
GET    /api/admin/reports/purchases     # pembelian ritel
GET    /api/admin/reports/predictions   # dari sales_predictions
GET    /api/admin/reports/:name/export  # ekspor PDF/Excel/CSV
```

Semua response: `{ success, data, message }`.

---

## 10. Definition of Done

- [ ] Middleware auth + role guard System Administrator terpasang di semua endpoint admin.
- [ ] CRUD user + approve/reject + reset password + nonaktif berjalan; password selalu di-hash & tidak pernah bocor.
- [ ] CRUD divisi & departemen dengan validasi referensial.
- [ ] Activity log otomatis untuk aksi sensitif + halaman audit.
- [ ] Dashboard admin menampilkan KPI ringkas.
- [ ] Laporan lintas modul (keuangan, penjualan ritel, jastip, stok, pembelian, prediksi) + filter tanggal + ekspor.
- [ ] Proteksi "diri sendiri" & "minimal 1 admin aktif".

---

## 11. Yang HARUS dihindari AI

- ❌ Mengembalikan kolom `password` ke client.
- ❌ Membuat endpoint admin tanpa role guard.
- ❌ Mengubah skema/tabel tanpa izin eksplisit.
- ❌ Menebak nama kolom — pakai nama persis di §5 & §7.
- ❌ Membuat laporan yang menulis/mengubah data transaksi.
- ❌ Menghitung laba ritel dari `products.cost_price` terkini — gunakan `sales_details.cost_price` (snapshot).
- ❌ Menjadikan stok sebagai kolom — stok dihitung dari `inventory_transactions`.
- ❌ Mengizinkan admin menghapus/menurunkan akunnya sendiri atau mengosongkan admin terakhir.
