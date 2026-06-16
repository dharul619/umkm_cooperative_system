-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 16 Jun 2026 pada 16.19
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cooperative_system_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `activity` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `departments`
--

INSERT INTO `departments` (`id`, `name`, `division_id`) VALUES
(1, 'Expeditor', 1),
(3, 'Chasier', 1),
(4, 'Technician', 1),
(5, 'Prevention Associate', 1),
(6, 'Visual Merchandising', 1),
(7, 'Young Fashion', 2),
(8, 'Ladies Contemp', 2),
(9, 'Intimate', 2),
(10, 'Men Shoes', 3),
(13, 'Travel', 4),
(14, 'Percobaan', 7);

-- --------------------------------------------------------

--
-- Struktur dari tabel `divisions`
--

CREATE TABLE `divisions` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `divisions`
--

INSERT INTO `divisions` (`id`, `name`) VALUES
(1, 'Supporting Unit'),
(2, 'Divisi 1 Ladies Intimate'),
(3, 'Divisi 2 Footwear & Handbags'),
(4, 'Divisi 3 Mens & Home'),
(5, 'Divisi 4 Children & Toys'),
(7, 'Divisi 5 Percobaan');

-- --------------------------------------------------------

--
-- Struktur dari tabel `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `type` enum('IN','OUT') DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` enum('PURCHASE','SALE','ADJUSTMENT') DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `jastip_orders`
--

CREATE TABLE `jastip_orders` (
  `id` int(11) NOT NULL,
  `order_date` date DEFAULT NULL,
  `coordinator_id` int(11) DEFAULT NULL,
  `total_amount` int(11) DEFAULT 0,
  `total_profit` int(11) DEFAULT 0,
  `coordinator_share` int(11) DEFAULT 0,
  `koperasi_share` int(11) DEFAULT 0,
  `payment_status` enum('UNPAID','PARTIAL','PAID') DEFAULT 'UNPAID',
  `status` enum('OPEN','CONFIRMED','ORDERED','DELIVERED','DONE','CANCELLED') DEFAULT 'OPEN',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `jastip_orders`
--

INSERT INTO `jastip_orders` (`id`, `order_date`, `coordinator_id`, `total_amount`, `total_profit`, `coordinator_share`, `koperasi_share`, `payment_status`, `status`, `created_at`) VALUES
(16, '2026-06-15', 3, 131000, 2000, 1000, 1000, 'UNPAID', 'OPEN', '2026-06-14 15:34:58');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jastip_order_details`
--

CREATE TABLE `jastip_order_details` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `subtotal` int(11) DEFAULT NULL,
  `profit` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `jastip_order_details`
--

INSERT INTO `jastip_order_details` (`id`, `order_id`, `user_id`, `menu_id`, `qty`, `price`, `subtotal`, `profit`, `created_at`) VALUES
(55, 16, 19, 5, 1, 20000, 20000, 1000, '2026-06-15 14:36:09'),
(56, 16, 19, 8, 1, 17000, 17000, 1000, '2026-06-15 14:36:09'),
(59, 16, 9, 5, 1, 20000, 20000, 1000, '2026-06-15 15:14:35'),
(60, 16, 9, 8, 2, 17000, 34000, 1000, '2026-06-15 15:14:35'),
(61, 16, 18, 5, 2, 20000, 40000, 2000, '2026-06-15 15:41:56');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jastip_session_menus`
--

CREATE TABLE `jastip_session_menus` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `jastip_session_menus`
--

INSERT INTO `jastip_session_menus` (`id`, `session_id`, `menu_id`, `notes`, `created_at`, `updated_at`) VALUES
(12, 16, 5, NULL, '2026-06-14 15:34:58', '2026-06-14 15:34:58'),
(13, 16, 8, NULL, '2026-06-14 15:34:58', '2026-06-14 15:34:58');

-- --------------------------------------------------------

--
-- Struktur dari tabel `menus`
--

CREATE TABLE `menus` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `base_price` int(11) DEFAULT NULL,
  `jastip_price` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `menus`
--

INSERT INTO `menus` (`id`, `vendor_id`, `name`, `base_price`, `jastip_price`, `is_active`, `created_at`) VALUES
(2, 1, 'Burung Puyuh + Nasi', 20000, 22000, 1, '2026-06-05 07:53:25'),
(4, 1, 'Mie Ayam', 10000, 12000, 1, '2026-06-05 08:14:02'),
(5, 1, 'Pecel Lele + Nasi', 18000, 20000, 1, '2026-06-05 13:13:19'),
(6, 1, 'Tahu Tempe', 5000, 6000, 1, '2026-06-05 13:14:22'),
(7, 3, 'Ayam Bakar + Nasi', 20000, 22000, 1, '2026-06-05 13:17:56'),
(8, 2, 'Ayam Goreng + Nasi', 15000, 17000, 1, '2026-06-05 13:19:23');

-- --------------------------------------------------------

--
-- Struktur dari tabel `payments`
--

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `order_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'IDR',
  `payment_method` enum('CASH','QRIS','VA_BCA','GOPAY','DANA') DEFAULT NULL,
  `state` enum('PENDING','PROCESSING','SETTLED','FAILED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `external_reference` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `webhook_delivered` tinyint(1) NOT NULL DEFAULT 0,
  `webhook_attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `member_id`, `amount`, `currency`, `payment_method`, `state`, `external_reference`, `expires_at`, `paid_at`, `webhook_delivered`, `webhook_attempts`, `created_at`, `updated_at`) VALUES
