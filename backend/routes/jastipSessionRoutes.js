const router = require("express").Router();
const c = require("../controllers/jastipSessionController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.get("/", auth, authorize(["Jastip Coordinator"]), c.getAll);
router.get("/open", auth, c.getOpenSession);
router.post("/with-menus", auth, authorize(["Jastip Coordinator"]), c.createWithMenus);
router.get("/:id", auth, authorize(["Jastip Coordinator"]), c.getById);
router.post("/", auth, authorize(["Jastip Coordinator"]), c.create);
router.put("/:id/close", auth, authorize(["Jastip Coordinator"]), c.closeSession);

module.exports = router;
