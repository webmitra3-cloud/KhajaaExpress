const express = require("express");
const { createReview, listReviewsByVendor } = require("../controllers/reviewController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.post("/", protect, requireRole("CUSTOMER"), createReview);
router.get("/vendor/:vendorId", listReviewsByVendor);

module.exports = router;
