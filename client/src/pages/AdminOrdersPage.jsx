import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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

const statusOptions = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED_BY_VENDOR",
  "CANCELLED_BY_ADMIN"
];

const AdminOrdersPage = () => {
  const [selected, setSelected] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await api.get("/api/orders/admin")).data.data
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/api/orders/${id}/status`, { status })).data.data,
    onSuccess: () => ordersQuery.refetch()
  });

  const downloadInvoice = async (orderId, orderCode) => {
    try {
      setDownloadingId(orderId);
      const response = await api.get(`/api/orders/${orderId}/invoice`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invoice download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const selectOrder = (order) => {
    setSelected(order);
    setNextStatus(order.status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Orders</h1>
        <p className="text-sm text-slate-500">Monitor and manage all orders.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(ordersQuery.data || []).map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{order.orderCode}</td>
                  <td className="px-4 py-3 text-slate-600">{order.customerName || "Customer"}</td>
                  <td className="px-4 py-3 text-slate-600">{order.vendorName || order.vendorId}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => selectOrder(order)}
                        className="text-xs font-semibold text-orange-600"
                      >
                        View
                      </button>
                      {(order.paymentStatus === "PAID" || order.status === "DELIVERED") && (
                        <button
                          onClick={() => downloadInvoice(order._id, order.orderCode)}
                          className="text-xs font-semibold text-emerald-600"
                        >
                          {downloadingId === order._id ? "Downloading..." : "Invoice"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!ordersQuery.isLoading && (ordersQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
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
                onClick={() => statusMutation.mutate({ id: selected._id, status: nextStatus })}
                className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Update Status
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
              <h3 className="text-sm font-semibold text-ink">Payment</h3>
              <p className="mt-2 text-sm text-slate-600">Method: {selected.paymentMethod}</p>
              <p className="text-sm text-slate-600">Total: Rs {selected.total}</p>
              <p className="text-sm text-slate-600">Platform Fee: Rs {selected.platformFee || Math.round(selected.total * 0.1)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-ink">Timeline</h3>
              <div className="mt-3 space-y-2 text-sm">
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

export default AdminOrdersPage;
