const router = require("express").Router();
const c = require("../controllers/userController");
const { auth, authorize } = require("../middleware/authMiddleware");

// Get all users with filters
router.get("/", auth, authorize(["System Administrator"]), c.getAll);

// Get user by ID
router.get("/:id", auth, authorize(["System Administrator"]), c.getById);

// Create new user
router.post("/", auth, authorize(["System Administrator"]), c.create);

// Update user
router.put("/:id", auth, authorize(["System Administrator"]), c.update);

// Delete user (soft delete)
router.delete("/:id", auth, authorize(["System Administrator"]), c.delete);

// User status management
router.put("/:id/approve", auth, authorize(["System Administrator"]), c.approve);
router.put("/:id/reject", auth, authorize(["System Administrator"]), c.reject);
router.patch("/:id/activate", auth, authorize(["System Administrator"]), c.activate);
router.patch("/:id/deactivate", auth, authorize(["System Administrator"]), c.deactivate);

// Password management
router.patch("/:id/reset-password", auth, authorize(["System Administrator"]), c.resetPassword);

module.exports = router;
