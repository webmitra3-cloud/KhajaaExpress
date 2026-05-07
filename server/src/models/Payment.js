const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    method: { type: String, enum: ["COD", "WALLET", "STRIPE", "KHALTI"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"], default: "PENDING" },
    providerReference: { type: String, default: "" },
    providerPayload: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
