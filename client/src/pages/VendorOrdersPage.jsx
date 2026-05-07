import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Filter, MoreHorizontal, MessageSquare } from "lucide-react";
import api from "../lib/api";

const statusOptions = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED_BY_USER",
  "REJECTED_BY_VENDOR",
  "CANCELLED_BY_ADMIN"
];

const statusStyles = {
  PREPARING: "bg-orange-50 text-orange-700",
  ACCEPTED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED_BY_USER: "bg-rose-50 text-rose-700",
  REJECTED_BY_VENDOR: "bg-rose-50 text-rose-700",
  CANCELLED_BY_ADMIN: "bg-rose-50 text-rose-700",
  PLACED: "bg-slate-100 text-slate-600",
  READY: "bg-indigo-50 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-700"
};

const VendorOrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [nextStatus, setNextStatus] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["vendor", "orders"],
    queryFn: async () => (await api.get("/api/orders/vendor")).data.data
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/api/orders/${id}/status`, { status })).data.data,
    onSuccess: () => ordersQuery.refetch()
  });

  const filtered = useMemo(() => {
    const orders = ordersQuery.data || [];
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const matchesQuery = [order.orderCode, order.customerName, order.customerPhone, order.customerAddress]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [ordersQuery.data, statusFilter, query]);

  const selectOrder = (order) => {
    setSelected(order);
    setNextStatus(order.status);
  };

  const updateStatus = () => {
    if (!selected || !nextStatus) return;
    statusMutation.mutate({ id: selected._id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Orders</h1>
          <p className="text-sm text-slate-500">Manage incoming orders and update statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <select className="h-9 rounded-xl border border-slate-200 px-3 text-xs">
            <option>Newest</option>
            <option>Oldest</option>
            <option>Amount: High to Low</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order ID, customer, address"
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
          >
            {["All", ...statusOptions].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input type="date" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{order.orderCode}</td>
                  <td className="px-4 py-3 text-slate-600">{order.customerName || "Customer"}</td>
                  <td className="px-4 py-3 text-slate-600">{order.items?.length || 0}</td>
                  <td className="px-4 py-3 text-slate-700">Rs {order.total}</td>
                  <td className="px-4 py-3 text-slate-500">{order.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectOrder(order)}
                        className="text-xs font-semibold text-orange-600"
                      >
                        View
                      </button>
                      <button className="grid h-7 w-7 place-items-center rounded-full border border-slate-200">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!ordersQuery.isLoading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={8}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Order {selected.orderCode}</h2>
              <p className="text-sm text-slate-500">{selected.customerAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-xl border border-slate-200 px-3 text-xs"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                onClick={updateStatus}
                className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Update Status
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600">
                <MessageSquare className="h-4 w-4" />
                Message
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-ink">Items</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {(selected.items || []).map((item) => (
                  <li key={item.menuItemId}>{item.nameSnapshot} x{item.qty}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-ink">Taste Notes</h3>
              <p className="mt-3 text-sm text-slate-600">{selected.notes || "No special instructions."}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-ink">Timeline</h3>
              <div className="mt-3 space-y-3 text-sm">
                {(selected.timeline || []).map((step) => (
                  <div key={step.status} className="flex items-center justify-between">
                    <span className="text-slate-600">{step.status}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(step.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default VendorOrdersPage;
