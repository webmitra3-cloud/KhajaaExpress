const { z } = require("zod");
const Payout = require("../models/Payout");
const Vendor = require("../models/Vendor");
const { success, fail } = require("../utils/response");
const { getOrCreateWallet, addTransaction } = require("../services/walletService");

const requestSchema = z.object({
  amount: z.number().min(1)
});

const requestPayout = async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const payout = await Payout.create({
    vendorId: vendor._id,
    amount: parsed.data.amount,
    status: "REQUESTED"
  });
  return success(res, "Payout requested", payout, 201);
};

const listVendorPayouts = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const payouts = await Payout.find({ vendorId: vendor._id }).sort({ createdAt: -1 });
  return success(res, "Payouts", payouts);
};

const listAdminPayouts = async (req, res) => {
  const payouts = await Payout.find({}).sort({ createdAt: -1 });
  return success(res, "Payouts", payouts);
};

const approvePayout = async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) {
    return fail(res, "Payout not found", null, 404);
  }
  payout.status = "APPROVED";
  payout.approvedAt = new Date();
  await payout.save();
  return success(res, "Payout approved", payout);
};

const markPaid = async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) {
    return fail(res, "Payout not found", null, 404);
  }
  payout.status = "PAID";
  payout.paidAt = new Date();
  await payout.save();

  const vendor = await Vendor.findById(payout.vendorId);
  if (vendor) {
    const wallet = await getOrCreateWallet({ ownerType: "VENDOR", ownerId: vendor.ownerUserId });
    await addTransaction({
      walletId: wallet._id,
      type: "PAYOUT",
      amount: -payout.amount,
      refPayoutId: payout._id,
      note: "Vendor payout"
    });
  }

  return success(res, "Payout marked as paid", payout);
};

module.exports = { requestPayout, listVendorPayouts, listAdminPayouts, approvePayout, markPaid };
