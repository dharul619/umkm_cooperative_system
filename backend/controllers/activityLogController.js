const activityLogModel = require("../models/activityLogModel");
const { auth, authorize } = require("../middleware/authMiddleware");

/**
 * Get all activity logs with filtering and pagination
 * GET /api/admin/activity-logs
 */
exports.getAll = async (req, res) => {
  try {
    const { user_id, from, to, page = 1, limit = 50 } = req.query;

    const filters = {
      user_id: user_id ? Number(user_id) : undefined,
      from: from || undefined,
      to: to || undefined,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    };

    const [data] = await activityLogModel.getAll(filters);
    const [countResult] = await activityLogModel.getTotalCount(filters);
    const total = countResult?.[0]?.total || 0;

    res.json({
      success: true,
      data: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getAll activity logs error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create activity log entry
 * POST /api/admin/activity-logs
 */
exports.create = async (req, res) => {
  try {
    const { activity } = req.body;

    if (!activity) {
      return res.status(400).json({ success: false, message: "Activity description is required" });
    }

    await activityLogModel.create({
      user_id: req.user.id,
      activity: activity,
    });

    res.json({ success: true, message: "Activity logged" });
  } catch (err) {
    console.error("create activity log error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Helper function to log activity from other controllers
 * Usage: await activityLogService.log(userId, "Action description")
 */
exports.logActivity = async (userId, activity) => {
  await activityLogModel.log(userId, activity);
};
