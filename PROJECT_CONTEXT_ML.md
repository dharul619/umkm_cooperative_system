# PROJECT_CONTEXT_ML.md

> File konteks untuk AI coding assistant (Codex / Cursor / Copilot / Claude / ChatGPT).
> **Selalu rujuk file ini** sebelum meminta AI menghasilkan kode untuk modul Machine Learning.
> Tujuan: semua kode yang dihasilkan konsisten dengan arsitektur, skema database, dan aturan bisnis proyek.
> File ini adalah pelengkap dari `PROJECT_CONTEXT.md` (konteks sistem utama). Baca keduanya.

---

## 1. Gambaran Fitur

Membangun **fitur prediksi penjualan** pada Sistem Manajemen Multi-Unit Usaha Koperasi Karyawan Ciledug Jaya Makmur, menggunakan algoritma **Random Forest**.

- **Tujuan bisnis:** memperkirakan jumlah permintaan (demand) tiap produk warung ritel pada periode mendatang, sebagai dasar pengambilan keputusan **pengadaan/restok barang**.
- **Konteks akademik:** ini Tugas Akhir. Maka kode harus **mudah dijelaskan**, setiap tahap (ekstraksi → fitur → latih → evaluasi → simpan) **wajib diberi komentar/penjelasan**, dan metodologinya bisa dipertanggungjawabkan saat sidang.
- **JANGAN mengubah skema database** tanpa diminta eksplisit. Tabel `sales_predictions` sudah tersedia sebagai tujuan output.

---

## 2. Ketersediaan Data (SUDAH TERSEDIA ✅)

Database nyata sudah berisi data penjualan historis yang memadai untuk melatih model:

| Tabel | Jumlah | Keterangan |
| --- | --- | --- |
| `sales` | ≈ 1.253 transaksi | rentang **1 Des 2025 – 22 Mar 2026** (≈ 112 hari / ≈ 16 minggu / ≈ 3,7 bulan) |
| `sales_details` | ≈ 3.088 baris | mencakup **seluruh 20 produk** |
| `products` | 20 | 2 kategori, 11 subkategori, 18 merek |
| `inventory_transactions` | 20 | stok awal (`BEGINNING`) |
| `sales_predictions` | 0 | masih kosong — ini tabel **TUJUAN** output prediksi |

**Implikasi pemodelan:**

- Data cukup untuk melatih Random Forest: ≈ 20 produk × 112 hari ≈ **2.240 observasi** (agregasi harian), atau ≈ **320 observasi** (agregasi mingguan).
- **Granularitas disarankan: harian** (data memadai); **mingguan** sebagai alternatif bila ingin sinyal lebih stabil / mengurangi *noise*.
- **Keterbatasan yang WAJIB dicantumkan di laporan:** rentang data hanya ≈ 3,7 bulan, sehingga **pola musiman tahunan (mis. Lebaran, akhir tahun) belum tertangkap**. Sampaikan sebagai keterbatasan penelitian + saran penelitian lanjutan.
- **Gunakan data nyata ini** — tidak perlu seeder simulasi. (Seeder hanya bila ingin menambah variasi tertentu, dan harus ditandai jelas sebagai data uji coba.)

---

## 3. Tech Stack & Arsitektur Integrasi

| Komponen | Teknologi |
| --- | --- |
| Bahasa pemodelan | **Python 3.11+** |
| Library ML | **scikit-learn** (`RandomForestRegressor`) |
| Pengolahan data | **pandas**, **numpy** |
| Akses database | **mysql-connector-python** atau **SQLAlchemy** + `pandas.read_sql` |
| Visualisasi | **matplotlib** (untuk laporan/EDA) |
| Serialisasi model | **joblib** (`.pkl`) |
| Backend pemanggil | Node.js + Express (sistem utama) |
| Database | MariaDB (kompatibel MySQL), DB: `cooperative_system_db` |

### Pola integrasi yang dipilih: **Batch / Offline (paling sederhana & cocok untuk TA)**

```
[MySQL] --extract--> [Python: train.py / predict.py] --tulis hasil--> [tabel sales_predictions]
                                                                              |
                                                              [Node.js GET /api/predictions] --> [Frontend dashboard]
```

- Python berjalan **terpisah** dari backend (dijalankan manual, terjadwal/cron, atau via endpoint trigger opsional).
- Python **menulis hasil prediksi ke tabel `sales_predictions`**.
- Backend Node.js **hanya membaca** tabel `sales_predictions` (tidak menjalankan ML secara langsung).
- **Alternatif (opsional, tidak wajib):** bungkus model sebagai REST API dengan Flask/FastAPI lalu dipanggil Node. Lebih kompleks — hanya jika diperlukan prediksi real-time.

