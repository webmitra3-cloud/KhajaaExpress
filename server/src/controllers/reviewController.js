const { z } = require("zod");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const { success, fail } = require("../utils/response");

const createSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  menuItemId: z.string().optional()
});

const createReview = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const { orderId, rating, comment, menuItemId } = parsed.data;
  const order = await Order.findById(orderId);
  if (!order) {
    return fail(res, "Order not found", null, 404);
  }
  if (order.customerId.toString() !== req.user._id.toString()) {
    return fail(res, "Forbidden", null, 403);
  }
  if (order.status !== "DELIVERED") {
    return fail(res, "Only delivered orders can be reviewed", null, 400);
  }
  const exists = await Review.findOne({
    customerId: req.user._id,
    vendorId: order.vendorId,
    menuItemId: menuItemId || null
  });
  if (exists) {
    return fail(res, "Review already submitted", null, 409);
  }

  if (menuItemId) {
    const inOrder = order.items.some((item) => item.menuItemId.toString() === menuItemId);
    if (!inOrder) {
      return fail(res, "Item not in order", null, 400);
    }
  }

  const review = await Review.create({
    customerId: req.user._id,
    vendorId: order.vendorId,
    menuItemId: menuItemId || null,
    rating,
    comment: comment || ""
  });

  return success(res, "Review submitted", review, 201);
};

const listReviewsByVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const reviews = await Review.find({ vendorId: vendor._id })
    .populate("customerId", "name")
    .sort({ createdAt: -1 });
  return success(res, "Reviews", reviews);
};

module.exports = { createReview, listReviewsByVendor };
