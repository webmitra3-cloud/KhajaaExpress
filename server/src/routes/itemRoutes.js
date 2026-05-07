const express = require("express");
const { createItem, updateItem, deleteItem, getVendorItems, getPublicItems } = require("../controllers/itemController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.post("/", protect, requireRole("VENDOR"), createItem);
router.put("/:id", protect, requireRole("VENDOR"), updateItem);
router.delete("/:id", protect, requireRole("VENDOR"), deleteItem);
router.get("/vendor/me", protect, requireRole("VENDOR"), getVendorItems);
router.get("/public", getPublicItems);

module.exports = router;
