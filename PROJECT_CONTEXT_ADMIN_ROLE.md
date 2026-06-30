# PROJECT_CONTEXT_ADMIN_ROLE.md

> File konteks khusus untuk AI coding assistant saat mengerjakan role **System Administrator**.
> Gunakan sebagai referensi utama ketika membangun fitur monitoring, report, analitik, dan prediksi lintas modul.

---

## 1. Gambaran Role

Role **System Administrator** adalah role pengelola dan pengawas sistem secara menyeluruh.
Fokus role ini bukan transaksi operasional harian, melainkan:

- monitoring dua usaha utama: **Jastip** dan **Retail**
- menarik report dan ringkasan data
- mengakses data detail untuk audit dan evaluasi
- mengelola master data retail tertentu yang memang dibutuhkan lintas bisnis
- mengakses fitur prediksi penjualan untuk retail

Role ini harus membantu manajemen memahami kondisi usaha tanpa mencampuri alur operasional harian milik role lain.

---

## 2. Prinsip Desain Role

- `System Administrator` bersifat **monitoring + reporting + governance**.
- Hindari memberi fitur operasional harian jika cukup dimiliki role lain.
- Untuk retail, admin boleh mengelola **master produk** setara dengan `Business Coordinator`.
- Untuk transaksi jastip dan retail, admin umumnya **read-only**, kecuali fitur report memang membutuhkan ekspor atau detail view.
- Tampilan harus mendukung analisis cepat: ringkasan, filter periode, drill-down ke detail.

---

## 3. Ruang Lingkup Fungsional

### 3.1 Usaha Jastip

System Administrator dapat:

1. Menarik report **jastip order** dalam bentuk summary.
2. Menarik report **jastip order detail** untuk melihat isi order per transaksi.
3. Menarik report **jastip session menu** untuk memantau menu yang dibuka pada session tertentu.
4. Menarik report **payments jastip** untuk memantau pembayaran dan status penyelesaian.

### 3.2 Usaha Retail

System Administrator dapat:

1. Mengakses master data retail yang setara dengan `Business Coordinator` untuk **management master produk**.
2. Menarik report **purchase** dalam bentuk summary.
3. Menarik report **purchase detail** untuk melihat rincian barang pada pembelian.
4. Menarik report **sales** dalam bentuk summary.
5. Menarik report **sales detail** untuk melihat rincian barang pada penjualan.
6. Mengakses **sales predictions** untuk kebutuhan prediksi permintaan.

---

## 4. Batasan Role

Role ini tidak ditujukan untuk:

- input order jastip
- input session jastip
- input pembayaran jastip
- input purchase harian retail
- input penjualan / POS retail
- adjustment operasional harian yang bukan bagian dari monitoring admin

Jika fitur bersifat operasional harian, pertimbangkan apakah fitur tersebut seharusnya tetap dimiliki `Business Coordinator` atau role lain.

---

## 5. Struktur Data yang Relevan

### 5.1 Tabel Umum Sistem

#### `roles`
Menyimpan daftar role pengguna sistem.
Dipakai untuk pembatasan akses dan pengenalan fungsi per user.

#### `users`
Menyimpan akun pengguna sistem.
Dipakai untuk login, identitas user, dan relasi ke transaksi tertentu seperti operator penjualan.

#### `activity_logs`
Menyimpan log aktivitas penting pada sistem.
Dipakai jika fitur admin memerlukan audit trail, jejak perubahan, atau monitoring aktivitas user.

### 5.2 Tabel Jastip

#### `vendors`
Menyimpan data vendor / mitra jastip.
Dipakai dalam report jastip jika perlu melihat kontribusi vendor atau relasi vendor terhadap menu/session.

#### `menus`
Menyimpan daftar menu jastip.
Dipakai pada session menu, order, dan report performa menu.

#### `jastip_orders`
Menyimpan header order jastip.
Berisi ringkasan transaksi seperti session, member, total nominal, dan status order.

#### `jastip_order_details`
Menyimpan detail item pada order jastip.
Berisi relasi order ke menu dan qty yang dipesan.

#### `jastip_session_menus`
Menyimpan menu yang dibuka pada session jastip tertentu.
Dipakai untuk report session menu dan analisis menu aktif per session.

#### `payments`
Menyimpan transaksi pembayaran jastip.
Dipakai untuk report pembayaran, status lunas / belum lunas, dan detail nominal pembayaran.

### 5.3 Tabel Retail Master Data

#### `categories`
Menyimpan kategori produk retail.
Merupakan level atas dalam hirarki produk.

#### `subcategories`
Menyimpan subkategori produk retail.
Berelasi ke `categories` melalui `category_id`.

#### `brands`
Menyimpan brand produk.
Dimensi mandiri yang dipakai untuk klasifikasi produk dan analitik.

#### `products`
Menyimpan master produk retail.
Berisi nama produk, `subcategory_id`, barcode, satuan, brand, harga modal, harga jual, stok minimum, dan status aktif.
Ini adalah tabel master utama yang dapat dikelola oleh `Business Coordinator` dan juga `System Administrator`.

#### `suppliers`
Menyimpan supplier retail.
Dipakai untuk purchase dan report pembelian.

