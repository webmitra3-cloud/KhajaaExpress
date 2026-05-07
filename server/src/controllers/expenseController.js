const { z } = require("zod");
const Expense = require("../models/Expense");
const Vendor = require("../models/Vendor");
const { success, fail } = require("../utils/response");

const expenseSchema = z.object({
  category: z.string().min(2),
  amount: z.number().min(1),
  note: z.string().optional(),
  date: z.string().optional()
});

const listExpenses = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const expenses = await Expense.find({ vendorId: vendor._id }).sort({ date: -1 });
  return success(res, "Expenses", expenses);
};

const createExpense = async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const expense = await Expense.create({
    vendorId: vendor._id,
    category: parsed.data.category,
    amount: parsed.data.amount,
    note: parsed.data.note || "",
    date: parsed.data.date ? new Date(parsed.data.date) : new Date()
  });
  return success(res, "Expense added", expense, 201);
};

module.exports = { listExpenses, createExpense };
