# PROJECT_CONTEXT_JASTIP.md

> File konteks untuk AI coding assistant (Codex / Cursor / Copilot / Claude / ChatGPT).
> **Selalu rujuk file ini** sebelum meminta AI menghasilkan kode untuk modul **Jastip (Jasa Titip Kuliner)**.
> Pelengkap dari `PROJECT_CONTEXT.md` (sistem utama), `PROJECT_CONTEXT_ADMIN.md`, dan `PROJECT_CONTEXT_ML.md`.

---

## 1. Gambaran Fitur

Modul **Jastip** memfasilitasi pembelian kuliner kolektif di koperasi karyawan. Seorang **Koordinator** membuka sesi jastip berisi menu pilihan dari vendor, anggota memesan & membayar (mock), lalu koordinator meneruskan rekap pesanan ke vendor via WhatsApp, menjemput, dan menyelesaikan pesanan.

Alur ringkas:

```
Koordinator buka SESI (pilih menu dari master)
   -> Member pilih menu & qty
   -> Member bayar (MOCK payment, settle manual)
   -> Koordinator tutup pesanan & teruskan rekap ke WhatsApp tiap vendor (wa.me)
   -> Koordinator menjemput pesanan ke vendor
   -> Koordinator menyelesaikan sesi
```

> Konteks akademik (Tugas Akhir): kode harus **mudah dijelaskan**, tiap lapisan diberi komentar, **jangan ubah skema database** tanpa izin eksplisit. Modul ini sudah ~80% jalan — hati-hati, jangan rusak yang sudah ada.

---

## 2. Keputusan Desain (disepakati)

- **WhatsApp:** memakai **link klik `wa.me`** (manual, cocok untuk mock/TA), BUKAN API otomatis. **WAJIB mendukung pengiriman ke >1 vendor** dalam satu sesi (satu link/pesan WA per vendor).
- **Mock payment:** penyelesaian **manual** lewat tombol **“Tandai Lunas”** (tidak ada gateway nyata). Field webhook pada tabel `payments` boleh diabaikan (atau diisi default) karena tidak memakai callback otomatis.
- **Bagi hasil profit:** **50% Koordinator / 50% Koperasi**.

---

## 3. Asumsi Model Data (boleh dikoreksi)

1. **1 sesi jastip = 1 baris `jastip_orders`** (header sesi). `jastip_session_menus.session_id` = `jastip_orders.id`.
2. **`jastip_session_menus`** = daftar menu yang **ditawarkan** koordinator pada sesi itu.
3. **`jastip_order_details`** = pesanan tiap **member** (`user_id`, `menu_id`, `qty`) dalam sesi.
4. **`payments`** = pembayaran **per member per sesi** (`order_id` = `jastip_orders.id`, `member_id` = user).
5. **`vendor_orders`** = rekap pesanan **per vendor** dalam sesi (untuk diteruskan ke WhatsApp).

---

## 4. Tech Stack & Konvensi

| Komponen | Teknologi |
| --- | --- |
| Frontend | React (JavaScript) |
| Backend | Node.js + Express |
| Database | MariaDB (kompatibel MySQL), DB `cooperative_system_db` |
| Auth | JWT + bcrypt |

- Arsitektur berlapis: **route → controller → service → query/model**.
- **WAJIB parameterized query.** Response konsisten `{ success, data, message }`. HTTP status tepat.
- Operasi multi-tabel (mis. buat pesanan + detail + payment) **dibungkus satu transaksi DB**.
- Kolom DB `snake_case`; variabel JS `camelCase`.
- Uang: integer Rupiah pada tabel jastip; `payments.amount` `DECIMAL(12,2)`.

---

## 5. Role & Hak Akses

| Role | id | Hak di modul Jastip |
| --- | --- | --- |
| System Administrator | 1 | Akses penuh + laporan |
| **Jastip Coordinator** | 2 | Master menu/vendor, buka & kelola sesi, forward WA, jemput, selesaikan, tandai lunas |
| Cooperative Member | 4 | Lihat sesi `OPEN`, pesan menu, bayar (mock) |
| Business Coordinator | 3 | (default tidak akses operasional jastip) |

Lindungi tiap endpoint dengan auth + role guard. Member hanya boleh mengakses/mengubah pesanan **miliknya sendiri**.

