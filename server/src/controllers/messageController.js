const { z } = require("zod");
const Order = require("../models/Order");
const Message = require("../models/Message");
const { success, fail } = require("../utils/response");
const { getIO } = require("../socket");
const Vendor = require("../models/Vendor");

const createSchema = z.object({
  orderId: z.string().min(1),
  content: z.string().min(1)
});

const canAccessOrder = async (order, user) => {
  if (user.role === "ADMIN") return true;
  if (user.role === "CUSTOMER" && order.customerId.toString() === user._id.toString()) {
    return true;
  }
  if (user.role === "VENDOR") {
    const vendor = await Vendor.findOne({ ownerUserId: user._id });
    return vendor && order.vendorId.toString() === vendor._id.toString();
  }
  return false;
};

const listMessages = async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  const allowed = await canAccessOrder(order, req.user);
  if (!allowed) {
    return fail(res, "Forbidden", null, 403);
  }
  const messages = await Message.find({ orderId }).sort({ createdAt: 1 });
  return success(res, "Messages", messages);
};

const createMessage = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const { orderId, content } = parsed.data;
  const order = await Order.findById(orderId);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  const allowed = await canAccessOrder(order, req.user);
  if (!allowed) {
    return fail(res, "Forbidden", null, 403);
  }

  let receiverUserId = order.customerId;
  if (req.user.role === "CUSTOMER") {
    const vendor = await Vendor.findById(order.vendorId);
    receiverUserId = vendor ? vendor.ownerUserId : order.customerId;
  }

  const message = await Message.create({
    orderId,
    senderUserId: req.user._id,
    receiverUserId,
    senderRole: req.user.role,
    content
  });

  try {
    const io = getIO();
    io.to(`customer:${order.customerId}`).emit("message:new", message);
    io.to(`vendor:${order.vendorId}`).emit("message:new", message);
    io.to("admin:global").emit("message:new", message);
  } catch (err) {
    console.error("Socket emit failed", err.message);
  }

  return success(res, "Message sent", message, 201);
};

module.exports = { listMessages, createMessage };
