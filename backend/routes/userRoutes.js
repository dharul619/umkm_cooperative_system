const router = require("express").Router();
const c = require("../controllers/userController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.get("/", auth, authorize(["System Administrator"]), c.getAll);

router.post("/", auth, authorize(["System Administrator"]), c.create);

router.put("/:id", auth, authorize(["System Administrator"]), c.update);

router.delete("/:id", auth, authorize(["System Administrator"]), c.delete);

router.put(
  "/:id/approve",
  auth,
  authorize(["System Administrator"]),
  c.approve,
);
router.put("/:id/reject", auth, authorize(["System Administrator"]), c.reject);

module.exports = router;
