const { z } = require("zod");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const MenuItem = require("../models/MenuItem");
const Payment = require("../models/Payment");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const { getOrCreateWallet, addTransaction } = require("../services/walletService");
const { success, fail } = require("../utils/response");
const { makeOrderCode } = require("../utils/orderCode");
const { getIO } = require("../socket");
const { buildInvoicePdf } = require("../utils/invoicePdf");

const placeOrderSchema = z.object({
  vendorId: z.string().min(1),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      qty: z.number().min(1),
      selectedVariant: z.object({
        name: z.string().optional(),
        priceDelta: z.number().optional()
      }).optional(),
      selectedAddons: z.array(z.object({
        name: z.string().optional(),
        price: z.number().optional()
      })).optional(),
      tastePreferences: z.object({
        spiceLevel: z.string().optional(),
        saltLevel: z.string().optional(),
        sweetLevel: z.string().optional(),
        drinkSugar: z.string().optional(),
        drinkMilk: z.string().optional(),
        drinkStrength: z.string().optional(),
        remarks: z.string().optional()
      }).optional()
    })
  ).min(1),
  customerAddress: z.string().min(3),
  customerCity: z.string().optional(),
  customerLandmark: z.string().optional(),
  customerLocation: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
  customerPhone: z.string().min(7),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "STRIPE", "KHALTI", "WALLET"]).optional(),
  couponCode: z.string().optional(),
  scheduledFor: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "REJECTED_BY_VENDOR",
    "CANCELLED_BY_ADMIN"
  ])
});

const placeOrder = async (req, res) => {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const { vendorId, items, customerAddress, customerCity, customerLandmark, customerLocation, customerPhone, notes, paymentMethod, couponCode, scheduledFor } = parsed.data;
  const vendor = await Vendor.findById(vendorId);
  if (!vendor || vendor.status !== "APPROVED") {
    return fail(res, "Vendor not available", null, 400);
  }

  const menuItems = await MenuItem.find({ _id: { $in: items.map((i) => i.menuItemId) } });
  if (menuItems.length !== items.length) {
    return fail(res, "Some items are not available", null, 400);
  }
  if (menuItems.some((menuItem) => menuItem.vendorId.toString() !== vendor._id.toString())) {
    return fail(res, "Items must belong to the selected vendor", null, 400);
  }

  const orderItems = items.map((item) => {
    const menuItem = menuItems.find((m) => m._id.toString() === item.menuItemId);
    const variantDelta = item.selectedVariant?.priceDelta || 0;
    const addonsTotal = (item.selectedAddons || []).reduce((sum, addon) => sum + (addon.price || 0), 0);
    const priceSnapshot = menuItem.price + variantDelta + addonsTotal;
    return {
      menuItemId: menuItem._id,
      nameSnapshot: menuItem.name,
      priceSnapshot,
      qty: item.qty,
      selectedVariant: item.selectedVariant || {},
      selectedAddons: item.selectedAddons || [],
      tastePreferences: item.tastePreferences || {}
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.priceSnapshot * i.qty, 0);
  const deliveryFee = vendor.deliveryFee || 0;
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    const now = new Date();
    if (coupon && coupon.validFrom <= now && coupon.validTo >= now) {
      if (coupon.scope === "VENDOR" && coupon.vendorId?.toString() !== vendor._id.toString()) {
        return fail(res, "Coupon not valid for this vendor", null, 400);
      }
      if (subtotal >= coupon.minOrder) {
        if (coupon.type === "PERCENT") {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.value;
        }
      }
    }
  }
  const total = subtotal - discount + deliveryFee;
  const orderCode = makeOrderCode();
  const commissionRate = vendor.commissionRate || 0.1;
  const platformFee = Number(((subtotal - discount) * commissionRate).toFixed(2));
  const vendorPayout = Number(((subtotal - discount) - platformFee).toFixed(2));

  const resolvedPayment = paymentMethod || "COD";
  let paymentStatus = resolvedPayment === "COD" ? "UNPAID" : "PENDING";

  if (resolvedPayment === "WALLET") {
    const wallet = await getOrCreateWallet({ ownerType: "USER", ownerId: req.user._id });
    if (wallet.balance < total) {
      return fail(res, "Insufficient wallet balance", null, 400);
    }
    await addTransaction({
      walletId: wallet._id,
      type: "ADJUSTMENT",
      amount: -total,
      note: "Order payment"
    });
    paymentStatus = "PAID";
  }

  const order = await Order.create({
    orderCode,
    customerId: req.user._id,
    vendorId: vendor._id,
    items: orderItems,
    subtotal,
    discount,
    deliveryFee,
    total,
    platformFee,
    vendorPayout,
    commissionRate,
    adminCommission: platformFee,
    couponCode: couponCode || "",
    paymentMethod: resolvedPayment,
    paymentStatus,
    status: "PLACED",
    customerAddress,
    customerCity: customerCity || "",
    customerLandmark: customerLandmark || "",
    customerPhone,
    notes: notes || "",
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    customerLocation: customerLocation || {},
    timeline: [{ status: "PLACED", at: new Date() }]
  });

  await Payment.create({
    orderId: order._id,
    method: resolvedPayment,
    amount: total,
    status: paymentStatus === "PAID" ? "SUCCESS" : "PENDING"
  });

  try {
    const io = getIO();
    io.to(`vendor:${vendor._id}`).emit("order:placed", order);
    io.to("admin:global").emit("order:placed", order);
  } catch (err) {
    console.error("Socket emit failed", err.message);
  }

  return success(res, "Order placed", order, 201);
};

const getMyOrders = async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
  return success(res, "My orders", orders);
};

