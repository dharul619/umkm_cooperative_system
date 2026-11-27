-- ============================================================================
-- SIKOMU Retail POS Professional Upgrade Migration
-- Compatible with MySQL 8 / MariaDB 10.4+
-- ============================================================================

-- 1. POS Shifts (Buka / Tutup Kasir Blind Close & Z-Report)
CREATE TABLE IF NOT EXISTS `pos_shifts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shift_code` varchar(32) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `opened_at` datetime NOT NULL,
  `closed_at` datetime DEFAULT NULL,
  `opening_cash` int(11) NOT NULL DEFAULT 0,
  `expected_cash` int(11) DEFAULT NULL,
  `actual_cash` int(11) DEFAULT NULL,
  `denominations_json` text DEFAULT NULL,
  `cash_difference` int(11) DEFAULT NULL,
  `actual_qris` int(11) DEFAULT NULL,
  `actual_transfer` int(11) DEFAULT NULL,
  `qris_difference` int(11) DEFAULT NULL,
  `transfer_difference` int(11) DEFAULT NULL,
  `total_sales_count` int(11) NOT NULL DEFAULT 0,
  `total_cash_sales` int(11) NOT NULL DEFAULT 0,
  `total_qris_sales` int(11) NOT NULL DEFAULT 0,
  `total_transfer_sales` int(11) NOT NULL DEFAULT 0,
  `total_refund_cash` int(11) NOT NULL DEFAULT 0,
  `total_refund_non_cash` int(11) NOT NULL DEFAULT 0,
  `status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  `audit_status` enum('PENDING','VERIFIED') NOT NULL DEFAULT 'PENDING',
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `audit_notes` varchar(500) DEFAULT NULL,
  `day_closing_id` int(11) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pos_shifts_code` (`shift_code`),
  KEY `idx_pos_shifts_operator_status` (`operator_id`, `status`),
  CONSTRAINT `fk_pos_shifts_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `pos_cash_movements`;

-- 2. Alter Existing `sales` Table
ALTER TABLE `sales`
  MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  ADD COLUMN `invoice_number` varchar(32) DEFAULT NULL AFTER `id`,
  ADD COLUMN `shift_id` int(11) DEFAULT NULL AFTER `operator_id`,
  ADD COLUMN `member_id` int(11) DEFAULT NULL AFTER `shift_id`,
  ADD COLUMN `status` enum('COMPLETED','PARTIAL_RETURN','RETURNED','VOIDED') NOT NULL DEFAULT 'COMPLETED' AFTER `member_id`,
  ADD COLUMN `subtotal_amount` int(11) NOT NULL DEFAULT 0 AFTER `status`,
  ADD COLUMN `item_discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `subtotal_amount`,
  ADD COLUMN `order_discount_type` enum('NONE','AMOUNT','PERCENT') NOT NULL DEFAULT 'NONE' AFTER `item_discount_amount`,
  ADD COLUMN `order_discount_value` int(11) NOT NULL DEFAULT 0 AFTER `order_discount_type`,
  ADD COLUMN `order_discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `order_discount_value`,
  ADD COLUMN `discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `order_discount_amount`,
  ADD COLUMN `tax_amount` int(11) NOT NULL DEFAULT 0 AFTER `discount_amount`,
  ADD COLUMN `payment_method` enum('CASH','QRIS','TRANSFER','MIXED') NOT NULL DEFAULT 'CASH' AFTER `koperasi_share`,
  ADD COLUMN `paid_amount` int(11) NOT NULL DEFAULT 0 AFTER `payment_method`,
  ADD COLUMN `change_amount` int(11) NOT NULL DEFAULT 0 AFTER `paid_amount`,
  ADD COLUMN `returned_amount` int(11) NOT NULL DEFAULT 0 AFTER `change_amount`,
  ADD COLUMN `returned_profit` int(11) NOT NULL DEFAULT 0 AFTER `returned_amount`,
  ADD COLUMN `notes` varchar(255) DEFAULT NULL AFTER `returned_profit`,
  ADD COLUMN `voided_by` int(11) DEFAULT NULL AFTER `notes`,
  ADD COLUMN `void_approved_by` int(11) DEFAULT NULL AFTER `voided_by`,
  ADD COLUMN `voided_at` datetime DEFAULT NULL AFTER `void_approved_by`,
  ADD COLUMN `void_reason` varchar(255) DEFAULT NULL AFTER `voided_at`,
  ADD COLUMN `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`,
  ADD UNIQUE KEY `uniq_sales_invoice_number` (`invoice_number`),
  ADD KEY `idx_sales_status` (`status`),
  ADD KEY `idx_sales_shift_id` (`shift_id`),
  ADD KEY `idx_sales_member_id` (`member_id`);

UPDATE `sales`
SET
  `invoice_number` = CONCAT('POS-', DATE_FORMAT(COALESCE(`sale_date`, CURDATE()), '%Y%m%d'), '-', LPAD(`id`, 6, '0')),
  `subtotal_amount` = CASE WHEN `subtotal_amount` = 0 THEN COALESCE(`total_amount`, 0) ELSE `subtotal_amount` END,
  `paid_amount` = CASE WHEN `paid_amount` = 0 THEN COALESCE(`total_amount`, 0) ELSE `paid_amount` END
WHERE `invoice_number` IS NULL;

