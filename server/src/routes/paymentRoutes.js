const express = require("express");
const {
  createStripeCheckoutSession,
  confirmStripeSession,
  getStripeKey,
  initiateKhalti,
  verifyKhalti
} = require("../controllers/paymentController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/stripe/key", protect, requireRole("CUSTOMER"), getStripeKey);
router.post("/stripe/checkout", protect, requireRole("CUSTOMER"), createStripeCheckoutSession);
router.post("/stripe/confirm", protect, requireRole("CUSTOMER"), confirmStripeSession);

router.post("/khalti/initiate", protect, requireRole("CUSTOMER"), initiateKhalti);
router.post("/khalti/verify", protect, requireRole("CUSTOMER"), verifyKhalti);

module.exports = router;
