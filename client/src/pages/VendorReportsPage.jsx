import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import api from "../lib/api";

const VendorReportsPage = () => {
  const [active, setActive] = useState("sales");
  const [range, setRange] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (fromDate) search.append("from", fromDate);
    if (toDate) search.append("to", toDate);
    return search.toString();
  }, [fromDate, toDate]);

  const detailedQuery = useQuery({
    queryKey: ["vendor", "reports", "sales-detailed", params],
    queryFn: async () => (await api.get(`/api/reports/vendor/sales-detailed?${params}`)).data.data
  });

  const totals = detailedQuery.data?.totals || { daily: 0, monthly: 0, yearly: 0 };
  const orders = detailedQuery.data?.orders || [];
  const expenses = detailedQuery.data?.expenses || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-slate-500">Generate export-ready reports for your restaurant.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Sales Overview</h2>
            <p className="text-sm text-slate-500">Daily, monthly, and yearly totals for your restaurant.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRange("daily")}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                range === "daily" ? "bg-primary-500 text-white" : "border border-orange-200 text-orange-600"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setRange("monthly")}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                range === "monthly" ? "bg-primary-500 text-white" : "border border-orange-200 text-orange-600"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setRange("yearly")}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                range === "yearly" ? "bg-primary-500 text-white" : "border border-orange-200 text-orange-600"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Daily Total</p>
            <p className="mt-2 text-lg font-semibold text-ink">Rs {totals.daily}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Monthly Total</p>
            <p className="mt-2 text-lg font-semibold text-ink">Rs {totals.monthly}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Yearly Total</p>
            <p className="mt-2 text-lg font-semibold text-ink">Rs {totals.yearly}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
          />
          <button
            onClick={async () => {
              const response = await api.get(`/api/reports/vendor/sales-pdf?${params}`, { responseType: "blob" });
              const blob = new Blob([response.data], { type: "application/pdf" });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "vendor-report.pdf";
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={async () => {
              const response = await api.get(`/api/reports/vendor/sales-csv?${params}`, { responseType: "blob" });
              const blob = new Blob([response.data], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "vendor-report.csv";
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Sales Table</h2>
          <span className="text-xs text-slate-500">Range: {fromDate || "Last 7 days"} - {toDate || "Today"}</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Items</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Coupon</th>
                <th className="px-3 py-2 font-medium">Discount</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600">{order.customerId?.name || "Customer"}</td>
                  <td className="px-3 py-2 text-slate-600">{order.orderCode}</td>
                  <td className="px-3 py-2 text-slate-600">{order.invoiceNumber || order.orderCode}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {order.items?.map((i) => `${i.nameSnapshot} x${i.qty}`).join(", ")}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{order.status}</td>
                  <td className="px-3 py-2 text-slate-600">{order.couponCode || "-"}</td>
                  <td className="px-3 py-2 text-slate-600">Rs {order.discount || 0}</td>
                  <td className="px-3 py-2 text-slate-600">Rs {order.total}</td>
                  <td className="px-3 py-2 text-slate-600">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!detailedQuery.isLoading && orders.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={9}>
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Expense Table</h2>
          <span className="text-xs text-slate-500">Expenses for selected range</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{expense.category}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {expense.amount}</td>
                  <td className="px-4 py-3 text-slate-500">{expense.note || "-"}</td>
                </tr>
              ))}
              {!detailedQuery.isLoading && expenses.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No expenses available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default VendorReportsPage;
