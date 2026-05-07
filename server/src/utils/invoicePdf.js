const PDFDocument = require("pdfkit");

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(2)}`;

const drawRow = (doc, y, columns) => {
  const [item, qty, price, total] = columns;
  doc.text(item, 40, y, { width: 260 });
  doc.text(qty, 320, y, { width: 40, align: "center" });
  doc.text(price, 370, y, { width: 80, align: "right" });
  doc.text(total, 460, y, { width: 90, align: "right" });
};

const buildInvoicePdf = ({ order, vendor, customer, res }) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  doc.pipe(res);

  doc.fontSize(18).fillColor("#111827").text("Khaja Express Invoice");
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#6b7280");
  doc.text(`Invoice #: ${order.invoiceNumber || order.orderCode}`);
  doc.text(`Issued: ${new Date(order.invoiceIssuedAt).toLocaleString()}`);
  doc.text(`Order Status: ${order.status}`);
  doc.text(`Payment: ${order.paymentMethod}`);
  doc.moveDown();

  doc.fillColor("#111827").fontSize(11).text("Vendor");
  doc.fontSize(10).fillColor("#374151");
  doc.text(vendor?.restaurantName || "Restaurant");
  if (vendor?.address) doc.text(vendor.address);
  doc.moveDown();

  doc.fillColor("#111827").fontSize(11).text("Customer");
  doc.fontSize(10).fillColor("#374151");
  doc.text(customer?.name || "Customer");
  doc.text(order.customerPhone);
  doc.text(order.customerAddress);
  doc.moveDown();

  doc.fontSize(11).fillColor("#111827").text("Items");
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor("#6b7280");
  drawRow(doc, doc.y, ["Item", "Qty", "Price", "Total"]);
  doc.moveDown(0.6);
  doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#e5e7eb").stroke();
  doc.moveDown(0.4);

  doc.fontSize(9).fillColor("#111827");
  let y = doc.y;
  order.items.forEach((item) => {
    drawRow(doc, y, [
      item.nameSnapshot,
      `${item.qty}`,
      formatCurrency(item.priceSnapshot),
      formatCurrency(item.priceSnapshot * item.qty)
    ]);
    y += 16;
    if (y > 700) {
      doc.addPage();
      y = 40;
    }
  });
  doc.moveDown(1);

  doc.fontSize(10).fillColor("#111827");
  doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`);
  if (order.discount > 0) {
    doc.text(`Coupon (${order.couponCode || "COUPON"}): -${formatCurrency(order.discount)}`);
  }
  doc.text(`Delivery Fee: ${formatCurrency(order.deliveryFee)}`);
  doc.fontSize(12).text(`Total: ${formatCurrency(order.total)}`);

  doc.end();
};

module.exports = { buildInvoicePdf };
