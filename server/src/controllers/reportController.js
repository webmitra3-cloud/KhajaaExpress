const PDFDocument = require("pdfkit");
const Order = require("../models/Order");
const Expense = require("../models/Expense");
const Vendor = require("../models/Vendor");
const { success, fail } = require("../utils/response");

const parseRange = (req) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  return { from, to };
};

const vendorSalesReport = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const { from, to } = parseRange(req);
  const orders = await Order.find({
    vendorId: vendor._id,
    createdAt: { $gte: from, $lte: to }
  });
  const gross = orders.reduce((sum, o) => sum + o.total, 0);
  const net = orders.reduce((sum, o) => sum + (o.vendorPayout || 0), 0);
  return success(res, "Sales report", { from, to, orders, gross, net });
};

const vendorExpenseReport = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const { from, to } = parseRange(req);
  const expenses = await Expense.find({
    vendorId: vendor._id,
    date: { $gte: from, $lte: to }
  });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return success(res, "Expense report", { from, to, expenses, total });
};

const adminRevenueReport = async (req, res) => {
  const { from, to } = parseRange(req);
  const orders = await Order.find({ createdAt: { $gte: from, $lte: to } });
  const commission = orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
  return success(res, "Revenue report", { from, to, ordersCount: orders.length, commission });
};

const adminVendorSalesSummary = async (req, res) => {
  const { from, to } = parseRange(req);
  const summary = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: "$vendorId",
        totalSales: { $sum: "$total" },
        ordersCount: { $sum: 1 },
        platformFee: { $sum: "$platformFee" },
        vendorPayout: { $sum: "$vendorPayout" }
      }
    }
  ]);
  const vendorIds = summary.map((row) => row._id);
  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select("restaurantName").lean();
  const vendorMap = vendors.reduce((acc, vendor) => {
    acc[vendor._id.toString()] = vendor.restaurantName;
    return acc;
  }, {});

  const rows = summary.map((row) => ({
    vendorId: row._id,
    vendorName: vendorMap[row._id.toString()] || "Vendor",
    totalSales: row.totalSales,
    ordersCount: row.ordersCount,
    platformFee: row.platformFee,
    vendorPayout: row.vendorPayout
  }));
  const totalSales = rows.reduce((sum, row) => sum + row.totalSales, 0);
  return success(res, "Vendor sales summary", { from, to, totalSales, rows });
};

