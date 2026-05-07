const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true },
    qty: { type: Number, required: true },
    selectedVariant: {
      name: String,
      priceDelta: { type: Number, default: 0 }
    },
    selectedAddons: [
      {
        name: String,
        price: { type: Number, default: 0 }
      }
    ],
    tastePreferences: {
      spiceLevel: { type: String, default: "Normal" },
      saltLevel: { type: String, default: "Normal" },
      sweetLevel: { type: String, default: "Normal" },
      drinkSugar: { type: String, default: "Normal" },
      drinkMilk: { type: String, default: "Normal" },
      drinkStrength: { type: String, default: "Normal" },
      remarks: { type: String, default: "" }
    }
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    couponCode: { type: String, default: "" },
    platformFee: { type: Number, default: 0 },
    vendorPayout: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0.1 },
    adminCommission: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["COD", "STRIPE", "KHALTI", "WALLET"], default: "COD" },
    paymentStatus: { type: String, enum: ["UNPAID", "PAID", "PENDING", "REFUNDED"], default: "UNPAID" },
    status: {
      type: String,
      enum: [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED_BY_USER",
        "REJECTED_BY_VENDOR",
        "CANCELLED_BY_ADMIN"
      ],
      default: "PLACED"
    },
    customerAddress: { type: String, required: true },
    customerCity: { type: String, default: "" },
    customerLandmark: { type: String, default: "" },
    customerPhone: { type: String, required: true },
    notes: { type: String, default: "" },
    scheduledFor: { type: Date },
    cancelReason: { type: String, default: "" },
    invoiceNumber: { type: String, default: "" },
    invoiceIssuedAt: { type: Date },
    customerLocation: {
      lat: Number,
      lng: Number
    },
    timeline: [timelineSchema],
    isSettled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
