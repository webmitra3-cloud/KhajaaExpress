const { z } = require("zod");
const Address = require("../models/Address");
const { success, fail } = require("../utils/response");

const addressSchema = z.object({
  label: z.string().optional(),
  fullAddress: z.string().min(3),
  city: z.string().optional(),
  landmark: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional()
});

const listAddresses = async (req, res) => {
  const addresses = await Address.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return success(res, "Addresses", addresses);
};

const createAddress = async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  if (parsed.data.isDefault) {
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  }
  const address = await Address.create({ userId: req.user._id, ...parsed.data });
  return success(res, "Address saved", address, 201);
};

const updateAddress = async (req, res) => {
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) {
    return fail(res, "Address not found", null, 404);
  }
  if (parsed.data.isDefault) {
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  }
  Object.assign(address, parsed.data);
  await address.save();
  return success(res, "Address updated", address);
};

const deleteAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) {
    return fail(res, "Address not found", null, 404);
  }
  await address.deleteOne();
  return success(res, "Address deleted", null);
};

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
