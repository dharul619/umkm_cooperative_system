const router = require("express").Router();
const c = require("../controllers/paymentController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.get("/member", auth, authorize(["Cooperative Member"]), c.getMyPayments);
router.get("/member/:orderId", auth, authorize(["Cooperative Member"]), c.getPaymentByOrder);
router.post("/mock", auth, authorize(["Cooperative Member"]), c.createMockPayment);
router.put("/:id/settle", auth, authorize(["Cooperative Member"]), c.settleMockPayment);
router.put("/:id/fail", auth, authorize(["Cooperative Member"]), c.failMockPayment);

module.exports = router;
