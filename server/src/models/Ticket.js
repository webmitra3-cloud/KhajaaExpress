const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    category: { type: String, required: true },
    message: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"], default: "OPEN" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