('0f205d5a-5cc8-4f5c-ad09-43e6c66882a2', 16, 19, 39000.00, 'IDR', 'QRIS', 'SETTLED', 'JASTIP-16-19-1781534187727', '2026-06-15 21:51:27', '2026-06-15 21:36:46', 1, 1, '2026-06-15 14:36:27', '2026-06-15 14:36:46'),
('3415797b-7bc1-43c8-b298-65a29a85bb23', 16, 18, 42000.00, 'IDR', 'QRIS', 'SETTLED', 'JASTIP-16-18-1781538122429', '2026-06-15 22:57:02', '2026-06-15 22:42:15', 1, 1, '2026-06-15 15:42:02', '2026-06-15 15:42:15'),
('ae891418-cc4b-457a-8f6a-2d8ef693948a', 16, 9, 56000.00, 'IDR', 'QRIS', 'SETTLED', 'JASTIP-16-9-1781536485077', '2026-06-15 22:29:45', '2026-06-15 22:14:48', 1, 1, '2026-06-15 15:14:45', '2026-06-15 15:14:48');

-- --------------------------------------------------------

--
-- Struktur dari tabel `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `subcategory_id` int(11) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs',
  `brand_id` int(11) DEFAULT NULL,
  `cost_price` int(11) DEFAULT NULL,
  `selling_price` int(11) DEFAULT NULL,
  `min_stock` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `total_amount` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `purchase_details`
--

CREATE TABLE `purchase_details` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `subtotal` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `roles`
--

INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'System Administrator'),
(2, 'Jastip Coordinator'),
(3, 'Business Coordinator'),
(4, 'Cooperative Member');

-- --------------------------------------------------------

--
-- Struktur dari tabel `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `sale_date` date DEFAULT NULL,
  `operator_id` int(11) DEFAULT NULL,
  `total_amount` int(11) DEFAULT NULL,
  `total_profit` int(11) DEFAULT NULL,
  `coordinator_share` int(11) DEFAULT NULL,
  `koperasi_share` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `sales_details`
--

CREATE TABLE `sales_details` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `cost_price` int(11) DEFAULT NULL,
  `subtotal` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `sales_predictions`
--

CREATE TABLE `sales_predictions` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `predicted_demand` int(11) DEFAULT NULL,
  `actual_demand` int(11) DEFAULT NULL,
  `prediction_date` date DEFAULT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `subcategories`
--

