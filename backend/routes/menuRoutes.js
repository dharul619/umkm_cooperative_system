const router = require("express").Router();
const c = require("../controllers/menuController");
const { auth, authorize } = require("../middleware/authMiddleware");

router.get("/", auth, authorize(["System Administrator", "Jastip Coordinator"]), c.getAll);
router.post("/", auth, authorize(["System Administrator", "Jastip Coordinator"]), c.create);
router.put("/:id", auth, authorize(["System Administrator", "Jastip Coordinator"]), c.update);
router.delete("/:id", auth, authorize(["System Administrator", "Jastip Coordinator"]), c.delete);

module.exports = router;
