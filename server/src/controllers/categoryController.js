const { z } = require("zod");
const Category = require("../models/Category");
const { success, fail } = require("../utils/response");
const { toSlug } = require("../utils/slug");

const categorySchema = z.object({
  name: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional()
});

const listPublic = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return success(res, "Categories", categories);
};

const createCategory = async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const { name, imageUrl, isActive } = parsed.data;
  const slug = toSlug(name);
  const exists = await Category.findOne({ slug });
  if (exists) {
    return fail(res, "Category already exists", null, 409);
  }
  const category = await Category.create({ name, slug, imageUrl: imageUrl || "", isActive: isActive !== false });
  return success(res, "Category created", category, 201);
};

const updateCategory = async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.flatten(), 400);
  }
  const category = await Category.findById(req.params.id);
  if (!category) {
    return fail(res, "Category not found", null, 404);
  }
  if (parsed.data.name) {
    category.name = parsed.data.name;
    category.slug = toSlug(parsed.data.name);
  }
  if (parsed.data.imageUrl !== undefined) {
    category.imageUrl = parsed.data.imageUrl;
  }
  if (parsed.data.isActive !== undefined) {
    category.isActive = parsed.data.isActive;
  }
  await category.save();
  return success(res, "Category updated", category);
};

const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return fail(res, "Category not found", null, 404);
  }
  await category.deleteOne();
  return success(res, "Category deleted", null);
};

module.exports = { listPublic, createCategory, updateCategory, deleteCategory };
