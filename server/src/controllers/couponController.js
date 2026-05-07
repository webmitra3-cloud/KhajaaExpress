const { z } = require("zod");
const Coupon = require("../models/Coupon");
const { success, fail } = require("../utils/response");

const couponSchema = z.object({
  code: z.string().min(3),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().min(1),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  validFrom: z.string(),
  validTo: z.string(),
  scope: z.enum(["GLOBAL", "VENDOR"]).optional(),
  vendorId: z.string().optional()
});

const listPublic = async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ validFrom: { $lte: now }, validTo: { $gte: now } });
  return success(res, "Coupons", coupons);
};

const listAll = async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  return success(res, "Coupons", coupons);
};

const createCoupon = async (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const coupon = await Coupon.create({
    ...parsed.data,
    validFrom: new Date(parsed.data.validFrom),
    validTo: new Date(parsed.data.validTo)
  });
  return success(res, "Coupon created", coupon, 201);
};

const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return fail(res, "Coupon not found", null, 404);
  }
  await coupon.deleteOne();
  return success(res, "Coupon deleted", null);
};

module.exports = { listPublic, listAll, createCoupon, deleteCoupon };
