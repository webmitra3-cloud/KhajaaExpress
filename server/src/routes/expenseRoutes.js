const express = require("express");
const { listExpenses, createExpense } = require("../controllers/expenseController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", protect, requireRole("VENDOR"), listExpenses);
router.post("/", protect, requireRole("VENDOR"), createExpense);

module.exports = router;