### 5.4 Tabel Retail Transaksi

#### `purchases`
Menyimpan header pembelian.
Berisi supplier, tanggal beli, total pembelian, dan waktu input.

#### `purchase_details`
Menyimpan detail item pembelian.
Berisi relasi purchase ke produk, qty, harga beli, dan subtotal.

#### `sales`
Menyimpan header penjualan / POS.
Berisi tanggal jual, operator, total penjualan, total laba, dan pembagian laba.

#### `sales_details`
Menyimpan detail item penjualan.
Berisi relasi sale ke produk, qty, harga jual, snapshot harga modal, dan subtotal.

#### `inventory_transactions`
Menyimpan log mutasi stok.
Ini adalah sumber kebenaran stok retail. Stok dihitung dari akumulasi `IN` dan `OUT`.
Semua pembelian, penjualan, stok awal, dan adjustment harus mengarah ke tabel ini.

#### `sales_predictions`
Menyimpan hasil prediksi demand penjualan.
Dipakai untuk fitur prediksi penjualan dan evaluasi model.

### 5.5 Relasi Data Penting

- `users.role_id` -> `roles.id`
- `subcategories.category_id` -> `categories.id`
- `products.subcategory_id` -> `subcategories.id`
- `products.brand_id` -> `brands.id`
- `purchases.supplier_id` -> `suppliers.id`
- `purchase_details.purchase_id` -> `purchases.id`
- `purchase_details.product_id` -> `products.id`
- `sales.operator_id` -> `users.id`
- `sales_details.sale_id` -> `sales.id`
- `sales_details.product_id` -> `products.id`
- `inventory_transactions.product_id` -> `products.id`
- `sales_predictions.product_id` -> `products.id`

### 5.6 Aturan Stok Retail

Tetap patuhi aturan dari konteks retail utama:

- stok dihitung dari `inventory_transactions`
- `purchase` menghasilkan `IN`
- `sale` menghasilkan `OUT`
- `adjustment` wajib memiliki `note`
- transaksi multi-tabel wajib memakai DB transaction
- stok tidak boleh minus

---

## 6. Jenis Report yang Diutamakan

### 6.1 Report Jastip

- summary order per periode
- detail order per transaksi
- summary session menu
- report payment per periode
- ringkasan nominal dan status pembayaran

### 6.2 Report Retail

- purchase summary
- purchase details
- sales summary
- sales details
- laporan master produk bila diperlukan
- laporan stok jika diperlukan untuk monitoring admin

### 6.3 Prediksi

- sales predictions per produk
- perbandingan prediksi vs aktual
- data pendukung untuk rekomendasi restock

---

## 7. Dashboard Admin

Dashboard System Administrator sebaiknya menjadi dashboard eksekutif lintas bisnis.
Isi yang relevan:

- total transaksi jastip
- total nominal jastip order
- total pembayaran jastip
- total purchase retail
- total sales retail
- total laba retail jika tersedia
- produk dengan stok kritis
- ringkasan prediksi penjualan

Dashboard harus mendukung akses cepat ke report inti tanpa membebani dengan data operasional detail yang berlebihan.

---

## 8. Konvensi Implementasi

### Backend

- tetap gunakan arsitektur: `route -> controller -> service -> query/model`
- gunakan prepared statement untuk semua query
- semua report berbasis filter harus aman terhadap input user
- untuk report yang kompleks, gunakan query terstruktur dan hindari string SQL manual
- untuk data agregat, utamakan query yang jelas dan mudah dijelaskan

### Frontend

- gunakan pola komponen fungsional + hooks
- gunakan tab untuk memisahkan summary / detail / prediction bila perlu
- sediakan filter periode dan pencarian bila relevan
- gunakan tabel yang mendukung drill-down ke detail
- tampilkan loading dan error state yang jelas

---

## 9. Prioritas Pembangunan

Urutan yang disarankan:

1. Dashboard admin lintas bisnis
2. Report jastip order dan order detail
3. Report jastip session menu
4. Report payments jastip
5. Master produk retail untuk admin
6. Report purchase summary dan detail
7. Report sales summary dan detail
8. Sales predictions

---

## 10. Aturan Kerja untuk AI

- Fokus pada **satu fitur per permintaan**.
- Jangan mengubah skema database kecuali diminta eksplisit.
- Ikuti pola data dan struktur repo yang sudah ada.
- Jelaskan logika tiap lapisan ketika menghasilkan kode.
- Bila fitur report menyentuh data lintas tabel, pastikan kontrak datanya jelas terlebih dahulu.
- Hindari menambahkan fitur operasional yang tidak sesuai dengan scope role ini.

---

## 11. Catatan Pengembangan

Role ini harus diposisikan sebagai role yang membantu manajemen menjawab pertanyaan berikut:

- bagaimana performa jastip saat ini?
- apa menu dan session yang paling aktif?
- bagaimana kondisi pembayaran jastip?
- bagaimana performa purchase dan sales retail?
- produk apa yang paling laku?
- produk mana yang perlu di-restock?
- bagaimana hasil prediksi penjualan ke depan?

Jika sebuah fitur tidak membantu menjawab pertanyaan tersebut, kemungkinan fitur itu bukan prioritas role System Administrator.
