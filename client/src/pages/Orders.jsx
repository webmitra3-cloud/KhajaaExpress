import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Search, Download } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../app/AuthProvider";
import { useCart } from "../features/cart/CartProvider";
import ChatModal from "../components/ChatModal";

const statusSteps = ["PLACED", "ACCEPTED", "PREPARING", "READY", "DELIVERED"];
const activeStatuses = ["PLACED", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
const cancelledStatuses = ["CANCELLED_BY_USER", "REJECTED_BY_VENDOR", "CANCELLED_BY_ADMIN"];

const mockOrders = [
  {
    _id: "mock-1",
    orderCode: "FD-TQ0MM",
    createdAt: new Date().toISOString(),
    status: "DELIVERED",
    total: 450,
    items: [
      { menuItemId: "1", nameSnapshot: "Chicken MoMo", qty: 1 },
      { menuItemId: "2", nameSnapshot: "Fried Rice", qty: 1 }
    ],
    paymentMethod: "COD",
    customerAddress: "Kathmandu 5"
  }
];

const TimelineStepper = ({ status }) => {
  const currentIndex = statusSteps.indexOf(status);
  return (
    <div className="flex items-center gap-2">
      {statusSteps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              index <= currentIndex ? "bg-primary-500" : "bg-orange-100"
            }`}
          />
          {index < statusSteps.length - 1 && <div className="h-[2px] w-8 bg-orange-100" />}
        </div>
      ))}
    </div>
  );
};

const OrderCard = ({ order, onToggle, isOpen, onReorder, onReview, onMessage, onDownload, downloading }) => {
  const isCancelled = cancelledStatuses.includes(order.status);
  const statusStyle = isCancelled
    ? "bg-red-50 text-red-600"
    : order.status === "DELIVERED"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-orange-50 text-orange-600";

  const firstItem = order.items?.[0];
  const extraCount = order.items?.length > 1 ? order.items.length - 1 : 0;

  return (
    <div className="rounded-2xl border border-orange-100/50 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-ink">{order.orderCode}</p>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          {order.restaurantName && (
            <p className="text-sm text-gray-600">{order.restaurantName}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>{order.status}</span>
          <span className="text-sm font-semibold text-ink">Rs {order.total}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          {firstItem?.nameSnapshot} x{firstItem?.qty}
          {extraCount > 0 && <span className="text-gray-400"> + {extraCount} more</span>}
        </span>
      </div>

      {!isCancelled && (
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <TimelineStepper status={order.status} />
          <button
            onClick={onToggle}
            className="text-xs font-semibold text-orange-600"
          >
            {isOpen ? "Hide details" : "View details"}
          </button>
        </div>
      )}

      {isOpen && (
        <div className="mt-4 rounded-2xl border border-orange-100/60 bg-orange-50/30 p-4 text-sm">
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.menuItemId} className="flex items-center justify-between">
                <span>{item.nameSnapshot} x{item.qty}</span>
                <span>Rs {item.priceSnapshot || 0}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
            <span>Address: {order.customerAddress}</span>
            <span>Payment: {order.paymentMethod}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
        <button onClick={onToggle} className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white">
          View Details
        </button>
        <button onClick={onReorder} className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-700">
          Reorder
        </button>
        {(order.paymentStatus === "PAID" || order.status === "DELIVERED") && (
          <button
            onClick={onDownload}
            className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700"
          >
            {downloading ? "Downloading..." : "Invoice"}
          </button>
        )}
        <div className="relative">
          <button onClick={onMessage} className="rounded-full border border-orange-200 px-3 py-2 text-xs text-orange-700">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        {order.status === "DELIVERED" && (
          <button onClick={onReview} className="rounded-full border border-emerald-200 px-4 py-2 text-xs text-emerald-700">
            Write Review
          </button>
        )}
      </div>
    </div>
  );
};

const Orders = () => {
  const { socket } = useAuth();
  const { reorder } = useCart();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const { data: orders = [], refetch, isLoading } = useQuery({
    queryKey: ["orders", "me"],
    queryFn: async () => (await api.get("/api/orders/my")).data.data
  });

  const reviewMutation = useMutation({
    mutationFn: async () =>
      (await api.post("/api/reviews", { orderId: reviewOrderId, rating, comment })).data.data,
    onSuccess: () => {
      toast.success("Review submitted");
      setReviewOrderId(null);
      setComment("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Review failed");
    }
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

  useEffect(() => {
    if (!socket) return;
    const handler = () => refetch();
    socket.on("order:statusUpdated", handler);
    return () => socket.off("order:statusUpdated", handler);
  }, [socket, refetch]);

  const filteredOrders = useMemo(() => {
    let data = orders.length ? orders : [];
    if (tab === "Active") {
      data = data.filter((o) => activeStatuses.includes(o.status));
    }
    if (tab === "Delivered") {
      data = data.filter((o) => o.status === "DELIVERED");
    }
    if (tab === "Cancelled") {
      data = data.filter((o) => cancelledStatuses.includes(o.status));
    }
    if (search) {
      data = data.filter((o) =>
        o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
        o.items?.some((item) => item.nameSnapshot.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (fromDate) {
      data = data.filter((o) => new Date(o.createdAt) >= new Date(fromDate));
    }
    if (toDate) {
      data = data.filter((o) => new Date(o.createdAt) <= new Date(toDate));
    }
    if (sort === "Oldest") {
      data = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (sort === "Amount: High-Low") {
      data = [...data].sort((a, b) => b.total - a.total);
    }
    return data;
  }, [orders, tab, search, sort, fromDate, toDate]);

  return (
    <section>
      <div className="bg-gradient-to-r from-orange-50 to-orange-100/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-ink">My Orders</h1>
              <p className="text-sm text-gray-500">Track orders and manage reorders.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders"
                  className="h-10 w-56 rounded-xl border border-orange-100 pl-9 text-sm"
                />
              </div>
              <button className="rounded-full border border-orange-200 px-4 py-2 text-xs text-orange-700">Filter</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["All", "Active", "Delivered", "Cancelled"].map((label) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  tab === label ? "bg-primary-500 text-white" : "bg-white text-orange-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order ID / restaurant / item"
              className="h-11 w-full rounded-xl border border-orange-100 pl-9 text-sm"
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 rounded-xl border border-orange-100 text-sm">
            {"Newest,Oldest,Amount: High-Low".split(",").map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 w-full rounded-xl border border-orange-100 text-sm" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 w-full rounded-xl border border-orange-100 text-sm" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-36 rounded-2xl border border-orange-100/50 bg-white p-5 shadow-sm" />
              ))}
            </div>
          )}
          {!isLoading && filteredOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-ink">No orders yet</p>
              <p className="mt-2 text-sm text-gray-500">Browse restaurants to place your first order.</p>
              <Link to="/vendors" className="mt-4 inline-flex rounded-full bg-primary-500 px-5 py-2 text-xs font-semibold text-white">Browse Restaurants</Link>
            </div>
          )}
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isOpen={expandedId === order._id}
              onToggle={() => setExpandedId((prev) => (prev === order._id ? null : order._id))}
              onReorder={() => reorder(order)}
              onReview={() => setReviewOrderId(order._id)}
              onMessage={() => setChatOrderId(order._id)}
              onDownload={() => downloadInvoice(order._id, order.orderCode)}
              downloading={downloadingId === order._id}
            />
          ))}
        </div>
      </div>

      {chatOrderId && <ChatModal orderId={chatOrderId} onClose={() => setChatOrderId(null)} />}

      {reviewOrderId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Review Order</h3>
              <button onClick={() => setReviewOrderId(null)} className="text-sm text-gray-500">Close</button>
            </div>
            <div className="mt-4 space-y-3">
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-orange-100 px-4 text-sm"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} Stars</option>
                ))}
              </select>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience"
                className="w-full rounded-xl border border-orange-100 px-4 py-3 text-sm"
              />
              <button
                onClick={() => reviewMutation.mutate()}
                className="w-full rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Orders;
