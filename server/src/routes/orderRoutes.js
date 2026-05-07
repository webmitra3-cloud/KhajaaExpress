const express = require("express");
const {
  placeOrder,
  getMyOrders,
  getVendorOrders,
  getAdminOrders,
  updateStatus,
  cancelOrder,
  getInvoice
} = require("../controllers/orderController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.post("/", protect, requireRole("CUSTOMER"), placeOrder);
router.get("/my", protect, requireRole("CUSTOMER"), getMyOrders);
router.get("/vendor", protect, requireRole("VENDOR"), getVendorOrders);
router.get("/admin", protect, requireRole("ADMIN"), getAdminOrders);
router.put("/:id/status", protect, requireRole("VENDOR", "ADMIN"), updateStatus);
router.put("/:id/cancel", protect, requireRole("CUSTOMER"), cancelOrder);
router.get("/:id/invoice", protect, requireRole("CUSTOMER", "VENDOR", "ADMIN"), getInvoice);

module.exports = router;
