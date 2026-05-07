import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminReportsPage = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (fromDate) search.append("from", fromDate);
    if (toDate) search.append("to", toDate);
    return search.toString();
  }, [fromDate, toDate]);

  const reportQuery = useQuery({
    queryKey: ["admin", "reports", "revenue", params],
    queryFn: async () => (await api.get(`/api/reports/admin/revenue?${params}`)).data.data
  });

  const vendorSalesQuery = useQuery({
    queryKey: ["admin", "reports", "vendor-sales", params],
    queryFn: async () => (await api.get(`/api/reports/admin/vendor-sales?${params}`)).data.data
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-slate-500">Vendor-wise and total sales overview.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Total Sales Summary</h2>
            <p className="text-sm text-slate-500">Filter by date to compare vendor performance.</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                const response = await api.get(`/api/reports/admin/vendor-sales-pdf?${params}`, { responseType: "blob" });
                const blob = new Blob([response.data], { type: "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "admin-vendor-sales.pdf";
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              }}
              className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
            >
              Export PDF
            </button>
            <button
              onClick={async () => {
                const response = await api.get(`/api/reports/admin/vendor-sales-csv?${params}`, { responseType: "blob" });
                const blob = new Blob([response.data], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "admin-vendor-sales.csv";
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              }}
              className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Total Orders</p>
            <p className="mt-2 text-xl font-semibold text-ink">{reportQuery.data?.ordersCount || 0}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Total Commission</p>
            <p className="mt-2 text-xl font-semibold text-ink">Rs {Math.round(reportQuery.data?.commission || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Total Sales</p>
            <p className="mt-2 text-xl font-semibold text-ink">Rs {Math.round(vendorSalesQuery.data?.totalSales || 0)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Date Range: {reportQuery.data?.from ? new Date(reportQuery.data.from).toLocaleDateString() : "-"} -{" "}
          {reportQuery.data?.to ? new Date(reportQuery.data.to).toLocaleDateString() : "-"}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Vendor-wise Sales</h2>
          <span className="text-xs text-slate-500">Totals by vendor</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Total Sales</th>
                <th className="px-4 py-3 font-medium">Platform Fee</th>
                <th className="px-4 py-3 font-medium">Vendor Payout</th>
              </tr>
            </thead>
            <tbody>
              {(vendorSalesQuery.data?.rows || []).map((row) => (
                <tr key={row.vendorId} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{row.vendorName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.ordersCount}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {Math.round(row.totalSales)}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {Math.round(row.platformFee)}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {Math.round(row.vendorPayout)}</td>
                </tr>
              ))}
              {!vendorSalesQuery.isLoading && (vendorSalesQuery.data?.rows || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No vendor sales data found.
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

export default AdminReportsPage;
