const mysql = require("mysql2");
const { ensurePosSchema } = require("./posSchema");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
});

const PERFORMANCE_INDEXES = [
  {
    table: "sales",
    index: "idx_sales_date",
    sql: "ALTER TABLE `sales` ADD KEY `idx_sales_date` (`sale_date`)",
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
