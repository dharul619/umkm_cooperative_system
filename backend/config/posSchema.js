const NEW_TABLES_DDL = [
  `CREATE TABLE IF NOT EXISTS \`pos_shifts\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`shift_code\` varchar(32) NOT NULL,
    \`operator_id\` int(11) NOT NULL,
    \`opened_at\` datetime NOT NULL,
    \`closed_at\` datetime DEFAULT NULL,
    \`opening_cash\` int(11) NOT NULL DEFAULT 0,
    \`expected_cash\` int(11) DEFAULT NULL,
    \`actual_cash\` int(11) DEFAULT NULL,
    \`denominations_json\` text DEFAULT NULL,
    \`cash_difference\` int(11) DEFAULT NULL,
    \`actual_qris\` int(11) DEFAULT NULL,
    \`actual_transfer\` int(11) DEFAULT NULL,
    \`qris_difference\` int(11) DEFAULT NULL,
    \`transfer_difference\` int(11) DEFAULT NULL,
    \`total_sales_count\` int(11) NOT NULL DEFAULT 0,
    \`total_cash_sales\` int(11) NOT NULL DEFAULT 0,
    \`total_qris_sales\` int(11) NOT NULL DEFAULT 0,
    \`total_transfer_sales\` int(11) NOT NULL DEFAULT 0,
    \`total_refund_cash\` int(11) NOT NULL DEFAULT 0,
    \`total_refund_non_cash\` int(11) NOT NULL DEFAULT 0,
    \`status\` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
    \`audit_status\` enum('PENDING','VERIFIED') NOT NULL DEFAULT 'PENDING',
    \`verified_by\` int(11) DEFAULT NULL,
    \`verified_at\` datetime DEFAULT NULL,
    \`audit_notes\` varchar(500) DEFAULT NULL,
    \`day_closing_id\` int(11) DEFAULT NULL,
    \`notes\` varchar(255) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uniq_pos_shifts_code\` (\`shift_code\`),
    KEY \`idx_pos_shifts_operator_status\` (\`operator_id\`, \`status\`),
    CONSTRAINT \`fk_pos_shifts_operator\` FOREIGN KEY (\`operator_id\`) REFERENCES \`users\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS \`sale_payments\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`sale_id\` int(11) NOT NULL,
    \`payment_method\` enum('CASH','QRIS','TRANSFER') NOT NULL,
    \`amount\` int(11) NOT NULL,
    \`received_amount\` int(11) NOT NULL,
    \`change_amount\` int(11) NOT NULL DEFAULT 0,
    \`reference_no\` varchar(100) DEFAULT NULL,
    \`status\` enum('SETTLED','VOIDED','REFUNDED') NOT NULL DEFAULT 'SETTLED',
    \`paid_at\` datetime NOT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_sale_payments_sale\` (\`sale_id\`),
    KEY \`idx_sale_payments_method\` (\`payment_method\`),
    CONSTRAINT \`fk_sale_payments_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS \`sale_returns\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`return_number\` varchar(32) NOT NULL,
    \`sale_id\` int(11) NOT NULL,
    \`shift_id\` int(11) DEFAULT NULL,
    \`operator_id\` int(11) NOT NULL,
    \`approved_by\` int(11) DEFAULT NULL,
    \`return_date\` date NOT NULL,
    \`total_refund\` int(11) NOT NULL DEFAULT 0,
    \`total_profit_reversal\` int(11) NOT NULL DEFAULT 0,
    \`refund_method\` enum('CASH','QRIS','TRANSFER') NOT NULL DEFAULT 'CASH',
    \`reason\` varchar(255) NOT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uniq_sale_returns_number\` (\`return_number\`),
    KEY \`idx_sale_returns_sale\` (\`sale_id\`),
    KEY \`idx_sale_returns_shift\` (\`shift_id\`),
    CONSTRAINT \`fk_sale_returns_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`),
    CONSTRAINT \`fk_sale_returns_shift\` FOREIGN KEY (\`shift_id\`) REFERENCES \`pos_shifts\` (\`id\`),
    CONSTRAINT \`fk_sale_returns_operator\` FOREIGN KEY (\`operator_id\`) REFERENCES \`users\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS \`sale_return_details\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`sale_return_id\` int(11) NOT NULL,
    \`sale_detail_id\` int(11) NOT NULL,
    \`product_id\` int(11) NOT NULL,
    \`qty\` int(11) NOT NULL,
    \`unit_price\` int(11) NOT NULL,
    \`cost_price\` int(11) NOT NULL,
    \`subtotal\` int(11) NOT NULL,
    \`restock\` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (\`id\`),
    KEY \`idx_sale_return_details_return\` (\`sale_return_id\`),
    KEY \`idx_sale_return_details_detail\` (\`sale_detail_id\`),
    CONSTRAINT \`fk_sale_return_details_return\` FOREIGN KEY (\`sale_return_id\`) REFERENCES \`sale_returns\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_sale_return_details_detail\` FOREIGN KEY (\`sale_detail_id\`) REFERENCES \`sales_details\` (\`id\`),
    CONSTRAINT \`fk_sale_return_details_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS \`pos_held_carts\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`shift_id\` int(11) DEFAULT NULL,
    \`operator_id\` int(11) NOT NULL,
    \`label\` varchar(100) NOT NULL,
    \`member_id\` int(11) DEFAULT NULL,
    \`items_json\` longtext NOT NULL,
    \`discount_json\` text DEFAULT NULL,
    \`notes\` varchar(255) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_pos_held_carts_operator\` (\`operator_id\`),
    KEY \`idx_pos_held_carts_shift\` (\`shift_id\`),
    CONSTRAINT \`fk_pos_held_carts_shift\` FOREIGN KEY (\`shift_id\`) REFERENCES \`pos_shifts\` (\`id\`) ON DELETE SET NULL,
    CONSTRAINT \`fk_pos_held_carts_operator\` FOREIGN KEY (\`operator_id\`) REFERENCES \`users\` (\`id\`),
    CONSTRAINT \`fk_pos_held_carts_member\` FOREIGN KEY (\`member_id\`) REFERENCES \`users\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS \`pos_day_closings\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`closing_code\` varchar(32) NOT NULL,
    \`business_date\` date NOT NULL,
    \`closed_by\` int(11) NOT NULL,
    \`closed_at\` datetime NOT NULL,
    \`total_shifts\` int(11) NOT NULL DEFAULT 0,
    \`total_sales_count\` int(11) NOT NULL DEFAULT 0,
    \`voided_sales_count\` int(11) NOT NULL DEFAULT 0,
    \`return_count\` int(11) NOT NULL DEFAULT 0,
    \`gross_sales_amount\` int(11) NOT NULL DEFAULT 0,
    \`total_discount_amount\` int(11) NOT NULL DEFAULT 0,
    \`total_refund_cash\` int(11) NOT NULL DEFAULT 0,
    \`total_refund_non_cash\` int(11) NOT NULL DEFAULT 0,
    \`net_sales_amount\` int(11) NOT NULL DEFAULT 0,
    \`total_opening_cash\` int(11) NOT NULL DEFAULT 0,
    \`total_cash_sales\` int(11) NOT NULL DEFAULT 0,
    \`expected_cash_total\` int(11) NOT NULL DEFAULT 0,
    \`actual_cash_total\` int(11) NOT NULL DEFAULT 0,
    \`cash_difference\` int(11) NOT NULL DEFAULT 0,
    \`expected_qris_total\` int(11) NOT NULL DEFAULT 0,
    \`actual_qris_total\` int(11) NOT NULL DEFAULT 0,
    \`qris_difference\` int(11) NOT NULL DEFAULT 0,
    \`expected_transfer_total\` int(11) NOT NULL DEFAULT 0,
    \`actual_transfer_total\` int(11) NOT NULL DEFAULT 0,
    \`transfer_difference\` int(11) NOT NULL DEFAULT 0,
    \`notes\` varchar(500) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uniq_pos_day_closings_code\` (\`closing_code\`),
    UNIQUE KEY \`uniq_pos_day_closings_date\` (\`business_date\`),
    KEY \`idx_pos_day_closings_closed_by\` (\`closed_by\`),
    CONSTRAINT \`fk_pos_day_closings_admin\` FOREIGN KEY (\`closed_by\`) REFERENCES \`users\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
];

const SALES_COLUMNS = [
  { name: "invoice_number", sql: "ADD COLUMN `invoice_number` varchar(32) DEFAULT NULL AFTER `id`" },
  { name: "shift_id", sql: "ADD COLUMN `shift_id` int(11) DEFAULT NULL AFTER `operator_id`" },
  { name: "member_id", sql: "ADD COLUMN `member_id` int(11) DEFAULT NULL AFTER `shift_id`" },
  { name: "status", sql: "ADD COLUMN `status` enum('COMPLETED','PARTIAL_RETURN','RETURNED','VOIDED') NOT NULL DEFAULT 'COMPLETED' AFTER `member_id`" },
  { name: "subtotal_amount", sql: "ADD COLUMN `subtotal_amount` int(11) NOT NULL DEFAULT 0 AFTER `status`" },
  { name: "item_discount_amount", sql: "ADD COLUMN `item_discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `subtotal_amount`" },
  { name: "order_discount_type", sql: "ADD COLUMN `order_discount_type` enum('NONE','AMOUNT','PERCENT') NOT NULL DEFAULT 'NONE' AFTER `item_discount_amount`" },
  { name: "order_discount_value", sql: "ADD COLUMN `order_discount_value` int(11) NOT NULL DEFAULT 0 AFTER `order_discount_type`" },
  { name: "order_discount_amount", sql: "ADD COLUMN `order_discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `order_discount_value`" },
  { name: "discount_amount", sql: "ADD COLUMN `discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `order_discount_amount`" },
  { name: "tax_amount", sql: "ADD COLUMN `tax_amount` int(11) NOT NULL DEFAULT 0 AFTER `discount_amount`" },
  { name: "payment_method", sql: "ADD COLUMN `payment_method` enum('CASH','QRIS','TRANSFER','MIXED') NOT NULL DEFAULT 'CASH' AFTER `koperasi_share`" },
  { name: "paid_amount", sql: "ADD COLUMN `paid_amount` int(11) NOT NULL DEFAULT 0 AFTER `payment_method`" },
  { name: "change_amount", sql: "ADD COLUMN `change_amount` int(11) NOT NULL DEFAULT 0 AFTER `paid_amount`" },
  { name: "returned_amount", sql: "ADD COLUMN `returned_amount` int(11) NOT NULL DEFAULT 0 AFTER `change_amount`" },
  { name: "returned_profit", sql: "ADD COLUMN `returned_profit` int(11) NOT NULL DEFAULT 0 AFTER `returned_amount`" },
  { name: "notes", sql: "ADD COLUMN `notes` varchar(255) DEFAULT NULL AFTER `returned_profit`" },
  { name: "voided_by", sql: "ADD COLUMN `voided_by` int(11) DEFAULT NULL AFTER `notes`" },
  { name: "void_approved_by", sql: "ADD COLUMN `void_approved_by` int(11) DEFAULT NULL AFTER `voided_by`" },
  { name: "voided_at", sql: "ADD COLUMN `voided_at` datetime DEFAULT NULL AFTER `void_approved_by`" },
  { name: "void_reason", sql: "ADD COLUMN `void_reason` varchar(255) DEFAULT NULL AFTER `voided_at`" },
  { name: "updated_at", sql: "ADD COLUMN `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`" },
];

