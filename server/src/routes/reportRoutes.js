const express = require("express");
const {
  vendorSalesReport,
  vendorExpenseReport,
  adminRevenueReport,
  vendorSalesDetailed,
  vendorSalesPdf,
  vendorSalesCsv,
  adminVendorSalesSummary,
  adminVendorSalesPdf,
  adminVendorSalesCsv
} = require("../controllers/reportController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/vendor/sales", protect, requireRole("VENDOR"), vendorSalesReport);
router.get("/vendor/expenses", protect, requireRole("VENDOR"), vendorExpenseReport);
router.get("/vendor/sales-detailed", protect, requireRole("VENDOR"), vendorSalesDetailed);
router.get("/vendor/sales-pdf", protect, requireRole("VENDOR"), vendorSalesPdf);
router.get("/vendor/sales-csv", protect, requireRole("VENDOR"), vendorSalesCsv);
router.get("/admin/revenue", protect, requireRole("ADMIN"), adminRevenueReport);
router.get("/admin/vendor-sales", protect, requireRole("ADMIN"), adminVendorSalesSummary);
router.get("/admin/vendor-sales-pdf", protect, requireRole("ADMIN"), adminVendorSalesPdf);
router.get("/admin/vendor-sales-csv", protect, requireRole("ADMIN"), adminVendorSalesCsv);

module.exports = router;