-- 4. Alter Existing `sales_details` Table
ALTER TABLE `sales_details`
  ADD COLUMN `product_name` varchar(150) DEFAULT NULL AFTER `product_id`,
  ADD COLUMN `discount_type` enum('NONE','AMOUNT','PERCENT') NOT NULL DEFAULT 'NONE' AFTER `cost_price`,
  ADD COLUMN `discount_value` int(11) NOT NULL DEFAULT 0 AFTER `discount_type`,
  ADD COLUMN `discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `discount_value`,
  ADD COLUMN `returned_qty` int(11) NOT NULL DEFAULT 0 AFTER `subtotal`;

UPDATE `sales_details` sd
JOIN `products` p ON p.id = sd.product_id
SET sd.product_name = p.name
WHERE sd.product_name IS NULL;

-- 5. Pembayaran Penjualan Ritel (mendukung Single & Split Payment)
CREATE TABLE IF NOT EXISTS `sale_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `payment_method` enum('CASH','QRIS','TRANSFER') NOT NULL,
  `amount` int(11) NOT NULL,
  `received_amount` int(11) NOT NULL,
  `change_amount` int(11) NOT NULL DEFAULT 0,
  `reference_no` varchar(100) DEFAULT NULL,
  `status` enum('SETTLED','VOIDED','REFUNDED') NOT NULL DEFAULT 'SETTLED',
  `paid_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sale_payments_sale` (`sale_id`),
  KEY `idx_sale_payments_method` (`payment_method`),
  CONSTRAINT `fk_sale_payments_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Retur Penjualan (Header & Detail)
CREATE TABLE IF NOT EXISTS `sale_returns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `return_number` varchar(32) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `shift_id` int(11) DEFAULT NULL,
  `operator_id` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `return_date` date NOT NULL,
  `total_refund` int(11) NOT NULL DEFAULT 0,
  `total_profit_reversal` int(11) NOT NULL DEFAULT 0,
  `refund_method` enum('CASH','QRIS','TRANSFER') NOT NULL DEFAULT 'CASH',
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sale_returns_number` (`return_number`),
  KEY `idx_sale_returns_sale` (`sale_id`),
  KEY `idx_sale_returns_shift` (`shift_id`),
  CONSTRAINT `fk_sale_returns_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  CONSTRAINT `fk_sale_returns_shift` FOREIGN KEY (`shift_id`) REFERENCES `pos_shifts` (`id`),
  CONSTRAINT `fk_sale_returns_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `sale_return_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_return_id` int(11) NOT NULL,
  `sale_detail_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` int(11) NOT NULL,
  `cost_price` int(11) NOT NULL,
  `subtotal` int(11) NOT NULL,
  `restock` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_sale_return_details_return` (`sale_return_id`),
  KEY `idx_sale_return_details_detail` (`sale_detail_id`),
  CONSTRAINT `fk_sale_return_details_return` FOREIGN KEY (`sale_return_id`) REFERENCES `sale_returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sale_return_details_detail` FOREIGN KEY (`sale_detail_id`) REFERENCES `sales_details` (`id`),
  CONSTRAINT `fk_sale_return_details_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Hold / Parkir Keranjang POS
CREATE TABLE IF NOT EXISTS `pos_held_carts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shift_id` int(11) DEFAULT NULL,
  `operator_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `items_json` longtext NOT NULL,
  `discount_json` text DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pos_held_carts_operator` (`operator_id`),
  KEY `idx_pos_held_carts_shift` (`shift_id`),
  CONSTRAINT `fk_pos_held_carts_shift` FOREIGN KEY (`shift_id`) REFERENCES `pos_shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_held_carts_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_pos_held_carts_member` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Tutup Hari / Day Close (End of Day)
CREATE TABLE IF NOT EXISTS `pos_day_closings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `closing_code` varchar(32) NOT NULL,
  `business_date` date NOT NULL,
  `closed_by` int(11) NOT NULL,
  `closed_at` datetime NOT NULL,
  `total_shifts` int(11) NOT NULL DEFAULT 0,
  `total_sales_count` int(11) NOT NULL DEFAULT 0,
  `voided_sales_count` int(11) NOT NULL DEFAULT 0,
  `return_count` int(11) NOT NULL DEFAULT 0,
  `gross_sales_amount` int(11) NOT NULL DEFAULT 0,
  `total_discount_amount` int(11) NOT NULL DEFAULT 0,
  `total_refund_cash` int(11) NOT NULL DEFAULT 0,
  `total_refund_non_cash` int(11) NOT NULL DEFAULT 0,
  `net_sales_amount` int(11) NOT NULL DEFAULT 0,
  `total_opening_cash` int(11) NOT NULL DEFAULT 0,
  `total_cash_sales` int(11) NOT NULL DEFAULT 0,
  `expected_cash_total` int(11) NOT NULL DEFAULT 0,
  `actual_cash_total` int(11) NOT NULL DEFAULT 0,
  `cash_difference` int(11) NOT NULL DEFAULT 0,
  `expected_qris_total` int(11) NOT NULL DEFAULT 0,
  `actual_qris_total` int(11) NOT NULL DEFAULT 0,
  `qris_difference` int(11) NOT NULL DEFAULT 0,
  `expected_transfer_total` int(11) NOT NULL DEFAULT 0,
  `actual_transfer_total` int(11) NOT NULL DEFAULT 0,
  `transfer_difference` int(11) NOT NULL DEFAULT 0,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pos_day_closings_code` (`closing_code`),
  UNIQUE KEY `uniq_pos_day_closings_date` (`business_date`),
  KEY `idx_pos_day_closings_closed_by` (`closed_by`),
  CONSTRAINT `fk_pos_day_closings_admin` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. Perluas Enum reference_type pada inventory_transactions
ALTER TABLE `inventory_transactions`
  MODIFY COLUMN `reference_type` enum('BEGINNING','PURCHASE','SALE','SALE_VOID','SALE_RETURN','ADJUSTMENT') DEFAULT NULL;
