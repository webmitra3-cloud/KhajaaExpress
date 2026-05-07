const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["PERCENT", "FLAT"], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    scope: { type: String, enum: ["GLOBAL", "VENDOR"], default: "GLOBAL" },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