CREATE TABLE `subcategories` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `phone_number`, `username`, `password`, `role_id`, `division_id`, `department_id`, `created_at`, `status`, `updated_at`) VALUES
(1, 'Dharul', '082112249833', 'dharul123', '$2b$10$7hztuEIX7jj16L/r81ELU.APVaM9UbfH6//cYfgcov4/2U6P7/Qem', 1, 1, 1, '2026-06-04 15:54:29', 'approved', NULL),
(2, 'Via', '082112249832', 'Via123', '$2b$10$Kar25vcJkGatAiAOK56Jo.QPLOdP5H4NcJkQPjV9FVjavWZMqb3vy', 1, 1, 3, '2026-06-04 15:57:34', 'approved', NULL),
(3, 'Alvin', '082112249831', 'alvin123', '$2b$10$mtbRmIY.7ctDqGQr6joz5eU9CiGk.NGbKGR24ebiTQbV1jtwuhi5W', 2, 1, 1, '2026-06-04 15:57:43', 'approved', NULL),
(8, 'Jumali', '082112249829', 'jumali123', '$2b$10$GP3kvOiEK2yvGlU2AilwTuv3vSvWpKpeCvlr9OHTFgQfZTt3VpE8W', 2, 3, 10, '2026-06-04 15:57:54', 'approved', NULL),
(9, 'Syahri Ramadhan', '082112249828', 'syahri123', '$2b$10$6QQg7rly.MxDjKGNWU9FL.RaTlvKCoZN1LJ5icYH0L7/5tTKEwyWO', 4, 3, 10, '2026-06-14 12:43:16', 'approved', NULL),
(10, 'istim', '082112249827', 'istim123', '$2b$10$VAAKoXN5i4MRdX4nkMzESeTA.1eM2uvKk7vYDmkX3f.XMSrUDmsLy', 4, 3, 10, '2026-06-15 13:13:19', 'approved', NULL),
(11, 'Nura Shabilla', '082112249826', 'billa123', '$2b$10$ZZqaym45ShxYs9n4DgHAJ.9GbiMtNlEDlLM9qjeQQm6gFvrTdnNCm', 4, 1, 3, '2026-06-04 15:58:26', 'approved', NULL),
(12, 'Yunita', '082112249825', 'yunita123', '$2b$10$R0rAu9iFuW76CQbpk7K7JO4GIP5MVGT8JjevjL6xUhwu85p2FTPfq', 4, 2, 7, '2026-06-15 13:48:10', 'approved', NULL),
(13, 'Umar Wira', '082112249824', 'umar123', '$2b$10$OpEuEAcGljcVArtDNp6Nd.yAYwu94igEyqcegvC2OGG.8tsw18GBC', 4, 1, 5, '2026-06-04 15:58:51', 'approved', NULL),
(14, 'umar', '082112249823', 'umar_wira123', '$2b$10$ng/9QQ7cagMfn22m5pkqSeCbr.Ywy15HECHX0qy0ksvnq/5.pLViW', 4, 1, 5, '2026-06-04 15:59:00', 'pending', NULL),
(15, 'nama lengkap', '082112249821', 'nama123', '$2b$10$u0B444JFsNJmadwi8o8cn.r0oSr.x5yrm6TMo0ihsDc.HGOGuZGEa', 4, 3, 10, '2026-06-04 15:59:12', 'approved', NULL),
(16, 'Rudi', '08212345678', 'Rudi123', '$2b$10$9LBEms9ZbrEbrz6QZ7B4/uyOdLGoIZ5yZnZNs8AfkAk/6W5gtzytq', 4, 4, 13, '2026-06-04 16:01:38', 'approved', NULL),
(17, 'Sri Wahyuni', '087456821765', 'yuni123', '$2b$10$Ft17zS/Z59nJYWh0buNZpOtqEsTt7UIUoEUz/80ZGhlnnqOT5tLVG', 3, 2, 7, '2026-06-14 11:50:46', 'approved', NULL),
(18, 'Sintia Nadila', '087456123987', 'sintia123', '$2b$10$1xJy7zXdbpA6FVyxKScX4uHyGY9X1vrQI/BJVEDzIEUsYjf5zs006', 4, 3, 10, '2026-06-15 14:21:04', 'approved', NULL),
(19, 'Rizki Hidayat', '082123456789', 'rizki123', '$2b$10$6yjfqho7EtsyI6Gx9Ck4nehwwXwxwNrbb5ngwQK8ST2d51HWDgSmC', 4, 1, 3, '2026-06-15 14:30:40', 'approved', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `phone`, `address`) VALUES
(1, 'Warung Makan Cak Ali', '085156155334', 'Jalan HOS Cokroaminoto No.93, RT.001/RW.001, Karang Tengah, Kecamatan Karang Tengah, Kota Tangerang, Banten'),
(2, 'Warung Makan GM', '082112249011', 'Jalan hos cokroaminoto'),
(3, 'Warung Makan Pakdhe', '082145678945', 'Jalan Kreo Ciledug');

-- --------------------------------------------------------

--
-- Struktur dari tabel `vendor_orders`
--