const SALES_INDEXES = [
  { name: "uniq_sales_invoice_number", sql: "ALTER TABLE `sales` ADD UNIQUE KEY `uniq_sales_invoice_number` (`invoice_number`)" },
  { name: "idx_sales_status", sql: "ALTER TABLE `sales` ADD KEY `idx_sales_status` (`status`)" },
  { name: "idx_sales_shift_id", sql: "ALTER TABLE `sales` ADD KEY `idx_sales_shift_id` (`shift_id`)" },
  { name: "idx_sales_member_id", sql: "ALTER TABLE `sales` ADD KEY `idx_sales_member_id` (`member_id`)" },
];

const SALES_DETAIL_COLUMNS = [
  { name: "product_name", sql: "ADD COLUMN `product_name` varchar(150) DEFAULT NULL AFTER `product_id`" },
  { name: "discount_type", sql: "ADD COLUMN `discount_type` enum('NONE','AMOUNT','PERCENT') NOT NULL DEFAULT 'NONE' AFTER `cost_price`" },
  { name: "discount_value", sql: "ADD COLUMN `discount_value` int(11) NOT NULL DEFAULT 0 AFTER `discount_type`" },
  { name: "discount_amount", sql: "ADD COLUMN `discount_amount` int(11) NOT NULL DEFAULT 0 AFTER `discount_value`" },
  { name: "returned_qty", sql: "ADD COLUMN `returned_qty` int(11) NOT NULL DEFAULT 0 AFTER `subtotal`" },
];