---

## 4. Sumber Data (Tabel yang Dipakai) — SUMBER KEBENARAN

> Gunakan **persis** nama tabel & kolom ini. Jangan menebak kolom lain.

### 4.1 Tabel inti (wajib untuk model)

```sql
-- Header transaksi penjualan (dimensi waktu)
sales(id, sale_date DATE, operator_id, total_amount, total_profit,
      coordinator_share, koperasi_share, created_at)

-- Rincian item penjualan (INTI: target = qty)
sales_details(id, sale_id -> sales.id, product_id -> products.id,
              qty, price, cost_price, subtotal)

-- Atribut produk (fitur)
products(id, name, subcategory_id -> subcategories.id, barcode, unit,
         brand_id -> brands.id, cost_price, selling_price, min_stock,
         is_active, created_at, updated_at)

-- Hirarki kategori (fitur)
subcategories(id, category_id -> categories.id, name, ...)
categories(id, name, ...)
brands(id, name)
```

### 4.2 Tabel pendukung (fitur opsional)

```sql
-- Untuk mendeteksi kekosongan stok (stockout) -> qty 0 karena habis stok, bukan permintaan 0
inventory_transactions(id, product_id, type('IN','OUT'), qty,
                       reference_id, reference_type('PURCHASE','SALE','ADJUSTMENT','BEGINNING'),
                       note, created_at)
```

### 4.3 Tabel OUTPUT (tujuan hasil prediksi)

```sql
sales_predictions(
  id,
  product_id        -> products.id,
  predicted_demand  INT,        -- hasil prediksi qty (dibulatkan)
  actual_demand     INT NULL,   -- qty aktual (diisi saat backtest / evaluasi periode lampau)
  prediction_date   DATE,       -- periode yang diprediksi
  model_version     VARCHAR(50),-- mis. "rf_v1_2026-06-21"
  created_at        TIMESTAMP
)
```

> ⚠️ **Catatan skema:** `sales.created_at` dan `sales_predictions.created_at` saat ini memiliki `ON UPDATE current_timestamp()` yang sebaiknya **dihapus** (timestamp pembuatan tidak boleh berubah saat baris di-update). Perbaiki bila diizinkan.

---

## 5. Definisi Masalah ML

- **Jenis:** Supervised learning — **Regresi** (memprediksi jumlah/qty, bukan kategori).
- **Target (y):** jumlah unit terjual (`qty`) per **produk** per **periode**.
- **Granularitas periode:** **harian** (data ≈ 112 hari sudah memadai) atau **mingguan** bila ingin sinyal lebih stabil. Tetapkan satu dan konsisten.
- **Unit observasi:** satu baris = (product_id, periode) beserta agregat qty-nya.

### Fitur (X) yang dibangun

| Kelompok | Fitur | Sumber |
| --- | --- | --- |
| Waktu | day_of_week, week_of_year, month, is_weekend, (opsional) is_holiday | `sales.sale_date` |
| Lag | qty periode sebelumnya (lag_1, lag_2, lag_4), rata-rata bergerak (rolling mean 4 periode) | hasil agregasi |
| Produk | subcategory_id, category_id, brand_id, selling_price, cost_price, unit | `products` + join |
| Stok (opsional) | flag stockout (stok = 0 pada periode itu) | `inventory_transactions` |

- Encoding fitur kategorikal: gunakan **one-hot** (jika kategori sedikit) atau **label/ordinal encoding**. Dokumentasikan pilihannya.
- Periode tanpa penjualan untuk suatu produk **diisi qty = 0** (jangan dibiarkan hilang) agar deret waktu utuh.

---

## 6. Pipeline / Alur Pemrosesan (WAJIB diikuti & dijelaskan per tahap)

1. **Ekstraksi** — `SELECT` join `sales` × `sales_details` × `products` (× `subcategories`/`categories`/`brands`) → DataFrame mentah (kolom: sale_date, product_id, qty, harga, kategori, merek).
2. **Agregasi** — kelompokkan per (product_id, periode), jumlahkan `qty` → target. Lengkapi periode kosong dengan 0.
3. **Feature engineering** — bangun fitur waktu, lag, rolling mean, dan atribut produk (lihat §5).
4. **Pembersihan** — tangani *missing values* (akibat lag pada periode awal), buang/raih baris yang tidak valid, tandai stockout.
5. **Split data** — **berbasis waktu** (data lama = latih, data terbaru = uji). JANGAN acak murni untuk data deret waktu agar tidak bocor (*data leakage*).
6. **Pelatihan** — `RandomForestRegressor(n_estimators, max_depth, random_state=42)`. Selalu set `random_state` agar **reproducible**.
7. **Evaluasi** — hitung **MAE, RMSE, MAPE, R²** pada data uji. Tampilkan juga *feature importance*.
8. **Tuning** — bila perlu, lakukan `GridSearchCV`/`RandomizedSearchCV` (dengan `TimeSeriesSplit`).
9. **Simpan model** — `joblib.dump` ke `ml/models/rf_model_<versi>.pkl`.
10. **Prediksi & simpan hasil** — `predict.py` memuat model, memprediksi periode mendatang, lalu **INSERT ke `sales_predictions`** (product_id, predicted_demand, prediction_date, model_version).
11. **Integrasi backend** — Node.js `GET /api/predictions` membaca `sales_predictions` (join `products`) dan menampilkannya di dashboard.

