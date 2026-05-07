import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, BarChart3, TrendingUp, Wallet, ClipboardList, Truck, Ban } from "lucide-react";
import api from "../lib/api";

const topItems = [];
const peakHours = [];
const cancellations = [];

const statusStyles = {
  PREPARING: "bg-orange-50 text-orange-700",
  ACCEPTED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  PLACED: "bg-slate-100 text-slate-600",
  READY: "bg-indigo-50 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-700",
  CANCELLED_BY_USER: "bg-rose-50 text-rose-700",
  REJECTED_BY_VENDOR: "bg-rose-50 text-rose-700",
  CANCELLED_BY_ADMIN: "bg-rose-50 text-rose-700"
};

const VendorDashboardPage = () => {
  const ordersQuery = useQuery({
    queryKey: ["vendor", "orders"],
    queryFn: async () => (await api.get("/api/orders/vendor")).data.data
  });

  const walletQuery = useQuery({
    queryKey: ["vendor", "wallet"],
    queryFn: async () => (await api.get("/api/wallet/me")).data.data
  });

  const payoutsQuery = useQuery({
    queryKey: ["vendor", "payouts"],
    queryFn: async () => (await api.get("/api/payouts/vendor")).data.data
  });

  const stats = useMemo(() => {
    const orders = ordersQuery.data || [];
    const totalOrders = orders.length;
    const pending = orders.filter((o) => ["PLACED", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status))
      .length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const gross = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const platformFee = orders.reduce((sum, o) => sum + (o.platformFee || Math.round((o.total || 0) * 0.1)), 0);
    const net = orders.reduce((sum, o) => sum + (o.vendorPayout || (o.total || 0) - (o.platformFee || 0)), 0);
    return { totalOrders, pending, delivered, gross, platformFee, net };
  }, [ordersQuery.data]);

  const kpis = [
    { label: "Total Orders", value: stats.totalOrders, icon: ClipboardList, trend: "-" },
    { label: "Pending Orders", value: stats.pending, icon: Truck, trend: "-" },
    { label: "Delivered", value: stats.delivered, icon: TrendingUp, trend: "-" },
    { label: "Gross Sales", value: `Rs ${stats.gross}`, icon: Wallet, trend: "-" },
    { label: "Platform Fee (10%)", value: `Rs ${stats.platformFee}`, icon: BarChart3, trend: "-" },
    { label: "Net Earnings", value: `Rs ${stats.net}`, icon: LineChart, trend: "-" }
  ];

  const recentOrders = (ordersQuery.data || []).slice(0, 5).map((order) => ({
    id: order.orderCode || order._id,
    time: new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    items: order.items?.length || 0,
    total: `Rs ${order.total}`,
    status: order.status
  }));

  const walletSummary = [
    { label: "Wallet Balance", value: `Rs ${walletQuery.data?.balance ?? 0}` },
    {
      label: "Pending Payouts",
      value: `Rs ${payoutsQuery.data?.filter((p) => p.status === "REQUESTED").reduce((sum, p) => sum + p.amount, 0) || 0}`
    },
    {
      label: "Last Payout",
      value: payoutsQuery.data?.[0] ? `Rs ${payoutsQuery.data[0].amount} (${payoutsQuery.data[0].status})` : "-"
    }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{kpi.value}</p>
              </div>
              <div className="rounded-full bg-orange-50 p-2 text-orange-600">
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{kpi.trend} vs last period</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Sales Trend</h2>
              <p className="text-sm text-slate-500">Last 7 days</p>
            </div>
            <LineChart className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            Line chart placeholder
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Orders Trend</h2>
              <p className="text-sm text-slate-500">Last 7 days</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            Bar chart placeholder
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent Orders</h2>
            <button className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-600">
              View all
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">{order.id}</td>
                    <td className="px-4 py-3 text-slate-500">{order.time}</td>
                    <td className="px-4 py-3 text-slate-500">{order.items}</td>
                    <td className="px-4 py-3 text-slate-700">{order.total}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-semibold text-orange-600">View</button>
                    </td>
                  </tr>
                ))}
                {!ordersQuery.isLoading && recentOrders.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Wallet Summary</h2>
            <Wallet className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {walletSummary.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                <span className="text-slate-500">{row.label}</span>
                <span className="font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white">Request Payout</button>
            <button className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600">View Transactions</button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Top Selling Items</h2>
          <div className="mt-4 text-sm text-slate-500">No data yet.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Peak Hours</h2>
          <div className="mt-4 text-sm text-slate-500">No data yet.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Cancellation Reasons</h2>
            <Ban className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-4 text-sm text-slate-500">No data yet.</div>
        </div>
      </section>
    </div>
  );
};

export default VendorDashboardPage;
