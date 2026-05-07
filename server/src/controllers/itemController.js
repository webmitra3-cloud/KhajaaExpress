const { z } = require("zod");
const MenuItem = require("../models/MenuItem");
const Vendor = require("../models/Vendor");
const { success, fail } = require("../utils/response");

const itemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  isAvailable: z.boolean().optional(),
  prepTimeMins: z.number().min(5).optional(),
  isVeg: z.boolean().optional(),
  variants: z.array(z.object({ name: z.string(), priceDelta: z.number().optional() })).optional(),
  addons: z.array(z.object({ name: z.string(), price: z.number().optional() })).optional()
});

const createItem = async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const item = await MenuItem.create({
    vendorId: vendor._id,
    ...parsed.data
  });
  return success(res, "Menu item created", item, 201);
};

const updateItem = async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    return fail(res, "Item not found", null, 404);
  }
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor || item.vendorId.toString() !== vendor._id.toString()) {
    return fail(res, "Forbidden", null, 403);
  }
  Object.assign(item, parsed.data);
  await item.save();
  return success(res, "Menu item updated", item);
};

const deleteItem = async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    return fail(res, "Item not found", null, 404);
  }
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor || item.vendorId.toString() !== vendor._id.toString()) {
    return fail(res, "Forbidden", null, 403);
  }
  await item.deleteOne();
  return success(res, "Menu item deleted", null);
};

const getVendorItems = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const items = await MenuItem.find({ vendorId: vendor._id }).sort({ createdAt: -1 });
  return success(res, "Vendor items", items);
};

const getPublicItems = async (req, res) => {
  const { vendorSlug, search, isVeg, minPrice, maxPrice } = req.query;
  if (!vendorSlug) {
    return fail(res, "vendorSlug is required", null, 400);
  }
  const vendor = await Vendor.findOne({ slug: vendorSlug, status: "APPROVED" });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const filter = { vendorId: vendor._id, isAvailable: true };
  if (search) {
    filter.name = new RegExp(search, "i");
  }
  if (isVeg === "true") {
    filter.isVeg = true;
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  const items = await MenuItem.find(filter).sort({ createdAt: -1 });
  return success(res, "Items", items);
};

module.exports = { createItem, updateItem, deleteItem, getVendorItems, getPublicItems };