---

## 6. Skema Database (Jastip) — SUMBER KEBENARAN

> Gunakan **persis** nama tabel & kolom ini.

```sql
-- Header sesi jastip
CREATE TABLE `jastip_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_date` date DEFAULT NULL,
  `coordinator_id` int(11) DEFAULT NULL,        -- FK -> users(id), role Jastip Coordinator
  `total_amount` int(11) DEFAULT 0,             -- SUM(subtotal) semua detail
  `total_profit` int(11) DEFAULT 0,             -- SUM(profit) semua detail
  `coordinator_share` int(11) DEFAULT 0,        -- 50% dari total_profit
  `koperasi_share` int(11) DEFAULT 0,           -- 50% dari total_profit
  `payment_status` enum('UNPAID','PARTIAL','PAID') DEFAULT 'UNPAID', -- DERIVED dari payments
  `status` enum('OPEN','CONFIRMED','ORDERED','DELIVERED','DONE','CANCELLED') DEFAULT 'OPEN',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

-- Menu yang ditawarkan pada sesi
CREATE TABLE `jastip_session_menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,                -- = jastip_orders.id
  `menu_id` int(11) NOT NULL,                   -- FK -> menus(id)
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);

-- Pesanan tiap member
CREATE TABLE `jastip_order_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,              -- FK -> jastip_orders(id) (sesi)
  `user_id` int(11) DEFAULT NULL,               -- FK -> users(id) (member pemesan)
  `menu_id` int(11) DEFAULT NULL,               -- FK -> menus(id)
  `qty` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,                 -- = menus.jastip_price saat pesan (snapshot)
  `subtotal` int(11) DEFAULT NULL,              -- price * qty
  `profit` int(11) DEFAULT NULL,                -- (jastip_price - base_price) * qty
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

-- Master menu (milik vendor)
CREATE TABLE `menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) DEFAULT NULL,             -- FK -> vendors(id)
  `name` varchar(100) DEFAULT NULL,
  `base_price` int(11) DEFAULT NULL,            -- harga modal dari vendor
  `jastip_price` int(11) DEFAULT NULL,          -- harga jual ke member
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

-- Master vendor
CREATE TABLE `vendors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,             -- untuk wa.me (normalisasi ke format 62xxx)
  `address` text DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- Rekap pesanan per vendor (untuk WhatsApp)
CREATE TABLE `vendor_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jastip_order_id` int(11) DEFAULT NULL,       -- FK -> jastip_orders(id) (sesi)
  `vendor_id` int(11) DEFAULT NULL,             -- FK -> vendors(id)
  `order_summary` text DEFAULT NULL,            -- teks rekap (isi pesan WA)
  `whatsapp_status` enum('PENDING','SENT','FAILED') DEFAULT 'PENDING',
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
);

-- Pembayaran (MOCK) per member per sesi
CREATE TABLE `payments` (
  `id` char(36) NOT NULL,                       -- UUID
  `order_id` int(11) NOT NULL,                  -- = jastip_orders.id (sesi)
  `member_id` int(11) NOT NULL,                 -- FK -> users(id)
  `amount` decimal(12,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'IDR',
  `payment_method` enum('CASH','QRIS','VA_BCA','GOPAY','DANA') DEFAULT NULL,
  `state` enum('PENDING','PROCESSING','SETTLED','FAILED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `external_reference` varchar(64) NOT NULL,    -- referensi mock (boleh UUID/string acak)
  `expires_at` datetime NOT NULL,
  `paid_at` datetime DEFAULT NULL,              -- diisi saat 'Tandai Lunas'
  `webhook_delivered` tinyint(1) NOT NULL DEFAULT 0,  -- tidak dipakai (settle manual)
  `webhook_attempts` int(11) NOT NULL DEFAULT 0,      -- tidak dipakai
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);
```

---

## 7. State Machine Status Sesi (`jastip_orders.status`)

| Status | Arti | Transisi sah |
| --- | --- | --- |
| `OPEN` | Sesi dibuka; member boleh memesan & membayar | → CONFIRMED, CANCELLED |
| `CONFIRMED` | Koordinator menutup penerimaan pesanan (tidak terima order baru) | → ORDERED, CANCELLED |
| `ORDERED` | Rekap sudah diteruskan ke semua vendor (WA terkirim) | → DELIVERED, CANCELLED |
| `DELIVERED` | Pesanan sudah dijemput dari vendor | → DONE |
| `DONE` | Sesi selesai (dibagikan ke member) | (akhir) |
| `CANCELLED` | Sesi dibatalkan | (akhir) |

