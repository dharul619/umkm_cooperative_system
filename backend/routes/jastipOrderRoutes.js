const router = require("express").Router();
const c = require("../controllers/jastipOrderController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.get("/", auth, authorize(["Jastip Coordinator"]), c.getAll);
router.get("/member", auth, authorize(["Cooperative Member"]), c.getMemberOrders);

module.exports = router;
