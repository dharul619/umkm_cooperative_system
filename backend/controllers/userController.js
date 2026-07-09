const model = require("../models/userModel");
const bcrypt = require("bcrypt");
const activityLogModel = require("../models/activityLogModel");

// Role ID constants
const ROLE_ADMIN = 1;

/**
 * Get all users with optional filters
 * GET /api/admin/users
 */
exports.getAll = async (req, res) => {
  try {
    const { status, role_id, division_id, department_id, search, page = 1, limit = 50 } = req.query;

    const filters = {
      status: status || undefined,
      role_id: role_id ? Number(role_id) : undefined,
      division_id: division_id ? Number(division_id) : undefined,
      department_id: department_id ? Number(department_id) : undefined,
      search: search || undefined,
    };

    const [data] = await model.getAll(filters);

    res.json({
      success: true,
      data: data,
      message: `Found ${data.length} users`,
    });
  } catch (err) {
    console.error("getAll users error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await model.getById(id);

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error("getById user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create new user
 * POST /api/admin/users
 */
exports.create = async (req, res) => {
  try {
    const { name, phone_number, username, password, role_id, division_id, department_id, status } = req.body;

    // Validation
    if (!name || !phone_number || !username || !password) {
      return res.status(400).json({ success: false, message: "Name, phone_number, username, and password are required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await model.create({
      name,
      phone_number,
      username,
      password: hashedPassword,
      role_id: role_id || 4, // Default to Cooperative Member
      division_id: division_id || null,
      department_id: department_id || null,
      status: status || "pending",
    });

    const newUserId = result[0].insertId;

    // Log activity
    await activityLogModel.log(
      req.user.id,
      `Membuat user baru #${newUserId} (${username}) dengan role ${role_id || 4}`
    );

    res.status(201).json({ success: true, message: "User created successfully", id: newUserId });
  } catch (err) {
    console.error("create user error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Username or phone number already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone_number, username, role_id, division_id, department_id, status } = req.body;

    // Check if user exists
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // SELF-PROTECTION: Cannot modify own account role
    if (Number(id) === req.user.id) {
      if (role_id && Number(role_id) !== ROLE_ADMIN) {
        return res.status(403).json({ success: false, message: "Tidak dapat mengubah role akun sendiri" });
      }
    }

    // SELF-PROTECTION: Cannot lower own status
    if (Number(id) === req.user.id && status && status !== existingUser[0].status) {
      return res.status(403).json({ success: false, message: "Tidak dapat mengubah status akun sendiri" });
    }

    // Build update payload
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (phone_number !== undefined) payload.phone_number = phone_number;
    if (username !== undefined) payload.username = username;
    if (role_id !== undefined) payload.role_id = Number(role_id);
    if (division_id !== undefined) payload.division_id = division_id ? Number(division_id) : null;
    if (department_id !== undefined) payload.department_id = department_id ? Number(department_id) : null;
    if (status !== undefined) payload.status = status;

    await model.update(id, payload);

    // Log activity
    const changes = [];
    if (role_id) changes.push(`role → ${role_id}`);
    if (status) changes.push(`status → ${status}`);
    if (name) changes.push(`name → ${name}`);

    await activityLogModel.log(
      req.user.id,
      `Mengubah user #${id} (${existingUser[0].username})${changes.length > 0 ? ": " + changes.join(", ") : ""}`
    );

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("update user error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Username or phone number already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Approve user registration
 * PUT /api/admin/users/:id/approve
 */
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is pending
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existingUser[0].status !== "pending") {
      return res.status(400).json({ success: false, message: "User is not in pending status" });
    }

    await model.update(id, { status: "approved" });

    // Log activity
    await activityLogModel.log(
      req.user.id,
      `Approve user #${id} (${existingUser[0].username}) sebagai ${existingUser[0].role_name || "Cooperative Member"}`
    );

    res.json({ success: true, message: "User approved successfully" });
  } catch (err) {
    console.error("approve user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Reject user registration
 * PUT /api/admin/users/:id/reject
 */
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is pending
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existingUser[0].status !== "pending") {
      return res.status(400).json({ success: false, message: "User is not in pending status" });
    }

    await model.update(id, { status: "rejected" });

    // Log activity
    await activityLogModel.log(
      req.user.id,
      `Reject user #${id} (${existingUser[0].username})`
    );

    res.json({ success: true, message: "User rejected successfully" });
  } catch (err) {
    console.error("reject user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Reset user password (admin function)
 * PATCH /api/admin/users/:id/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validation
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // SELF-PROTECTION: Cannot reset own password via this endpoint
    if (Number(id) === req.user.id) {
      return res.status(403).json({ success: false, message: "Gunakan fitur ubah password untuk akun sendiri" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await model.resetPassword(id, hashedPassword);

    // Log activity (don't log the actual password!)
    await activityLogModel.log(
      req.user.id,
      `Reset password untuk user #${id} (${existingUser[0].username})`
    );

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Deactivate user (soft delete)
 * PATCH /api/admin/users/:id/deactivate
 */
exports.deactivate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existingUser[0].status === "rejected") {
      return res.status(400).json({ success: false, message: "User is already deactivated" });
    }

    // SELF-PROTECTION: Cannot deactivate own account
    if (Number(id) === req.user.id) {
      return res.status(403).json({ success: false, message: "Tidak dapat menonaktifkan akun sendiri" });
    }

    // MINIMUM ADMIN CHECK: Cannot deactivate last admin
    if (existingUser[0].role_id === ROLE_ADMIN) {
      const [adminCount] = await model.countByRole(ROLE_ADMIN);
      if (adminCount[0].count <= 1) {
        return res.status(409).json({
          success: false,
          message: "Tidak dapat menonaktifkan admin terakhir. Minimal harus ada 1 admin aktif."
        });
      }
    }

    await model.deactivate(id);

    // Log activity
    await activityLogModel.log(
      req.user.id,
      `Menonaktifkan user #${id} (${existingUser[0].username})`
    );

    res.json({ success: true, message: "User deactivated successfully" });
  } catch (err) {
    console.error("deactivate user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Activate user
 * PATCH /api/admin/users/:id/activate
 */
exports.activate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existingUser[0].status === "approved") {
      return res.status(400).json({ success: false, message: "User is already active" });
    }

    await model.activate(id);

    // Log activity
    await activityLogModel.log(
      req.user.id,
      `Mengaktifkan user #${id} (${existingUser[0].username})`
    );

    res.json({ success: true, message: "User activated successfully" });
  } catch (err) {
    console.error("activate user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete user (soft delete - sets status to rejected)
 * DELETE /api/admin/users/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await model.getById(id);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // SELF-PROTECTION: Cannot delete own account
    if (Number(id) === req.user.id) {
      return res.status(403).json({ success: false, message: "Tidak dapat menghapus akun sendiri" });
    }

    // MINIMUM ADMIN CHECK: Cannot delete last admin
    if (existingUser[0].role_id === ROLE_ADMIN) {
      const [adminCount] = await model.countByRole(ROLE_ADMIN);
      if (adminCount[0].count <= 1) {
        return res.status(409).json({
          success: false,
          message: "Tidak dapat menghapus admin terakhir. Minimal harus ada 1 admin aktif."
        });
      }
    }

    await model.delete(id);

    // Log activity
    await activityLogModel.log(
      req.user.id,
      `Menghapus user #${id} (${existingUser[0].username})`
    );

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("delete user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get pending registrations
 * GET /api/admin/registrations
 */
exports.getPending = async (req, res) => {
  try {
    const [data] = await model.getPending();

    res.json({
      success: true,
      data: data,
      message: `Found ${data.length} pending registrations`,
    });
  } catch (err) {
    console.error("getPending error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
