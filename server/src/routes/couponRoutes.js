const express = require("express");
const { listPublic, listAll, createCoupon, deleteCoupon } = require("../controllers/couponController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/public", listPublic);
router.get("/", protect, requireRole("ADMIN"), listAll);
router.post("/", protect, requireRole("ADMIN"), createCoupon);
router.delete("/:id", protect, requireRole("ADMIN"), deleteCoupon);

module.exports = router;
