require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("./config/db");
const User = require("./models/User");
const Vendor = require("./models/Vendor");
const Category = require("./models/Category");
const MenuItem = require("./models/MenuItem");
const Setting = require("./models/Setting");
const { toSlug } = require("./utils/slug");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Vendor.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Setting.deleteMany({})
  ]);

  const adminPass = await bcrypt.hash("Admin123", 10);
  await User.create({
    name: "Admin",
    email: "admin@foodhub.test",
    phone: "9800000000",
    passwordHash: adminPass,
    role: "ADMIN"
  });

  const categories = await Category.insertMany([
    { name: "Momo", slug: toSlug("Momo"), imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d" },
    { name: "Pizza", slug: toSlug("Pizza"), imageUrl: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366" },
    { name: "Biryani", slug: toSlug("Biryani"), imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d" },
    { name: "Burgers", slug: toSlug("Burgers"), imageUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071" }
  ]);

  const vendorOwners = await User.insertMany([
    {
      name: "Asha Lama",
      email: "asha@vendor.test",
      phone: "9811000001",
      passwordHash: await bcrypt.hash("Vendor123", 10),
      role: "VENDOR"
    },
    {
      name: "Ravi Thapa",
      email: "ravi@vendor.test",
      phone: "9811000002",
      passwordHash: await bcrypt.hash("Vendor123", 10),
      role: "VENDOR"
    }
  ]);

  const vendors = await Vendor.insertMany([
    {
      ownerUserId: vendorOwners[0]._id,
      restaurantName: "Momo Magic",
      slug: toSlug("Momo Magic"),
      description: "Steamed, fried, and jhol momo with fresh chutney.",
      address: "Lalitpur-14",
      city: "Lalitpur",
      coverImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
      logoUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2",
      cuisineTags: ["Nepali", "Momo"],
      openingHours: "9:00 AM - 10:00 PM",
      minOrder: 300,
      deliveryFee: 60,
      status: "APPROVED"
    },
    {
      ownerUserId: vendorOwners[1]._id,
      restaurantName: "Spice Route",
      slug: toSlug("Spice Route"),
      description: "Bold flavors, handcrafted curries and biryani.",
      address: "Kathmandu-5",
      city: "Kathmandu",
      coverImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      logoUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2",
      cuisineTags: ["Indian", "Biryani"],
      openingHours: "10:00 AM - 11:00 PM",
      minOrder: 400,
      deliveryFee: 80,
      status: "APPROVED"
    }
  ]);

  await MenuItem.insertMany([
    {
      vendorId: vendors[0]._id,
      name: "Buff Momo",
      description: "Juicy buffalo momo with sesame-tomato achar.",
      price: 220,
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
      categoryId: categories[0]._id,
      isAvailable: true,
      prepTimeMins: 15
    },
    {
      vendorId: vendors[0]._id,
      name: "Fried Chicken Momo",
      description: "Crispy momo tossed with spicy chutney.",
      price: 260,
      imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
      categoryId: categories[0]._id,
      isAvailable: true,
      prepTimeMins: 20
    },
    {
      vendorId: vendors[1]._id,
      name: "Chicken Biryani",
      description: "Aromatic basmati rice with slow-cooked chicken.",
      price: 450,
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      categoryId: categories[2]._id,
      isAvailable: true,
      prepTimeMins: 25
    },
    {
      vendorId: vendors[1]._id,
      name: "Paneer Butter Masala",
      description: "Creamy tomato gravy with soft paneer cubes.",
      price: 380,
      imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
      categoryId: categories[2]._id,
      isAvailable: true,
      prepTimeMins: 20
    }
  ]);

  await Setting.create({
    deliveryFeeDefault: 60,
    minOrderDefault: 300,
    supportEmail: "support@khajaexpress.local",
    isOpen: true,
    heroMessage: "Fresh. Fast. Cash on Delivery."
  });

  console.log("Seed complete");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
