const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database Error: ", err);
    return;
  }

  connection.release();
  console.log("Database Connected!");
});

module.exports = db;
