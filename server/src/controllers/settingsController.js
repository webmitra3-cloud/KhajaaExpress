const { z } = require("zod");
const Setting = require("../models/Setting");
const { success, fail } = require("../utils/response");

const settingsSchema = z.object({
  deliveryFeeDefault: z.number().min(0).optional(),
  minOrderDefault: z.number().min(0).optional(),
  supportEmail: z.string().email().optional(),
  isOpen: z.boolean().optional(),
  heroMessage: z.string().min(3).optional()
});

const ensureSettings = async () => {
  let setting = await Setting.findOne({});
  if (!setting) {
    setting = await Setting.create({});
  }
  return setting;
};

const getPublicSettings = async (req, res) => {
  const setting = await ensureSettings();
  return success(res, "Settings", setting);
};

const getAdminSettings = async (req, res) => {
  const setting = await ensureSettings();
  return success(res, "Settings", setting);
};

const updateSettings = async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const setting = await ensureSettings();
  Object.assign(setting, parsed.data);
  await setting.save();
  return success(res, "Settings updated", setting);
};

module.exports = { getPublicSettings, getAdminSettings, updateSettings };