async function getExistingColumns(promisePool, tableName) {
  const [rows] = await promisePool.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return new Map(rows.map((row) => [row.COLUMN_NAME, row]));
}

async function getExistingIndexes(promisePool, tableName) {
  const [rows] = await promisePool.query(
    `SELECT DISTINCT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return new Set(rows.map((row) => row.INDEX_NAME));
}

async function ensurePosSchema(pool) {
  const promisePool = pool.promise();

  // 1. Create new POS tables if they do not exist & drop obsolete pos_cash_movements
  await promisePool.query("DROP TABLE IF EXISTS `pos_cash_movements`");
  for (const ddl of NEW_TABLES_DDL) {
    await promisePool.query(ddl);
  }

  // 1b. Reconcile `pos_shifts` columns (blind close denominations & remove cash_in/cash_out)
  const shiftCols = await getExistingColumns(promisePool, "pos_shifts");
  const alterShiftClauses = [];
  if (!shiftCols.has("denominations_json")) {
    alterShiftClauses.push("ADD COLUMN `denominations_json` text DEFAULT NULL AFTER `actual_cash`");
  }
  if (!shiftCols.has("total_refund_non_cash")) {
    alterShiftClauses.push("ADD COLUMN `total_refund_non_cash` int(11) NOT NULL DEFAULT 0 AFTER `total_refund_cash`");
  }
  if (!shiftCols.has("actual_qris")) {
    alterShiftClauses.push("ADD COLUMN `actual_qris` int(11) DEFAULT NULL AFTER `cash_difference`");
  }
  if (!shiftCols.has("actual_transfer")) {
    alterShiftClauses.push("ADD COLUMN `actual_transfer` int(11) DEFAULT NULL AFTER `actual_qris`");
  }
  if (!shiftCols.has("qris_difference")) {
    alterShiftClauses.push("ADD COLUMN `qris_difference` int(11) DEFAULT NULL AFTER `actual_transfer`");
  }
  if (!shiftCols.has("transfer_difference")) {
    alterShiftClauses.push("ADD COLUMN `transfer_difference` int(11) DEFAULT NULL AFTER `qris_difference`");
  }
  if (!shiftCols.has("audit_status")) {
    alterShiftClauses.push("ADD COLUMN `audit_status` enum('PENDING','VERIFIED') NOT NULL DEFAULT 'PENDING' AFTER `status`");
  }
  if (!shiftCols.has("verified_by")) {
    alterShiftClauses.push("ADD COLUMN `verified_by` int(11) DEFAULT NULL AFTER `audit_status`");
  }
  if (!shiftCols.has("verified_at")) {
    alterShiftClauses.push("ADD COLUMN `verified_at` datetime DEFAULT NULL AFTER `verified_by`");
  }
  if (!shiftCols.has("audit_notes")) {
    alterShiftClauses.push("ADD COLUMN `audit_notes` varchar(500) DEFAULT NULL AFTER `verified_at`");
  }
  if (!shiftCols.has("day_closing_id")) {
    alterShiftClauses.push("ADD COLUMN `day_closing_id` int(11) DEFAULT NULL AFTER `audit_notes`");
  }
  if (shiftCols.has("total_cash_in")) {
    alterShiftClauses.push("DROP COLUMN `total_cash_in`");
  }
  if (shiftCols.has("total_cash_out")) {
    alterShiftClauses.push("DROP COLUMN `total_cash_out`");
  }
  if (alterShiftClauses.length) {
    await promisePool.query(`ALTER TABLE \`pos_shifts\` ${alterShiftClauses.join(", ")}`);
  }

  // 2. Inspect and upgrade `sales`
  const salesCols = await getExistingColumns(promisePool, "sales");
  const alterSalesClauses = [];

  const createdAtCol = salesCols.get("created_at");
  if (createdAtCol && String(createdAtCol.EXTRA || "").toLowerCase().includes("on update")) {
    alterSalesClauses.push(
      "MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT current_timestamp()"
    );
  }

  for (const col of SALES_COLUMNS) {
    if (!salesCols.has(col.name)) {
      alterSalesClauses.push(col.sql);
    }
  }

  if (alterSalesClauses.length) {
    await promisePool.query(`ALTER TABLE \`sales\` ${alterSalesClauses.join(", ")}`);
  }

  const salesIndexes = await getExistingIndexes(promisePool, "sales");
  for (const idx of SALES_INDEXES) {
    if (!salesIndexes.has(idx.name)) {
      await promisePool.query(idx.sql);
    }
  }

  // Backfill legacy sales rows only when invoice_number is NULL
  await promisePool.query(`
    UPDATE \`sales\`
    SET
      \`invoice_number\` = CONCAT('POS-', DATE_FORMAT(COALESCE(\`sale_date\`, CURDATE()), '%Y%m%d'), '-', LPAD(\`id\`, 6, '0')),
      \`subtotal_amount\` = CASE WHEN \`subtotal_amount\` = 0 THEN COALESCE(\`total_amount\`, 0) ELSE \`subtotal_amount\` END,
      \`paid_amount\` = CASE WHEN \`paid_amount\` = 0 THEN COALESCE(\`total_amount\`, 0) ELSE \`paid_amount\` END
    WHERE \`invoice_number\` IS NULL
  `);

  // 3. Inspect and upgrade `sales_details`
  const detailCols = await getExistingColumns(promisePool, "sales_details");
  const alterDetailClauses = [];
  const addedProductName = !detailCols.has("product_name");

  for (const col of SALES_DETAIL_COLUMNS) {
    if (!detailCols.has(col.name)) {
      alterDetailClauses.push(col.sql);
    }
  }

  if (alterDetailClauses.length) {
    await promisePool.query(`ALTER TABLE \`sales_details\` ${alterDetailClauses.join(", ")}`);
  }

  if (addedProductName) {
    await promisePool.query(`
      UPDATE \`sales_details\` sd
      JOIN \`products\` p ON p.id = sd.product_id
      SET sd.product_name = p.name
      WHERE sd.product_name IS NULL
    `);
  }

  // 4. Inspect and upgrade `inventory_transactions.reference_type` ONLY if missing SALE_RETURN
  const invCols = await getExistingColumns(promisePool, "inventory_transactions");
  const refTypeCol = invCols.get("reference_type");
  if (refTypeCol && !String(refTypeCol.COLUMN_TYPE || "").includes("SALE_RETURN")) {
    await promisePool.query(
      "ALTER TABLE `inventory_transactions` MODIFY COLUMN `reference_type` enum('BEGINNING','PURCHASE','SALE','SALE_VOID','SALE_RETURN','ADJUSTMENT') DEFAULT NULL"
    );
  }

  // 5. Inspect and upgrade `sale_returns` (`approved_by`)
  const returnCols = await getExistingColumns(promisePool, "sale_returns");
  if (!returnCols.has("approved_by")) {
    await promisePool.query(
      "ALTER TABLE `sale_returns` ADD COLUMN `approved_by` int(11) DEFAULT NULL AFTER `operator_id`"
    );
  }
}

module.exports = { ensurePosSchema };
