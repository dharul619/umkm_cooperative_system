const router = require("express").Router();
const c = require("../controllers/activityLogController");
const { auth, authorize } = require("../middleware/authMiddleware");

// All admin routes require authentication and System Administrator role
router.use(auth);
router.use(authorize(["System Administrator"]));

// GET /api/admin/activity-logs - Get all activity logs with filtering
router.get("/", c.getAll);

// POST /api/admin/activity-logs - Create activity log entry
router.post("/", c.create);

module.exports = router;
