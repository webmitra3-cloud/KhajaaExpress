const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Review", reviewSchema);
