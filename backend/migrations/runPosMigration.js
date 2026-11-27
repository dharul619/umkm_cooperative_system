require("dotenv").config();
const mysql = require("mysql2");
const { ensurePosSchema } = require("../config/posSchema");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
});

(async () => {
  try {
    console.log("Running POS professional schema migration...");
    await ensurePosSchema(pool);
    console.log("POS schema migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("POS schema migration failed:", err);
    process.exit(1);
  } finally {
    pool.end();
  }
})();
