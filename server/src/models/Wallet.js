const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: ["USER", "VENDOR", "ADMIN"], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    balance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
