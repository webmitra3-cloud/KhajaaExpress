const express = require("express");
const {
  requestPayout,
  listVendorPayouts,
  listAdminPayouts,
  approvePayout,
  markPaid
} = require("../controllers/payoutController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.post("/request", protect, requireRole("VENDOR"), requestPayout);
router.get("/vendor", protect, requireRole("VENDOR"), listVendorPayouts);
router.get("/admin", protect, requireRole("ADMIN"), listAdminPayouts);
router.put("/:id/approve", protect, requireRole("ADMIN"), approvePayout);
router.put("/:id/paid", protect, requireRole("ADMIN"), markPaid);

module.exports = router;
