const router = require("express").Router();
const c = require("../controllers/jastipSessionMenuController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.get("/:sessionId", auth, authorize(["Jastip Coordinator"]), c.getBySessionId);
router.post("/", auth, authorize(["Jastip Coordinator"]), c.addMenu);
router.put("/:id", auth, authorize(["Jastip Coordinator"]), c.updateMenu);
router.delete("/:id", auth, authorize(["Jastip Coordinator"]), c.removeMenu);

module.exports = router;
