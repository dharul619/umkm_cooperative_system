const mysql = require("mysql2");
const { ensurePosSchema } = require("./posSchema");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  connectionLimit: 25,
  queueLimit: 0,
});

const PERFORMANCE_INDEXES = [
  {
    table: "sales",
    index: "idx_sales_date",
    sql: "ALTER TABLE `sales` ADD KEY `idx_sales_date` (`sale_date`)",
  },
  {
    table: "sales",
    index: "idx_sales_date_status",
    sql: "ALTER TABLE `sales` ADD KEY `idx_sales_date_status` (`sale_date`, `status`)",
  },
  {
    table: "sales_details",
    index: "idx_sales_details_sale_product",
    sql: "ALTER TABLE `sales_details` ADD KEY `idx_sales_details_sale_product` (`sale_id`, `product_id`)",
  },
  {
    table: "purchases",
    index: "idx_purchases_date",
    sql: "ALTER TABLE `purchases` ADD KEY `idx_purchases_date` (`purchase_date`)",
  },
  {
    table: "inventory_transactions",
    index: "idx_inv_product_created",
    sql: "ALTER TABLE `inventory_transactions` ADD KEY `idx_inv_product_created` (`product_id`, `created_at`)",
  },
  {
    table: "inventory_transactions",
    index: "idx_inv_product_type_qty",
    sql: "ALTER TABLE `inventory_transactions` ADD KEY `idx_inv_product_type_qty` (`product_id`, `type`, `qty`)",
  },
  {
    table: "sales_predictions",
    index: "idx_predictions_model_prod_date",
    sql: "ALTER TABLE `sales_predictions` ADD KEY `idx_predictions_model_prod_date` (`model_version`, `product_id`, `prediction_date`)",
  },
  {
    table: "jastip_orders",
    index: "idx_jastip_orders_status_created",
    sql: "ALTER TABLE `jastip_orders` ADD KEY `idx_jastip_orders_status_created` (`status`, `created_at`)",
  },
];

/**
 * Ensure performance indexes exist on transaction and inventory tables.
 */
const ensurePerformanceIndexes = async () => {
  for (const item of PERFORMANCE_INDEXES) {
    try {
      await db.promise().query(item.sql);
    } catch (err) {
      if (err.code !== "ER_DUP_KEYNAME" && err.errno !== 1061) {
        console.error(
          `Failed to ensure index ${item.index} on ${item.table}:`,
          err.message
        );
      }
    }
  }
};

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database Error: ", err);
    return;
  }

  connection.release();
  console.log("Database Connected!");
  ensurePerformanceIndexes();
  ensurePosSchema(db).catch((schemaErr) => {
    console.error("Failed to ensure POS schema:", schemaErr.message);
  });
});

module.exports = db;
