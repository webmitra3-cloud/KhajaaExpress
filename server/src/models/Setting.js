const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    deliveryFeeDefault: { type: Number, default: 60 },
    minOrderDefault: { type: Number, default: 300 },
    supportEmail: { type: String, default: "support@khajaexpress.local" },
    isOpen: { type: Boolean, default: true },
    heroMessage: { type: String, default: "Fresh. Fast. Cash on Delivery." }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
