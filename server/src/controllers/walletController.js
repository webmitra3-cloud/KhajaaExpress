const { z } = require("zod");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { success, fail } = require("../utils/response");
const { getOrCreateWallet, addTransaction } = require("../services/walletService");

const topupSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().min(1)
});

const getMyWallet = async (req, res) => {
  const wallet = await getOrCreateWallet({
    ownerType: req.user.role === "CUSTOMER" ? "USER" : req.user.role,
    ownerId: req.user._id
  });
  return success(res, "Wallet", wallet);
};

const getMyTransactions = async (req, res) => {
  const wallet = await getOrCreateWallet({
    ownerType: req.user.role === "CUSTOMER" ? "USER" : req.user.role,
    ownerId: req.user._id
  });
  const transactions = await WalletTransaction.find({ walletId: wallet._id }).sort({ createdAt: -1 });
  return success(res, "Transactions", transactions);
};

const adminTopup = async (req, res) => {
  const parsed = topupSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const { userId, amount } = parsed.data;
  const wallet = await getOrCreateWallet({ ownerType: "USER", ownerId: userId });
  await addTransaction({
    walletId: wallet._id,
    type: "ADJUSTMENT",
    amount,
    note: "Admin top-up"
  });
  return success(res, "Wallet topped up", wallet);
};

module.exports = { getMyWallet, getMyTransactions, adminTopup };
