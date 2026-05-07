const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["CUSTOMER", "VENDOR"], required: true },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