const getVendorOrders = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const orders = await Order.find({ vendorId: vendor._id }).sort({ createdAt: -1 });
  return success(res, "Vendor orders", orders);
};

const getAdminOrders = async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  return success(res, "All orders", orders);
};

const updateStatus = async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }

  if (req.user.role === "VENDOR") {
    const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
    if (!vendor || order.vendorId.toString() !== vendor._id.toString()) {
      return fail(res, "Forbidden", null, 403);
    }
    if (parsed.data.status === "CANCELLED_BY_ADMIN") {
      return fail(res, "Only admin can cancel", null, 403);
    }
  }

  order.status = parsed.data.status;
  order.timeline.push({ status: parsed.data.status, at: new Date() });

  if (parsed.data.status === "DELIVERED" && !order.isSettled) {
    if (order.paymentMethod === "COD") {
      order.paymentStatus = "PAID";
    }
    const adminUser = await User.findOne({ role: "ADMIN" });
    const adminWallet = adminUser
      ? await getOrCreateWallet({ ownerType: "ADMIN", ownerId: adminUser._id })
      : null;
    const vendor = await Vendor.findById(order.vendorId);
    if (vendor && adminWallet) {
      const vendorWallet = await getOrCreateWallet({ ownerType: "VENDOR", ownerId: vendor.ownerUserId });
      await addTransaction({
        walletId: adminWallet._id,
        type: "COMMISSION",
        amount: order.platformFee,
        refOrderId: order._id,
        note: "Order commission"
      });
      await addTransaction({
        walletId: vendorWallet._id,
        type: "EARNING",
        amount: order.vendorPayout,
        refOrderId: order._id,
        note: "Vendor earning"
      });
    }
    order.isSettled = true;
  }

  if (["CANCELLED_BY_ADMIN", "REJECTED_BY_VENDOR"].includes(parsed.data.status)) {
    if (order.paymentStatus === "PAID") {
      order.paymentStatus = "REFUNDED";
      const customerWallet = await getOrCreateWallet({ ownerType: "USER", ownerId: order.customerId });
      await addTransaction({
        walletId: customerWallet._id,
        type: "REFUND",
        amount: order.total,
        refOrderId: order._id,
        note: "Order refund"
      });
    }
  }

  await order.save();

  try {
    const io = getIO();
    io.to(`customer:${order.customerId}`).emit("order:statusUpdated", order);
    io.to("admin:global").emit("order:statusUpdated", order);
  } catch (err) {
    console.error("Socket emit failed", err.message);
  }

  return success(res, "Order status updated", order);
};

const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  if (order.customerId.toString() !== req.user._id.toString()) {
    return fail(res, "Forbidden", null, 403);
  }
  if (order.status !== "PLACED") {
    return fail(res, "Only placed orders can be cancelled", null, 400);
  }
  order.status = "CANCELLED_BY_USER";
  order.cancelReason = req.body?.reason || "";
  order.timeline.push({ status: "CANCELLED_BY_USER", at: new Date() });
  await order.save();

  try {
    const io = getIO();
    io.to(`vendor:${order.vendorId}`).emit("order:statusUpdated", order);
    io.to("admin:global").emit("order:statusUpdated", order);
  } catch (err) {
    console.error("Socket emit failed", err.message);
  }

  return success(res, "Order cancelled", order);
};

const getInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customerId", "name phone")
    .populate("vendorId", "restaurantName address");
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  const isCustomer = req.user.role === "CUSTOMER" && order.customerId?._id.toString() === req.user._id.toString();
  const isVendor = req.user.role === "VENDOR";
  const isAdmin = req.user.role === "ADMIN";

  if (isVendor) {
    const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
    if (!vendor || order.vendorId._id.toString() !== vendor._id.toString()) {
      return fail(res, "Forbidden", null, 403);
    }
  }
  if (!isAdmin && !isCustomer && !isVendor) {
    return fail(res, "Forbidden", null, 403);
  }
  if (order.paymentStatus !== "PAID" && order.status !== "DELIVERED") {
    return fail(res, "Invoice available after payment", null, 400);
  }

  if (!order.invoiceNumber) {
    order.invoiceNumber = order.orderCode;
  }
  if (!order.invoiceIssuedAt) {
    order.invoiceIssuedAt = new Date();
  }
  await order.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderCode}.pdf`
  );
  buildInvoicePdf({
    order,
    vendor: order.vendorId,
    customer: order.customerId,
    res
  });
  return;
};

module.exports = {
  placeOrder,
  getMyOrders,
  getVendorOrders,
  getAdminOrders,
  updateStatus,
  cancelOrder,
  getInvoice
};
