const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cooperative_system_db",
  });

  console.log("Connected to Database!");

  // Check if session 23 exists and what its fields are
  const [sessions] = await connection.query("SELECT * FROM jastip_orders WHERE id = 23");
  console.log("\n--- SESSION 23 DETAILS ---");
  console.log(sessions[0]);

  // Check order details for session 23
  const [orderDetails] = await connection.query("SELECT * FROM jastip_order_details WHERE order_id = 23");
  console.log("\n--- ORDER DETAILS FOR SESSION 23 ---");
  console.log(orderDetails);

  // Check all jastip_session_menus for session 23
  const [sessionMenus] = await connection.query("SELECT * FROM jastip_session_menus WHERE session_id = 23");
  console.log("\n--- SESSION MENUS FOR SESSION 23 ---");
  console.log(sessionMenus);

  await connection.end();
}

check().catch(console.error);