const adminVendorSalesPdf = async (req, res) => {
  const { from, to } = parseRange(req);
  const summary = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: "$vendorId",
        totalSales: { $sum: "$total" },
        ordersCount: { $sum: 1 },
        platformFee: { $sum: "$platformFee" },
        vendorPayout: { $sum: "$vendorPayout" }
      }
    }
  ]);
  const vendorIds = summary.map((row) => row._id);
  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select("restaurantName").lean();
  const vendorMap = vendors.reduce((acc, vendor) => {
    acc[vendor._id.toString()] = vendor.restaurantName;
    return acc;
  }, {});

  const rows = summary.map((row) => ({
    vendorName: vendorMap[row._id.toString()] || "Vendor",
    ordersCount: row.ordersCount,
    totalSales: row.totalSales,
    platformFee: row.platformFee,
    vendorPayout: row.vendorPayout
  }));

  const doc = new PDFDocument({ margin: 30, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=admin-vendor-sales.pdf");
  doc.pipe(res);

  doc.fontSize(18).fillColor("#111827").text("Khaja Express - Vendor Sales Report");
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#6b7280");
  doc.text(`From: ${from.toLocaleDateString()}  To: ${to.toLocaleDateString()}`);
  doc.moveDown();

  const columns = [
    { label: "Vendor", width: 200 },
    { label: "Orders", width: 60, align: "right" },
    { label: "Total Sales", width: 90, align: "right" },
    { label: "Platform Fee", width: 90, align: "right" },
    { label: "Vendor Payout", width: 90, align: "right" }
  ];

  const drawTableHeader = (startY) => {
    doc.fontSize(9).fillColor("#111827");
    let x = 30;
    columns.forEach((col) => {
      doc.text(col.label, x + 2, startY, { width: col.width - 4, align: col.align || "left" });
      x += col.width;
    });
    doc.rect(30, startY - 2, columns.reduce((sum, c) => sum + c.width, 0), 14).strokeColor("#e5e7eb").stroke();
  };

  const drawTableRow = (startY, values) => {
    let x = 30;
    let maxHeight = 14;
    columns.forEach((col, idx) => {
      const text = values[idx] ?? "";
      const height = doc.heightOfString(text, { width: col.width - 4 });
      maxHeight = Math.max(maxHeight, height + 4);
      x += col.width;
    });
    x = 30;
    columns.forEach((col, idx) => {
      const text = values[idx] ?? "";
      doc.text(text, x + 2, startY + 2, { width: col.width - 4, align: col.align || "left" });
      doc.rect(x, startY, col.width, maxHeight).strokeColor("#e5e7eb").stroke();
      x += col.width;
    });
    return maxHeight;
  };

  let y = doc.y;
  drawTableHeader(y);
  y += 18;
  rows.forEach((row) => {
    const height = drawTableRow(y, [
      row.vendorName,
      `${row.ordersCount}`,
      `Rs ${Number(row.totalSales || 0).toFixed(2)}`,
      `Rs ${Number(row.platformFee || 0).toFixed(2)}`,
      `Rs ${Number(row.vendorPayout || 0).toFixed(2)}`
    ]);
    y += height;
    if (y > 720) {
      doc.addPage();
      y = 40;
      drawTableHeader(y);
      y += 18;
    }
  });

  doc.end();
};

const adminVendorSalesCsv = async (req, res) => {
  const { from, to } = parseRange(req);
  const summary = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: "$vendorId",
        totalSales: { $sum: "$total" },
        ordersCount: { $sum: 1 },
        platformFee: { $sum: "$platformFee" },
        vendorPayout: { $sum: "$vendorPayout" }
      }
    }
  ]);
  const vendorIds = summary.map((row) => row._id);
  const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select("restaurantName").lean();
  const vendorMap = vendors.reduce((acc, vendor) => {
    acc[vendor._id.toString()] = vendor.restaurantName;
    return acc;
  }, {});

  const lines = [];
  lines.push(`From,${from.toISOString()},To,${to.toISOString()}`);
  lines.push("Vendor,Orders,Total Sales,Platform Fee,Vendor Payout");
  summary.forEach((row) => {
    lines.push([
      `"${vendorMap[row._id.toString()] || "Vendor"}"`,
      row.ordersCount,
      Number(row.totalSales || 0).toFixed(2),
      Number(row.platformFee || 0).toFixed(2),
      Number(row.vendorPayout || 0).toFixed(2)
    ].join(","));
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=admin-vendor-sales.csv");
  return res.status(200).send(lines.join("\n"));
};

const getVendorOrdersWithRange = async (vendorId, from, to) => {
  return Order.find({
    vendorId,
    createdAt: { $gte: from, $lte: to }
  })
    .populate("customerId", "name")
    .populate("vendorId", "restaurantName")
    .sort({ createdAt: -1 });
};

const getTotals = async (vendorId) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [daily, monthly, yearly] = await Promise.all([
    Order.find({ vendorId, createdAt: { $gte: startOfDay, $lte: now } }),
    Order.find({ vendorId, createdAt: { $gte: startOfMonth, $lte: now } }),
    Order.find({ vendorId, createdAt: { $gte: startOfYear, $lte: now } })
  ]);

  const sum = (orders) => orders.reduce((acc, order) => acc + order.total, 0);
  return {
    daily: sum(daily),
    monthly: sum(monthly),
    yearly: sum(yearly)
  };
};

const vendorSalesDetailed = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const { from, to } = parseRange(req);
  const orders = await getVendorOrdersWithRange(vendor._id, from, to);
  const expenses = await Expense.find({
    vendorId: vendor._id,
    date: { $gte: from, $lte: to }
  }).sort({ date: -1 });
  const totals = await getTotals(vendor._id);
  return success(res, "Detailed report", {
    from,
    to,
    totals,
    orders,
    expenses
  });
};

