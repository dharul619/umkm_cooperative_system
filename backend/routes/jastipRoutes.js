const router = require("express").Router();
const sessionRoutes = require("./jastipSessionRoutes");
const sessionMenuRoutes = require("./jastipSessionMenuRoutes");
const orderRoutes = require("./jastipOrderRoutes");
const c = require("../controllers/jastipSessionController");
const orderController = require("../controllers/jastipOrderController");
const vendorOrderController = require("../controllers/vendorOrderController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.use("/sessions", sessionRoutes);
router.use("/session-menus", sessionMenuRoutes);
router.use("/orders", orderRoutes);

router.get("/coordinator/stats", auth, authorize(["Jastip Coordinator", "System Administrator"]), c.getCoordinatorStats);

router.get("/member/sessions", auth, authorize(["Cooperative Member"]), c.getMemberSessions);
router.get("/member/sessions/:sessionId/menus", auth, authorize(["Cooperative Member"]), c.getMemberSessionMenus);
router.post("/member/orders", auth, authorize(["Cooperative Member"]), c.createMemberOrder);
router.get("/member/orders", auth, authorize(["Cooperative Member"]), c.getMyOrders);

// Member edit/delete order items
router.put("/order-details/:id", auth, authorize(["Cooperative Member"]), orderController.updateMemberOrderDetail);
router.delete("/order-details/:id", auth, authorize(["Cooperative Member"]), orderController.deleteMemberOrderDetail);

// Coordinator vendor orders rekap & WhatsApp link
router.get("/sessions/:sessionId/vendor-orders", auth, authorize(["Jastip Coordinator", "System Administrator"]), vendorOrderController.getBySessionId);
router.patch("/vendor-orders/:id/sent", auth, authorize(["Jastip Coordinator", "System Administrator"]), vendorOrderController.markAsSent);

module.exports = router;
