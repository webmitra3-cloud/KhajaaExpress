const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, default: "Home" },
    fullAddress: { type: String, required: true },
    city: { type: String, default: "" },
    landmark: { type: String, default: "" },
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