---

## 7. Struktur Folder Python yang Diharapkan

```
ml/
├── config.py            # konfigurasi koneksi DB & parameter (baca dari .env)
├── db.py                # koneksi MySQL/MariaDB + helper read_sql
├── extract.py           # query ekstraksi data penjualan
├── features.py          # fungsi feature engineering (waktu, lag, encoding)
├── train.py             # latih + evaluasi + simpan model (.pkl)
├── predict.py           # muat model + prediksi + tulis ke sales_predictions
├── evaluate.py          # (opsional) backtest + isi actual_demand
├── models/              # menyimpan model terlatih (.pkl)
├── requirements.txt     # scikit-learn, pandas, numpy, mysql-connector-python, joblib, matplotlib, python-dotenv
└── README.md            # cara menjalankan: python train.py / python predict.py
```

- Koneksi DB lewat **.env** (host=127.0.0.1, user=root, password kosong default XAMPP, database=cooperative_system_db). JANGAN hardcode kredensial.
- Semua query DB pakai **parameterized query**.

---

## 8. Konvensi & Aturan Wajib

- **Reproducibility:** selalu `random_state=42` pada split & model.
- **Tanpa data leakage:** fitur lag hanya boleh memakai data masa lalu; split berbasis waktu.
- **Pembulatan:** `predicted_demand` disimpan sebagai integer (qty tidak boleh pecahan) dan **tidak negatif** (clip ke 0).
- **Model versioning:** beri `model_version` bermakna (mis. `rf_v1_<tanggal>`), simpan juga di nama file `.pkl`.
- **Evaluasi jujur:** laporkan metrik apa adanya; jika buruk karena data sedikit, jelaskan keterbatasannya.
- **Penjelasan:** setiap skrip diberi komentar yang menjelaskan *apa* dan *mengapa* (untuk keperluan sidang).
- **Pemisahan domain:** model ritel hanya memakai data ritel; jangan campur data jastip (`menus`, `vendors`, `jastip_*`).

---

## 9. Integrasi Backend (Node.js)

- Endpoint baca prediksi: `GET /api/predictions` → baca `sales_predictions` join `products` (tampilkan nama produk, predicted_demand, prediction_date).
  - Query string opsional: `?prediction_date=` / `?product_id=`.
  - Format response konsisten: `{ success, data, message }`.
- Akses dibatasi peran **System Administrator** & **Business Coordinator** (lihat `PROJECT_CONTEXT.md`).
- (Opsional) `POST /api/predictions/run` — trigger menjalankan `predict.py` via `child_process`. Hanya bila diperlukan; untuk TA, menjalankan skrip manual/terjadwal sudah cukup.

---

## 10. Definition of Done (urutan pengerjaan)

- [x] Data penjualan historis tersedia (≈ 1.253 transaksi, Des 2025 – Mar 2026).
- [ ] `ml/` terbentuk: extract → features → train → predict berjalan end-to-end.
- [ ] Model terlatih tersimpan sebagai `.pkl` dengan `model_version`.
- [ ] Metrik evaluasi (MAE/RMSE/MAPE/R²) tercatat + grafik feature importance.
- [ ] Hasil prediksi tertulis ke tabel `sales_predictions`.
- [ ] Endpoint `GET /api/predictions` mengembalikan data prediksi.
- [ ] Dashboard menampilkan prediksi penjualan.
- [ ] Keterbatasan data & asumsi didokumentasikan untuk laporan.

---

## 11. Yang HARUS dihindari AI

- ❌ Mengubah skema/tabel tanpa izin eksplisit.
- ❌ Menebak nama kolom (mis. `stock`, `amount`, `date`) — pakai nama persis di §4.
- ❌ Melatih model dengan split acak murni pada data deret waktu (data leakage).
- ❌ Menyimpan kredensial DB di dalam kode.
- ❌ Mencampur data jastip ke dalam model ritel.
- ❌ Mengklaim akurasi tanpa data yang memadai.
