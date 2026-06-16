# Cooperative System — Jastip Module

## 📌 Overview

Jastip Module merupakan salah satu modul utama pada sistem koperasi yang digunakan untuk membantu proses penitipan pembelian makanan/minuman (jastip) di lingkungan perusahaan.

Modul ini memungkinkan:

- pengelolaan vendor
- pengelolaan menu harian
- pemesanan makanan oleh anggota koperasi
- monitoring status pesanan
- pembayaran berbasis mock payment gateway (daring & tunai), tanpa integrasi pihak ketiga
- pengiriman rekap pesanan ke vendor melalui WhatsApp API
- monitoring dan reporting oleh administrator

---

# 🎯 Main Features

## 👨‍💼 System Administrator

- Dashboard monitoring
- Analytics & reporting
- Export report CSV/PDF
- Monitoring transaksi & pembayaran
- Monitoring profit koperasi

---

## 🍱 Jastip Coordinator

- Manage vendor
- Manage menu harian
- Membuka sesi jastip
- Monitoring order
- Konfirmasi pembayaran tunai dari anggota
- Mengirim rekap pesanan ke vendor

---

## 👤 Cooperative Member

- Melihat menu harian
- Melakukan pemesanan
- Memilih metode pembayaran (daring atau tunai)
- Melakukan pembayaran via simulator
- Melihat status pesanan dan pembayaran

---

# 🔥 Business Flow

## 1. Coordinator Membuka Jastip

Coordinator membuat transaksi jastip baru dengan status `OPEN`.

---

## 2. Member Melakukan Pesanan

Member memilih menu dan melakukan pemesanan. Pesanan tersimpan pada:

jastip_orders (header transaksi)
jastip_order_details (rincian item per anggota)

---

## 3. System Menghitung Profit

System menghitung:

- subtotal
- total transaksi
- total profit
- pembagian hasil koperasi
- pembagian hasil coordinator

---

## 4. Payment Process

Mock Payment Gateway. Modul pembayaran dirancang menyerupai payment gateway nyata (Midtrans/Xendit/Stripe) namun seluruh trigger transisi pembayaran disimulasikan, tanpa integrasi pihak ketiga.

---

## 5. Vendor Processing

System mengelompokkan pesanan berdasarkan vendor dan mengirimkannya melalui WhatsApp API.

### Recommended:

- Fonnte WhatsApp API

---

## 6. Order Tracking

Member dapat melihat status pesanan secara realtime.

---

# 📊 Dashboard Features

## Dashboard Summary

- Total transaksi
- Total profit
- Total order
- Vendor aktif
- Member aktif
- Pembayaran tunai menunggu konfirmasi (badge khusus koordinator)

---

## Analytics

- Profit per hari
- Order per minggu
- Vendor terlaris
- Status transaksi
- Rasio metode pembayaran (daring vs tunai)

---

# 📄 Reporting Features

## Available Reports

- Jastip Report
- Vendor Report
- Member Report
- Payment Report (rekap pembayaran per metode, per state, per koordinator yang konfirmasi)

---

## Report Filters

Date range
Vendor
Status pesanan
State pembayaran
Metode pembayaran
Coordinator

---

## Export

- CSV
- PDF

---

# 🚀 Development Roadmap

## Phase 1 — Master Data

- Vendors CRUD
- Menus CRUD

---

## Phase 2 — Transaction

- Create Jastip Order
- Order Detail
- My Orders
- Status Order

---

## Phase 3 — Payment

- Mock Payments

---

## Phase 4 — Vendor Processing

- Generate Vendor Orders
- WhatsApp API Integration

---

## Phase 5 — Dashboard & Reports

- Dashboard
- Charts
- CSV Export
- PDF Export