CREATE TABLE `vendor_orders` (
  `id` int(11) NOT NULL,
  `jastip_order_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `order_summary` text DEFAULT NULL,
  `whatsapp_status` enum('PENDING','SENT','FAILED') DEFAULT 'PENDING',
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `division_id` (`division_id`);

--
-- Indeks untuk tabel `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indeks untuk tabel `jastip_orders`
--
ALTER TABLE `jastip_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coordinator_id` (`coordinator_id`);

--
-- Indeks untuk tabel `jastip_order_details`
--
ALTER TABLE `jastip_order_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `menu_id` (`menu_id`);

--
-- Indeks untuk tabel `jastip_session_menus`
--
ALTER TABLE `jastip_session_menus`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_session_menu` (`session_id`,`menu_id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_menu_id` (`menu_id`);

--
-- Indeks untuk tabel `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indeks untuk tabel `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payment_order` (`order_id`),
  ADD KEY `fk_payment_member` (`member_id`);

--
-- Indeks untuk tabel `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `brand_id` (`brand_id`),
  ADD KEY `idx_products_subcategory` (`subcategory_id`);

--
-- Indeks untuk tabel `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchases_supplier` (`supplier_id`);

--
-- Indeks untuk tabel `purchase_details`
--
ALTER TABLE `purchase_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indeks untuk tabel `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `operator_id` (`operator_id`);

--
-- Indeks untuk tabel `sales_details`
--
ALTER TABLE `sales_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indeks untuk tabel `sales_predictions`
--
ALTER TABLE `sales_predictions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indeks untuk tabel `subcategories`
--
ALTER TABLE `subcategories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indeks untuk tabel `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `division_id` (`division_id`),
  ADD KEY `departments_id` (`department_id`);

--
-- Indeks untuk tabel `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `vendor_orders`
--
ALTER TABLE `vendor_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jastip_order_id` (`jastip_order_id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `divisions`
--
ALTER TABLE `divisions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `jastip_orders`
--
ALTER TABLE `jastip_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT untuk tabel `jastip_order_details`
--
ALTER TABLE `jastip_order_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT untuk tabel `jastip_session_menus`
--
ALTER TABLE `jastip_session_menus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT untuk tabel `menus`
--
ALTER TABLE `menus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `purchase_details`
--
ALTER TABLE `purchase_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `sales_details`
--
ALTER TABLE `sales_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `sales_predictions`
--
ALTER TABLE `sales_predictions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `subcategories`
--
ALTER TABLE `subcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT untuk tabel `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `vendor_orders`
--
ALTER TABLE `vendor_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`);

--
-- Ketidakleluasaan untuk tabel `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Ketidakleluasaan untuk tabel `jastip_orders`
--
ALTER TABLE `jastip_orders`
  ADD CONSTRAINT `jastip_orders_ibfk_1` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `jastip_order_details`
--
ALTER TABLE `jastip_order_details`
  ADD CONSTRAINT `jastip_order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `jastip_orders` (`id`),
  ADD CONSTRAINT `jastip_order_details_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `jastip_order_details_ibfk_3` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`);

--
-- Ketidakleluasaan untuk tabel `jastip_session_menus`
--
ALTER TABLE `jastip_session_menus`
  ADD CONSTRAINT `fk_session_menus_menu` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_session_menus_session` FOREIGN KEY (`session_id`) REFERENCES `jastip_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `menus`
--
ALTER TABLE `menus`
  ADD CONSTRAINT `menus_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`);

--
-- Ketidakleluasaan untuk tabel `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_member` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `jastip_orders` (`id`);

--
-- Ketidakleluasaan untuk tabel `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  ADD CONSTRAINT `products_subcat_fk` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`);

--
-- Ketidakleluasaan untuk tabel `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Ketidakleluasaan untuk tabel `purchase_details`
--
ALTER TABLE `purchase_details`
  ADD CONSTRAINT `purchase_details_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  ADD CONSTRAINT `purchase_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Ketidakleluasaan untuk tabel `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `sales_details`
--
ALTER TABLE `sales_details`
  ADD CONSTRAINT `sales_details_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  ADD CONSTRAINT `sales_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Ketidakleluasaan untuk tabel `sales_predictions`
--
ALTER TABLE `sales_predictions`
  ADD CONSTRAINT `sales_predictions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Ketidakleluasaan untuk tabel `subcategories`
--
ALTER TABLE `subcategories`
  ADD CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Ketidakleluasaan untuk tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`),
  ADD CONSTRAINT `users_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Ketidakleluasaan untuk tabel `vendor_orders`
--
ALTER TABLE `vendor_orders`
  ADD CONSTRAINT `vendor_orders_ibfk_1` FOREIGN KEY (`jastip_order_id`) REFERENCES `jastip_orders` (`id`),
  ADD CONSTRAINT `vendor_orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
