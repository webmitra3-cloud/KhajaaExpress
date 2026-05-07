const express = require("express");
const { listAddresses, createAddress, updateAddress, deleteAddress } = require("../controllers/addressController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", protect, requireRole("CUSTOMER"), listAddresses);
router.post("/", protect, requireRole("CUSTOMER"), createAddress);
router.put("/:id", protect, requireRole("CUSTOMER"), updateAddress);
router.delete("/:id", protect, requireRole("CUSTOMER"), deleteAddress);

module.exports = router;
