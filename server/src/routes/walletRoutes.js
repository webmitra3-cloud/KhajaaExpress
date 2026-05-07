const express = require("express");
const { getMyWallet, getMyTransactions, adminTopup } = require("../controllers/walletController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/me", protect, getMyWallet);
router.get("/me/transactions", protect, getMyTransactions);
router.post("/topup", protect, requireRole("ADMIN"), adminTopup);

module.exports = router;
