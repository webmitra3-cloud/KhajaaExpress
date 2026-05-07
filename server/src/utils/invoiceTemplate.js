const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(2)}`;

const buildInvoiceHtml = ({ order, vendor, customer }) => {
  const itemsRows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.nameSnapshot}</td>
          <td style="text-align:center;">${item.qty}</td>
          <td style="text-align:right;">${formatCurrency(item.priceSnapshot)}</td>
          <td style="text-align:right;">${formatCurrency(item.priceSnapshot * item.qty)}</td>
        </tr>
      `
    )
    .join("");

  const discountRow =
    order.discount > 0
      ? `
        <tr>
          <td>Discount (${order.couponCode || "COUPON"})</td>
          <td></td>
          <td></td>
          <td style="text-align:right;">- ${formatCurrency(order.discount)}</td>
        </tr>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice ${order.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; color: #1f2937; padding: 24px; }
        .invoice { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb; }
        h1 { font-size: 22px; margin: 0 0 8px; }
        .muted { color: #6b7280; font-size: 12px; }
        .section { margin-top: 18px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        th { text-align: left; background: #f9fafb; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
        .total { font-size: 16px; font-weight: bold; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #fff7ed; color: #c2410c; font-size: 11px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <h1>Khaja Express Invoice</h1>
        <div class="muted">Invoice #${order.invoiceNumber}</div>
        <div class="muted">Issued: ${new Date(order.invoiceIssuedAt).toLocaleString()}</div>

        <div class="section grid">
          <div>
            <div class="muted">Vendor</div>
            <div>${vendor?.restaurantName || "Restaurant"}</div>
            <div class="muted">${vendor?.address || ""}</div>
          </div>
          <div>
            <div class="muted">Customer</div>
            <div>${customer?.name || "Customer"}</div>
            <div class="muted">${order.customerPhone}</div>
            <div class="muted">${order.customerAddress}</div>
          </div>
        </div>

        <div class="section">
          <span class="badge">${order.paymentMethod}</span>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              ${discountRow}
              <tr>
                <td>Delivery Fee</td>
                <td></td>
                <td></td>
                <td style="text-align:right;">${formatCurrency(order.deliveryFee)}</td>
              </tr>
              <tr>
                <td class="total">Grand Total</td>
                <td></td>
                <td></td>
                <td class="total" style="text-align:right;">${formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { buildInvoiceHtml };