Aturan transisi:
- Pesanan baru hanya boleh saat `OPEN`.
- Tidak boleh `CONFIRMED` bila belum ada `jastip_order_details`.
- (Opsional) batasi `ORDERED` bila masih ada pembayaran `UNPAID`/`PARTIAL` — atau izinkan dengan peringatan (konfirmasi ke pemilik proyek).
- Cegah transisi mundur/lompat yang tidak sah (400/409).

---

## 8. Area Fitur

### A. Master Menu & Vendor
- CRUD `vendors` (name, phone, address). **Normalisasi `phone` ke format internasional `62xxxxxxxxxx`** (buang `+`, ganti awalan `0` jadi `62`) untuk wa.me.
- CRUD `menus` (vendor_id, name, base_price, jastip_price, is_active). Soft-disable via `is_active`.

### B. Buka & Kelola Sesi
- Buat sesi (`jastip_orders` status `OPEN`, set `coordinator_id`, `order_date`).
- Pilih menu yang ditawarkan → isi `jastip_session_menus` (hanya menu `is_active`).
- Lihat daftar sesi (filter status/tanggal/koordinator), detail sesi (menu, pesanan member, total, pembayaran).

### C. Pemesanan Member
- Member melihat menu pada sesi `OPEN` (join `jastip_session_menus` × `menus`).
- Member menambah pesanan → `jastip_order_details`:
  - `price` = `menus.jastip_price` (snapshot), `subtotal` = price × qty, `profit` = (jastip_price − base_price) × qty.
- Setelah perubahan detail, **hitung ulang** agregat sesi (lihat §9).
- Member hanya boleh mengubah/menghapus pesanannya sendiri & hanya saat `OPEN`.

### D. Mock Payment (settle manual)
- Buat record `payments` per member: `amount` = total subtotal pesanan member dalam sesi, `state='PENDING'`, `external_reference` = string acak, `expires_at` = now + N menit, `payment_method` dipilih member.
- **Tombol “Tandai Lunas”** (koordinator/admin, atau simulasi member): set `state='SETTLED'`, `paid_at=now`.
- Setelah perubahan payment, **hitung ulang `jastip_orders.payment_status`**:
  - semua member SETTLED → `PAID`; sebagian → `PARTIAL`; belum ada → `UNPAID`.
- Tidak ada gateway nyata; jangan panggil API pembayaran eksternal.

### E. Forward ke WhatsApp Vendor (wa.me, multi-vendor)
- Saat `CONFIRMED`, **kelompokkan `jastip_order_details` per `menus.vendor_id`**.
- Untuk **tiap vendor** buat satu `vendor_orders`:
  - `order_summary` = teks rekap (tanggal sesi, daftar `MenuName x totalQty`, total).
  - `whatsapp_status='PENDING'`.
- Backend mengembalikan, untuk tiap vendor, **link `https://wa.me/<phone>?text=<encodeURIComponent(order_summary)>`**.
- UI menampilkan **daftar tombol “Kirim WA” per vendor** (mendukung banyak vendor sekaligus).
- Saat link diklik/dikirim, set `whatsapp_status='SENT'`, `sent_at=now`. Bila semua vendor `SENT` → status sesi `ORDERED`.

### F. Penjemputan & Penyelesaian
- Setelah dijemput → set status `DELIVERED`.
- Setelah dibagikan/selesai → set status `DONE`.
- (Opsional) catat ke `activity_logs` aksi koordinator yang penting.

### G. Bagi Hasil & Laporan
- **Bagi hasil 50:50**: `coordinator_share = floor(total_profit / 2)`, `koperasi_share = total_profit - coordinator_share` (sisa pembulatan ke koperasi). Dokumentasikan aturan pembulatan ini.
- Laporan: rekap per sesi/koordinator/vendor/periode; total omzet, laba, bagi hasil; status pembayaran. (Laporan lintas modul lengkap ada di `PROJECT_CONTEXT_ADMIN.md`.)

---