const vendorSalesPdf = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const { from, to } = parseRange(req);
  const orders = await getVendorOrdersWithRange(vendor._id, from, to);
  const expenses = await Expense.find({
    vendorId: vendor._id,
    date: { $gte: from, $lte: to }
  }).sort({ date: -1 });
  const totals = await getTotals(vendor._id);

  const doc = new PDFDocument({ margin: 30, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=vendor-report-${vendor._id}.pdf`
  );
  doc.pipe(res);

  doc.fontSize(18).text("Khaja Express - Sales Report", { align: "left" });
  doc.fontSize(10).fillColor("#6b7280").text(`Vendor: ${vendor.restaurantName}`);
  doc.text(`From: ${from.toLocaleDateString()}  To: ${to.toLocaleDateString()}`);
  doc.moveDown();

  doc.fillColor("#111827").fontSize(12).text("Totals");
  doc.fontSize(10).text(`Daily: Rs ${totals.daily.toFixed(2)}`);
  doc.text(`Monthly: Rs ${totals.monthly.toFixed(2)}`);
  doc.text(`Yearly: Rs ${totals.yearly.toFixed(2)}`);
  doc.moveDown();

  const salesColumns = [
    { label: "Order", width: 48 },
    { label: "Invoice", width: 50 },
    { label: "Customer", width: 60 },
    { label: "Items", width: 140 },
    { label: "Status", width: 45 },
    { label: "Coupon", width: 45 },
    { label: "Discount", width: 52, align: "right" },
    { label: "Total", width: 50, align: "right" },
    { label: "Date", width: 55 }
  ];

  const drawTableHeader = (startY, columns) => {
    doc.fontSize(7.5).fillColor("#111827");
    let x = 30;
    columns.forEach((col) => {
      doc.text(col.label, x + 2, startY, { width: col.width - 4, align: col.align || "left" });
      x += col.width;
    });
    doc.rect(30, startY - 2, columns.reduce((sum, c) => sum + c.width, 0), 14).strokeColor("#e5e7eb").stroke();
  };

  const drawTableRow = (startY, columns, values) => {
    let x = 30;
    let maxHeight = 14;
    columns.forEach((col, idx) => {
      const text = values[idx] ?? "";
      const height = doc.heightOfString(text, { width: col.width - 4 });
      maxHeight = Math.max(maxHeight, height + 4);
      x += col.width;
    });

    x = 30;
    columns.forEach((col, idx) => {
      const text = values[idx] ?? "";
      doc.text(text, x + 2, startY + 2, { width: col.width - 4, align: col.align || "left" });
      doc.rect(x, startY, col.width, maxHeight).strokeColor("#e5e7eb").stroke();
      x += col.width;
    });
    return maxHeight;
  };

  doc.fontSize(12).fillColor("#111827").text("Sales Table");
  doc.moveDown(0.6);
  let y = doc.y;
  drawTableHeader(y, salesColumns);
  y += 18;

  orders.forEach((order) => {
    const itemsLabel = order.items.map((i) => `${i.nameSnapshot} x${i.qty}`).join(", ");
    const rowHeight = drawTableRow(y, salesColumns, [
      order.orderCode,
      order.invoiceNumber || order.orderCode,
      order.customerId?.name || "Customer",
      itemsLabel,
      order.status,
      order.couponCode || "-",
      `Rs ${Number(order.discount || 0).toFixed(2)}`,
      `Rs ${Number(order.total || 0).toFixed(2)}`,
      new Date(order.createdAt).toLocaleDateString()
    ]);
    y += rowHeight;
    if (y > 720) {
      doc.addPage();
      y = 40;
      drawTableHeader(y, salesColumns);
      y += 18;
    }
  });

  doc.moveDown();
  doc.moveDown();
  doc.fontSize(12).fillColor("#111827").text("Expenses Table");
  doc.moveDown(0.5);
  const expenseColumns = [
    { label: "Date", width: 80 },
    { label: "Category", width: 140 },
    { label: "Amount", width: 80, align: "right" },
    { label: "Note", width: 235 }
  ];
  let expenseY = doc.y;
  drawTableHeader(expenseY, expenseColumns);
  expenseY += 18;
  expenses.forEach((expense) => {
    const rowHeight = drawTableRow(expenseY, expenseColumns, [
      new Date(expense.date).toLocaleDateString(),
      expense.category,
      `Rs ${Number(expense.amount || 0).toFixed(2)}`,
      expense.note || "-"
    ]);
    expenseY += rowHeight;
    if (expenseY > 720) {
      doc.addPage();
      expenseY = 40;
      drawTableHeader(expenseY, expenseColumns);
      expenseY += 18;
    }
  });

  doc.end();
};

const vendorSalesCsv = async (req, res) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  if (!vendor) {
    return fail(res, "Vendor not found", null, 404);
  }
  const { from, to } = parseRange(req);
  const orders = await getVendorOrdersWithRange(vendor._id, from, to);
  const expenses = await Expense.find({
    vendorId: vendor._id,
    date: { $gte: from, $lte: to }
  }).sort({ date: -1 });

  const lines = [];
  lines.push(`Vendor,${vendor.restaurantName}`);
  lines.push(`From,${from.toISOString()},To,${to.toISOString()}`);
  lines.push("");
  lines.push("Order ID,Invoice,Customer,Items,Status,Coupon,Discount,Total,Date");
  orders.forEach((order) => {
    const itemsLabel = order.items.map((i) => `${i.nameSnapshot} x${i.qty}`).join(" | ");
    lines.push([
      order.orderCode,
      order.invoiceNumber || order.orderCode,
      order.customerId?.name || "Customer",
      `"${itemsLabel}"`,
      order.status,
      order.couponCode || "-",
      Number(order.discount || 0).toFixed(2),
      Number(order.total || 0).toFixed(2),
      new Date(order.createdAt).toISOString()
    ].join(","));
  });
  lines.push("");
  lines.push("Expenses Table");
  lines.push("Date,Category,Amount,Note");
  expenses.forEach((expense) => {
    lines.push([
      new Date(expense.date).toISOString(),
      expense.category,
      Number(expense.amount || 0).toFixed(2),
      `"${expense.note || "-"}"`
    ].join(","));
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=vendor-report-${vendor._id}.csv`
  );
  return res.status(200).send(lines.join("\n"));
};

module.exports = {
  vendorSalesReport,
  vendorExpenseReport,
  adminRevenueReport,
  vendorSalesDetailed,
  vendorSalesPdf,
  vendorSalesCsv,
  adminVendorSalesSummary,
  adminVendorSalesPdf,
  adminVendorSalesCsv
};
