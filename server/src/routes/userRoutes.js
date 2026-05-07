const express = require("express");
const { getMe, updateMe, updateTheme, listUsers, setActive } = require("../controllers/userController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.patch("/theme", protect, updateTheme);
router.get("/", protect, requireRole("ADMIN"), listUsers);
router.put("/:id/active", protect, requireRole("ADMIN"), setActive);

module.exports = router;
