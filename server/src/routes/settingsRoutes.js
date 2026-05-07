const express = require("express");
const { getPublicSettings, getAdminSettings, updateSettings } = require("../controllers/settingsController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/public", getPublicSettings);
router.get("/", protect, requireRole("ADMIN"), getAdminSettings);
router.put("/", protect, requireRole("ADMIN"), updateSettings);

module.exports = router;
