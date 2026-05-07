const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["REQUESTED", "APPROVED", "PAID", "REJECTED"], default: "REQUESTED" },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    paidAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payout", payoutSchema);
