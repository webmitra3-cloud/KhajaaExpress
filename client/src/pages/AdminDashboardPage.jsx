import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Store, ClipboardList, Users, Wallet, AlertTriangle } from "lucide-react";
import api from "../lib/api";

const statusStyles = {
  PLACED: "bg-slate-100 text-slate-600",
  ACCEPTED: "bg-amber-50 text-amber-700",
  PREPARING: "bg-orange-50 text-orange-700",
  READY: "bg-indigo-50 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED_BY_USER: "bg-rose-50 text-rose-700",
  REJECTED_BY_VENDOR: "bg-rose-50 text-rose-700",
  CANCELLED_BY_ADMIN: "bg-rose-50 text-rose-700"
};

const AdminDashboardPage = () => {
  const vendorsQuery = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: async () => (await api.get("/api/vendors")).data.data
  });

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await api.get("/api/orders/admin")).data.data
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await api.get("/api/users")).data.data
  });

  const reportsQuery = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => (await api.get("/api/reports/admin/revenue")).data.data
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: async () => (await api.get("/api/payouts/admin")).data.data
  });

  const pendingVendors = useMemo(
    () => (vendorsQuery.data || []).filter((vendor) => vendor.status === "PENDING"),
    [vendorsQuery.data]
  );

  const pendingPayouts = useMemo(
    () => (payoutsQuery.data || []).filter((payout) => payout.status === "REQUESTED"),
    [payoutsQuery.data]
  );

  const recentOrders = (ordersQuery.data || []).slice(0, 5);

  const kpis = [
    {
      label: "Total Vendors",
      value: vendorsQuery.data?.length || 0,
      icon: Store
    },
    {
      label: "Pending Vendors",
      value: pendingVendors.length,
      icon: AlertTriangle
    },
    {
      label: "Total Orders",
      value: ordersQuery.data?.length || 0,
      icon: ClipboardList
    },
    {
      label: "Users",
      value: usersQuery.data?.length || 0,
      icon: Users
    },
    {
      label: "Platform Commission",
      value: `Rs ${Math.round(reportsQuery.data?.commission || 0)}`,
      icon: Wallet
    },
    {
      label: "Order Volume",
      value: reportsQuery.data?.ordersCount || 0,
      icon: LayoutDashboard
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
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Quick actions</h2>
            <p className="text-xs text-slate-500">Manage storefront content quickly.</p>
          </div>
          <Link
            to="/admin/categories"
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Add Category
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent Orders</h2>
            <span className="text-xs text-slate-500">Live view</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">{order.orderCode}</td>
                    <td className="px-4 py-3 text-slate-600">{order.customerName || "Customer"}</td>
                    <td className="px-4 py-3 text-slate-700">Rs {order.total}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!ordersQuery.isLoading && recentOrders.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Pending Vendors</h2>
            <div className="mt-4 space-y-3 text-sm">
              {pendingVendors.slice(0, 4).map((vendor) => (
                <div key={vendor._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{vendor.restaurantName}</p>
                    <p className="text-xs text-slate-500">{vendor.city}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">PENDING</span>
                </div>
              ))}
              {!vendorsQuery.isLoading && pendingVendors.length === 0 && (
                <p className="text-sm text-slate-500">No pending vendors.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Payout Requests</h2>
            <div className="mt-4 space-y-3 text-sm">
              {pendingPayouts.slice(0, 4).map((payout) => (
                <div key={payout._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">Rs {payout.amount}</p>
                    <p className="text-xs text-slate-500">{payout.vendorId}</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-700">REQUESTED</span>
                </div>
              ))}
              {!payoutsQuery.isLoading && pendingPayouts.length === 0 && (
                <p className="text-sm text-slate-500">No payout requests.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