## 9. Aturan Perhitungan (WAJIB konsisten)

Untuk setiap detail pesanan:
```
price    = menus.jastip_price (snapshot saat pesan)
subtotal = price * qty
profit   = (menus.jastip_price - menus.base_price) * qty
```
Untuk sesi (`jastip_orders`):
```
total_amount      = SUM(jastip_order_details.subtotal)
total_profit      = SUM(jastip_order_details.profit)
coordinator_share = floor(total_profit / 2)
koperasi_share    = total_profit - coordinator_share
payment_status    = derive dari state semua payments member (UNPAID/PARTIAL/PAID)
```
Hitung ulang agregat ini **setiap kali** detail pesanan atau pembayaran berubah, dalam satu transaksi.

---

## 10. Keamanan & Validasi

- Role guard tiap endpoint; member hanya akses data miliknya.
- Validasi transisi status (lihat §7); tolak yang tidak sah.
- Validasi qty > 0; menu harus `is_active` & termasuk `jastip_session_menus` sesi tsb.
- Operasi multi-tabel dalam transaksi DB (atomic).
- Sanitasi `order_summary` sebelum di-encode ke URL wa.me.
- Jangan pernah memanggil API pembayaran/WhatsApp nyata (semuanya mock/manual).

---

## 11. Daftar Endpoint (usulan)

```text
# Master
GET/POST/PUT/DELETE  /api/jastip/vendors
GET/POST/PUT/DELETE  /api/jastip/menus            # ?vendor_id= &is_active=

# Sesi
POST   /api/jastip/sessions                       # buka sesi (OPEN)
GET    /api/jastip/sessions                        # ?status= &date= &coordinator_id=
GET    /api/jastip/sessions/:id                    # detail (menu, pesanan, payment, total)
POST   /api/jastip/sessions/:id/menus              # set menu yang ditawarkan
PATCH  /api/jastip/sessions/:id/status             # transisi status (CONFIRMED/ORDERED/DELIVERED/DONE/CANCELLED)

# Pesanan member
GET    /api/jastip/sessions/:id/menus              # menu yang bisa dipesan member
POST   /api/jastip/sessions/:id/orders             # member tambah pesanan (detail)
PUT    /api/jastip/order-details/:id               # ubah pesanan sendiri (saat OPEN)
DELETE /api/jastip/order-details/:id

# Pembayaran (mock)
POST   /api/jastip/sessions/:id/payments           # buat tagihan member (PENDING)
PATCH  /api/jastip/payments/:id/settle             # 'Tandai Lunas' -> SETTLED

# Vendor / WhatsApp
POST   /api/jastip/sessions/:id/vendor-orders      # generate rekap per vendor + link wa.me[]
PATCH  /api/jastip/vendor-orders/:id/sent          # tandai WA terkirim (SENT)
```
Semua response `{ success, data, message }`.

---

## 12. Definition of Done

- [ ] CRUD master menu & vendor (phone ternormalisasi untuk wa.me).
- [ ] Buka sesi + set menu yang ditawarkan.
- [ ] Member memesan; agregat sesi terhitung otomatis & benar.
- [ ] Mock payment + tombol “Tandai Lunas”; `payment_status` sesi ter-derive.
- [ ] Generate rekap per vendor + **link wa.me untuk banyak vendor**; status WA tercatat.
- [ ] Transisi status sesi tervalidasi (OPEN→...→DONE / CANCELLED).
- [ ] Bagi hasil 50:50 tersimpan dengan aturan pembulatan jelas.

---

## 13. Yang HARUS dihindari AI

- ❌ Mengubah skema/tabel tanpa izin eksplisit; merusak alur jastip yang sudah berjalan.
- ❌ Memanggil API WhatsApp/pembayaran nyata — wajib wa.me (manual) & mock payment manual.
- ❌ Lupa mendukung **banyak vendor** dalam satu sesi (harus beberapa link/pesan WA).
- ❌ Menghitung profit dari harga terkini menu untuk pesanan lama — gunakan snapshot `price`/`profit` di detail.
- ❌ Mengizinkan member mengubah pesanan member lain atau memesan saat sesi bukan `OPEN`.
- ❌ Operasi multi-tabel tanpa transaksi.
- ❌ Menebak nama kolom — pakai nama persis di §6.
