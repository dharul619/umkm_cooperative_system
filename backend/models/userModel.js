const db = require("../config/db");

/**
 * Get all users with join details (excludes password field)
 * Used for listing with filters
 */
exports.getAll = (filters = {}) => {
  let query = `
    SELECT
      u.id,
      u.name,
      u.phone_number,
      u.username,
      u.status,
      u.role_id,
      u.division_id,
      u.department_id,
      u.created_at,
      u.updated_at,
      r.role_name,
      d.name as division_name,
      dept.name as department_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN divisions d ON u.division_id = d.id
    LEFT JOIN departments dept ON u.department_id = dept.id
    WHERE 1=1
  `;

  const params = [];

  // Filter by status
  if (filters.status) {
    query += " AND u.status = ?";
    params.push(filters.status);
  }

  // Filter by role
  if (filters.role_id) {
    query += " AND u.role_id = ?";
    params.push(filters.role_id);
  }

  // Filter by division
  if (filters.division_id) {
    query += " AND u.division_id = ?";
    params.push(filters.division_id);
  }

  // Filter by department
  if (filters.department_id) {
    query += " AND u.department_id = ?";
    params.push(filters.department_id);
  }

  // Search by name or username
  if (filters.search) {
    query += " AND (u.name LIKE ? OR u.username LIKE ?)";
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += " ORDER BY u.created_at DESC";

  return db.promise().query(query, params);
};

/**
 * Get user by ID (excludes password field)
 */
exports.getById = (id) => {
  return db.promise().query(
    `SELECT
      u.id,
      u.name,
      u.phone_number,
      u.username,
      u.status,
      u.role_id,
      u.division_id,
      u.department_id,
      u.created_at,
      u.updated_at,
      r.role_name,
      d.name as division_name,
      dept.name as department_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN divisions d ON u.division_id = d.id
    LEFT JOIN departments dept ON u.department_id = dept.id
    WHERE u.id = ?
    LIMIT 1`,
    [id]
  );
};

/**
 * Count users by role (used for checking minimum admin requirement)
 */
exports.countByRole = (roleId) => {
  return db.promise().query(
    `SELECT COUNT(*) as count FROM users WHERE role_id = ? AND status = 'approved'`,
    [roleId]
  );
};

/**
 * Check if user is referenced by other tables
 */
exports.getReferenceCount = async (id) => {
  const [userRows] = await db.promise().query(
    `SELECT role_id FROM users WHERE id = ? LIMIT 1`,
    [id]
  );

  if (userRows.length === 0) {
    return { exists: false };
  }

  // Check if this is an admin user
  const isAdmin = userRows[0].role_id === 1;

  // Count how many admins would remain if this user is deactivated
  if (isAdmin) {
    const [adminCount] = await db.promise().query(
      `SELECT COUNT(*) as count FROM users WHERE role_id = 1 AND status = 'approved' AND id != ?`,
      [id]
    );
    return {
      exists: true,
      isAdmin: true,
      remainingAdmins: adminCount[0]?.count || 0,
    };
  }

  return { exists: true, isAdmin: false };
};

/**
 * Create new user
 */
exports.create = (data) => {
  // Ensure no password field is passed directly - password should be hashed first
  const { password, ...rest } = data;
  return db.promise().query(
    "INSERT INTO users (name, phone_number, username, password, role_id, division_id, department_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      rest.name,
      rest.phone_number,
      rest.username,
      password, // Should already be hashed by controller
      rest.role_id || 4, // Default to Cooperative Member
      rest.division_id || null,
      rest.department_id || null,
      rest.status || "pending",
    ]
  );
};

/**
 * Update user
 */
exports.update = (id, data) => {
  // Remove password from update - use separate resetPassword method
  const { password, ...rest } = data;

  const fields = [];
  const values = [];

  if (rest.name !== undefined) {
    fields.push("name = ?");
    values.push(rest.name);
  }
  if (rest.phone_number !== undefined) {
    fields.push("phone_number = ?");
    values.push(rest.phone_number);
  }
  if (rest.username !== undefined) {
    fields.push("username = ?");
    values.push(rest.username);
  }
  if (rest.role_id !== undefined) {
    fields.push("role_id = ?");
    values.push(rest.role_id);
  }
  if (rest.division_id !== undefined) {
    fields.push("division_id = ?");
    values.push(rest.division_id);
  }
  if (rest.department_id !== undefined) {
    fields.push("department_id = ?");
    values.push(rest.department_id);
  }
  if (rest.status !== undefined) {
    fields.push("status = ?");
    values.push(rest.status);
  }

  if (fields.length === 0) {
    return db.promise().query("SELECT 1"); // No updates
  }

  values.push(id);

  return db.promise().query(
    `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
    values
  );
};

/**
 * Reset password (admin function - sets new hashed password)
 */
exports.resetPassword = (id, hashedPassword) => {
  return db.promise().query(
    "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
    [hashedPassword, id]
  );
};

/**
 * Soft delete user (set status to rejected)
 */
exports.delete = (id) => {
  return db.promise().query(
    "UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = ?",
    [id]
  );
};

/**
 * Activate user (set status to approved)
 */
exports.activate = (id) => {
  return db.promise().query(
    "UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = ?",
    [id]
  );
};

/**
 * Deactivate user (set status to rejected)
 */
exports.deactivate = (id) => {
  return db.promise().query(
    "UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = ?",
    [id]
  );
};

/**
 * Get pending registrations (for approval page)
 */
exports.getPending = () => {
  return db.promise().query(
    `SELECT
      u.id,
      u.name,
      u.phone_number,
      u.username,
      u.status,
      u.role_id,
      u.division_id,
      u.department_id,
      u.created_at,
      r.role_name,
      d.name as division_name,
      dept.name as department_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN divisions d ON u.division_id = d.id
    LEFT JOIN departments dept ON u.department_id = dept.id
    WHERE u.status = 'pending'
    ORDER BY u.created_at DESC`
  );
};

/**
 * Get user password hash (for verification purposes only)
 */
exports.getPasswordHash = (id) => {
  return db.promise().query(
    "SELECT password FROM users WHERE id = ? LIMIT 1",
    [id]
  );
};
