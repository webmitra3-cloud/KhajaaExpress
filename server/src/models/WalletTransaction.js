const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: ["COMMISSION", "EARNING", "REFUND", "ADJUSTMENT", "PAYOUT"], required: true },
    amount: { type: Number, required: true },
    refOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    refPayoutId: { type: mongoose.Schema.Types.ObjectId, ref: "Payout" },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
