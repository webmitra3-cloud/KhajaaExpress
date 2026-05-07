const axios = require("axios");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Vendor = require("../models/Vendor");
const { success, fail } = require("../utils/response");

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_API_KEY) {
    return null;
  }
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
};

const ensureCustomerOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    fail(res, "Order id required", null, 400);
    return null;
  }
  const order = await Order.findById(orderId).populate("vendorId", "restaurantName");
  if (!order) {
    fail(res, "Order not found", null, 404);
    return null;
  }
  if (order.customerId.toString() !== req.user._id.toString()) {
    fail(res, "Forbidden", null, 403);
    return null;
  }
  return order;
};

const createStripeCheckoutSession = async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return fail(res, "Stripe not configured", null, 400);
  }
  const order = await ensureCustomerOrder(req, res);
  if (!order) return;
  if (order.paymentMethod !== "STRIPE") {
    return fail(res, "Order is not marked for Stripe payment", null, 400);
  }
  if (order.paymentStatus === "PAID") {
    return success(res, "Order already paid", { url: "", sessionId: "" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "npr",
          product_data: {
            name: `Order ${order.orderCode}`
          },
          unit_amount: Math.round(order.total * 100)
        },
        quantity: 1
      }
    ],
    metadata: {
      orderId: order._id.toString(),
      orderCode: order.orderCode
    },
    success_url: `${process.env.CLIENT_URL}/payment?status=success&orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment?status=cancel&orderId=${order._id}`
  });

  await Payment.findOneAndUpdate(
    { orderId: order._id, method: "STRIPE" },
    { providerReference: session.id, providerPayload: session },
    { new: true }
  );

  return success(res, "Stripe session created", { url: session.url, sessionId: session.id });
};

const confirmStripeSession = async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return fail(res, "Stripe not configured", null, 400);
  }
  const { sessionId, orderId } = req.body;
  if (!sessionId || !orderId) {
    return fail(res, "Missing sessionId or orderId", null, 400);
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  if (order.customerId.toString() !== req.user._id.toString()) {
    return fail(res, "Forbidden", null, 403);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return fail(res, "Payment not completed", null, 400);
  }

  if (order.paymentStatus !== "PAID") {
    order.paymentStatus = "PAID";
    await order.save();
    await Payment.findOneAndUpdate(
      { orderId: order._id, method: "STRIPE" },
      { status: "SUCCESS", providerReference: sessionId, providerPayload: session }
    );
  }

  return success(res, "Stripe payment verified", { orderId: order._id });
};

const getStripeKey = async (req, res) => {
  if (!process.env.STRIPE_API_KEY) {
    return fail(res, "Stripe not configured", null, 400);
  }
  return success(res, "Stripe key", { key: process.env.STRIPE_API_KEY });
};

const getKhaltiConfig = () => {
  return {
    baseUrl: process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2/epayment",
    secretKey: process.env.KHALTI_SECRET_KEY,
    websiteUrl: process.env.WEBSITE_URL || process.env.CLIENT_URL
  };
};

const initiateKhalti = async (req, res) => {
  const { secretKey, baseUrl, websiteUrl } = getKhaltiConfig();
  if (!secretKey) {
    return fail(res, "Khalti not configured", null, 400);
  }
  const order = await ensureCustomerOrder(req, res);
  if (!order) return;
  if (order.paymentMethod !== "KHALTI") {
    return fail(res, "Order is not marked for Khalti payment", null, 400);
  }
  if (order.paymentStatus === "PAID") {
    return success(res, "Order already paid", { paymentUrl: "", pidx: "" });
  }

  const vendor = await Vendor.findById(order.vendorId);
  const payload = {
    return_url: `${process.env.CLIENT_URL}/payment?status=success&orderId=${order._id}`,
    website_url: websiteUrl,
    amount: Math.round(order.total * 100),
    purchase_order_id: order.orderCode,
    purchase_order_name: vendor?.restaurantName || "Khaja Express",
    customer_info: {
      name: req.user.name,
      email: req.user.email,
      phone: order.customerPhone
    }
  };

  let response;
  try {
    response = await axios.post(`${baseUrl}/initiate/`, payload, {
      headers: {
        Authorization: `Key ${secretKey}`,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return fail(res, "Khalti initiation failed", err.response?.data || null, 400);
  }

  const { pidx, payment_url } = response.data || {};
  if (!pidx || !payment_url) {
    return fail(res, "Khalti response invalid", response.data || null, 400);
  }

  await Payment.findOneAndUpdate(
    { orderId: order._id, method: "KHALTI" },
    { providerReference: pidx, providerPayload: response.data },
    { new: true }
  );

  return success(res, "Khalti initiated", { paymentUrl: payment_url, pidx });
};

const verifyKhalti = async (req, res) => {
  const { secretKey, baseUrl } = getKhaltiConfig();
  if (!secretKey) {
    return fail(res, "Khalti not configured", null, 400);
  }
  const { pidx, orderId } = req.body;
  if (!pidx || !orderId) {
    return fail(res, "Missing pidx or orderId", null, 400);
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  if (order.customerId.toString() !== req.user._id.toString()) {
    return fail(res, "Forbidden", null, 403);
  }

  let response;
  try {
    response = await axios.post(`${baseUrl}/lookup/`, { pidx }, {
      headers: {
        Authorization: `Key ${secretKey}`,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return fail(res, "Khalti verification failed", err.response?.data || null, 400);
  }

  const status = response.data?.status;
  if (status !== "Completed") {
    return fail(res, `Khalti status: ${status || "Unknown"}`, response.data || null, 400);
  }

  if (order.paymentStatus !== "PAID") {
    order.paymentStatus = "PAID";
    await order.save();
    await Payment.findOneAndUpdate(
      { orderId: order._id, method: "KHALTI" },
      { status: "SUCCESS", providerReference: pidx, providerPayload: response.data }
    );
  }

  return success(res, "Khalti payment verified", { orderId: order._id });
};

module.exports = {
  createStripeCheckoutSession,
  confirmStripeSession,
  getStripeKey,
  initiateKhalti,
  verifyKhalti
};
