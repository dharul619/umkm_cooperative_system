const db = require("../config/db");

exports.getAll = (filters = {}) => {
  let query = `
    SELECT
      al.id,
      al.user_id,
      al.activity,
      al.created_at,
      u.name AS user_name,
      u.username AS user_username,
      r.role_name AS user_role
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;

  const params = [];

  // Filter by user_id
  if (filters.user_id) {
    query += " AND al.user_id = ?";
    params.push(filters.user_id);
  }

  // Filter by date range
  if (filters.from) {
    query += " AND al.created_at >= ?";
    params.push(filters.from);
  }

  if (filters.to) {
    query += " AND al.created_at <= ?";
    params.push(filters.to);
  }

  query += " ORDER BY al.created_at DESC";

  // Pagination
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(Number(filters.limit));
  }

  if (filters.offset) {
    query += " OFFSET ?";
    params.push(Number(filters.offset));
  }

  return db.promise().query(query, params);
};

exports.getTotalCount = (filters = {}) => {
  let query = `
    SELECT COUNT(*) AS total
    FROM activity_logs al
    WHERE 1=1
  `;

  const params = [];

  if (filters.user_id) {
    query += " AND al.user_id = ?";
    params.push(filters.user_id);
  }

  if (filters.from) {
    query += " AND al.created_at >= ?";
    params.push(filters.from);
  }

  if (filters.to) {
    query += " AND al.created_at <= ?";
    params.push(filters.to);
  }

  return db.promise().query(query, params);
};

exports.create = (data) => {
  return db.promise().query(
    "INSERT INTO activity_logs (user_id, activity) VALUES (?, ?)",
    [data.user_id, data.activity]
  );
};

exports.log = async (userId, activity) => {
  try {
    await db.promise().query(
      "INSERT INTO activity_logs (user_id, activity) VALUES (?, ?)",
      [userId, activity]
    );
  } catch (err) {
    // Log error but don't throw - activity logging should not break main operations
    console.error("Failed to log activity:", err.message);
  }
};
