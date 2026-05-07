const { z } = require("zod");
const User = require("../models/User");
const { success, fail } = require("../utils/response");

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional()
});

const themeSchema = z.object({
  theme: z.enum(["light", "dark"])
});

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash");
  return success(res, "Profile", user);
};

const updateMe = async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const updates = parsed.data;
  if (updates.email) {
    const exists = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
    if (exists) {
      return fail(res, "Email already in use", null, 409);
    }
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }
  Object.assign(user, updates);
  await user.save();
  const cleanUser = user.toObject();
  delete cleanUser.passwordHash;
  return success(res, "Profile updated", cleanUser);
};

const updateTheme = async (req, res) => {
  const parsed = themeSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }
  user.theme = parsed.data.theme;
  await user.save();
  const cleanUser = user.toObject();
  delete cleanUser.passwordHash;
  return success(res, "Theme updated", cleanUser);
};

const listUsers = async (req, res) => {
  const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 });
  return success(res, "Users", users);
};

const setActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return fail(res, "User not found", null, 404);
  }
  user.isActive = req.body.isActive === true;
  await user.save();
  return success(res, "User updated", { id: user._id, isActive: user.isActive });
};

module.exports = { getMe, updateMe, updateTheme, listUsers, setActive };
