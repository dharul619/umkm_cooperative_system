const router = require("express").Router();
const sessionRoutes = require("./jastipSessionRoutes");
const sessionMenuRoutes = require("./jastipSessionMenuRoutes");
const orderRoutes = require("./jastipOrderRoutes");
const c = require("../controllers/jastipSessionController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.use("/sessions", sessionRoutes);
router.use("/session-menus", sessionMenuRoutes);
router.use("/orders", orderRoutes);

router.get("/member/sessions", auth, authorize(["Cooperative Member"]), c.getMemberSessions);
router.get("/member/sessions/:sessionId/menus", auth, authorize(["Cooperative Member"]), c.getMemberSessionMenus);
router.post("/member/orders", auth, authorize(["Cooperative Member"]), c.createMemberOrder);
router.get("/member/orders", auth, authorize(["Cooperative Member"]), c.getMyOrders);

module.exports = router;
