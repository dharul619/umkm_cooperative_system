const router = require("express").Router();

const c = require("../controllers/divisionController");
const { auth, authorize } = require("../middleware/authMiddleware");

// Public GET for register form
router.get("/", c.getAll);

// Protected endpoints
router.post("/", auth, authorize(["System Administrator"]), c.create);
router.put("/:id", auth, authorize(["System Administrator"]), c.update);
router.delete("/:id", auth, authorize(["System Administrator"]), c.delete);

module.exports = router;
