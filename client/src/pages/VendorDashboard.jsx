import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import SectionHeading from "../components/SectionHeading";
import StatCard from "../components/StatCard";
import { useAuth } from "../app/AuthProvider";
import ChatModal from "../components/ChatModal";

const itemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  prepTimeMins: z.number().min(5).optional(),
  isVeg: z.boolean().optional(),
  variants: z.string().optional(),
  addons: z.string().optional()
});

const profileSchema = z.object({
  restaurantName: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  zone: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  openingHours: z.string().optional(),
  minOrder: z.number().min(0),
  deliveryFee: z.number().min(0),
  isOpenManualOverride: z.boolean().optional(),
  busyMode: z.boolean().optional()
});

const expenseSchema = z.object({
  category: z.string().min(2),
  amount: z.number().min(1),
  note: z.string().optional()
});

const VendorDashboard = () => {
  const { socket, user, setUser } = useAuth();
  const [tab, setTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [chatOrderId, setChatOrderId] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState(0);

  const profileQuery = useQuery({
    queryKey: ["vendor", "me"],
    queryFn: async () => (await api.get("/api/vendors/me")).data.data
  });

  const ordersQuery = useQuery({
    queryKey: ["vendor", "orders"],
    queryFn: async () => (await api.get("/api/orders/vendor")).data.data
  });

  const itemsQuery = useQuery({
    queryKey: ["vendor", "items"],
    queryFn: async () => (await api.get("/api/items/vendor/me")).data.data
  });

  const walletQuery = useQuery({
    queryKey: ["vendor", "wallet"],
    queryFn: async () => (await api.get("/api/wallet/me")).data.data
  });

  const payoutsQuery = useQuery({
    queryKey: ["vendor", "payouts"],
    queryFn: async () => (await api.get("/api/payouts/vendor")).data.data
  });

  const expensesQuery = useQuery({
    queryKey: ["vendor", "expenses"],
    queryFn: async () => (await api.get("/api/expenses")).data.data
  });

  const reportsQuery = useQuery({
    queryKey: ["vendor", "reports"],
    queryFn: async () => (await api.get("/api/reports/vendor/sales")).data.data
  });

  useEffect(() => {
    if (!socket) return;
    const handler = () => ordersQuery.refetch();
    socket.on("order:placed", handler);
    return () => socket.off("order:placed", handler);
  }, [socket, ordersQuery]);

  const stats = useMemo(() => {
    const orders = ordersQuery.data || [];
    const totalOrders = orders.length;
    const pending = orders.filter((o) => ["PLACED", "ACCEPTED", "PREPARING"].includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const revenue = orders.reduce((sum, o) => sum + (o.vendorPayout ?? o.total * 0.9), 0);
    return { totalOrders, pending, delivered, revenue };
  }, [ordersQuery.data]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.put(`/api/orders/${id}/status`, { status })).data.data,
    onSuccess: () => {
      toast.success("Status updated");
      ordersQuery.refetch();
    }
  });

  const { register, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(itemSchema)
  });

  const addItemMutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/items", values)).data.data,
    onSuccess: () => {
      toast.success("Item added");
      setShowModal(false);
      reset();
      itemsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add item");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/items/${id}`)).data.data,
    onSuccess: () => {
      toast.success("Item removed");
      itemsQuery.refetch();
    }
  });

  const onSubmit = (values) => {
    const prepTime = Number(values.prepTimeMins);
    const variants = values.variants
      ? values.variants.split(",").map((pair) => {
          const [name, priceDelta] = pair.split(":");
          return { name: name?.trim(), priceDelta: Number(priceDelta || 0) };
        })
      : [];
    const addons = values.addons
      ? values.addons.split(",").map((pair) => {
          const [name, price] = pair.split(":");
          return { name: name?.trim(), price: Number(price || 0) };
        })
      : [];
    const payload = {
      ...values,
      price: Number(values.price),
      prepTimeMins: Number.isNaN(prepTime) ? undefined : prepTime,
      variants,
      addons
    };
    addItemMutation.mutate(payload);
  };

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      restaurantName: "",
      description: "",
      address: "",
      city: "",
      zone: "",
      coverImageUrl: "",
      logoUrl: "",
      openingHours: "",
      minOrder: 0,
      deliveryFee: 0,
      isOpenManualOverride: true,
      busyMode: false
    }
  });

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        restaurantName: profileQuery.data.restaurantName || "",
        description: profileQuery.data.description || "",
        address: profileQuery.data.address || "",
        city: profileQuery.data.city || "",
        zone: profileQuery.data.zone || "",
        coverImageUrl: profileQuery.data.coverImageUrl || "",
        logoUrl: profileQuery.data.logoUrl || "",
        openingHours: profileQuery.data.openingHours || "",
        minOrder: profileQuery.data.minOrder || 0,
        deliveryFee: profileQuery.data.deliveryFee || 0,
        isOpenManualOverride: profileQuery.data.isOpenManualOverride ?? true,
        busyMode: profileQuery.data.busyMode ?? false
      });
    }
  }, [profileQuery.data, profileForm]);

  const profileMutation = useMutation({
    mutationFn: async (values) => (await api.put("/api/vendors/me", values)).data.data,
    onSuccess: () => {
      toast.success("Profile updated");
      profileQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Update failed");
    }
  });

  const expenseForm = useForm({
    resolver: zodResolver(expenseSchema)
  });

  const expenseMutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/expenses", values)).data.data,
    onSuccess: () => {
      toast.success("Expense added");
      expenseForm.reset();
      expensesQuery.refetch();
    }
  });

  const payoutMutation = useMutation({
    mutationFn: async (amount) => (await api.post("/api/payouts/request", { amount })).data.data,
    onSuccess: () => {
      toast.success("Payout requested");
      payoutsQuery.refetch();
    }
  });

  const themeMutation = useMutation({
    mutationFn: async () => {
      const nextTheme = user?.theme === "dark" ? "light" : "dark";
      return (await api.patch("/api/users/theme", { theme: nextTheme })).data.data;
    },
    onSuccess: (data) => {
      setUser(data);
      toast.success("Theme updated");
    }
  });

  const tabs = ["overview", "orders", "menu", "profile", "finance", "expenses", "reports"];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeading
        title="Vendor Dashboard"
        subtitle="Manage your restaurant and orders."
        action={
          <button
            onClick={() => themeMutation.mutate()}
            className="rounded-full border border-orange-200 px-4 py-2 text-xs text-orange-700"
          >
            {user?.theme === "dark" ? "Dark" : "Light"} Mode
          </button>
        }
      />
      <div className="mt-6 flex flex-wrap gap-3">
        {tabs.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              tab === name ? "bg-primary-500 text-white" : "bg-white text-gray-600"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard title="Total Orders" value={stats.totalOrders} />
          <StatCard title="Pending" value={stats.pending} />
          <StatCard title="Delivered" value={stats.delivered} />
          <StatCard title="Net Earnings" value={`Rs ${stats.revenue}`} />
          <div className="md:col-span-2 rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Recent Orders</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {ordersQuery.data?.slice(0, 4).map((order) => (
                <div key={order._id} className="flex items-center justify-between">
                  <span>{order.orderCode}</span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-600">{order.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Wallet Balance</h3>
            <p className="mt-3 text-sm text-gray-600">Rs {walletQuery.data?.balance ?? 0}</p>
            <p className="mt-2 text-xs text-gray-500">Payouts reduce your wallet balance.</p>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 space-y-4">
          {ordersQuery.data?.map((order) => (
            <div key={order._id} className="rounded-[32px] bg-white p-5 shadow-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{order.orderCode}</p>
                  <p className="text-xs text-gray-500">{order.customerAddress}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-600">
                  {order.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                  value={order.status}
                  onChange={(e) => statusMutation.mutate({ id: order._id, status: e.target.value })}
                  className="rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-700"
                >
                  {["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "REJECTED_BY_VENDOR"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                  Vendor Payout: Rs {order.vendorPayout ?? Math.round(order.total * 0.9)}
                </span>
                <button
                  onClick={() => setChatOrderId(order._id)}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-700"
                >
                  Message Customer
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-xs text-gray-600">
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between">
                    <span>{item.nameSnapshot} x{item.qty}</span>
                    <span>
                      {item.tastePreferences?.spiceLevel || "Normal"} spice, {item.tastePreferences?.saltLevel || "Normal"} salt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "menu" && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-ink">Menu Items</h3>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
            >
              Add Item
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {itemsQuery.data?.map((item) => (
              <div key={item._id} className="rounded-[32px] bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-gray-500">Rs {item.price}</p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(item._id)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="mt-6 rounded-[32px] bg-white p-6 shadow-card">
          <h3 className="font-display text-xl text-ink">Restaurant Profile</h3>
          <form
            className="mt-4 grid gap-4 md:grid-cols-2"
            onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
          >
            <input
              {...profileForm.register("restaurantName")}
              placeholder="Restaurant name"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <textarea
              {...profileForm.register("description")}
              placeholder="Description"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <input
              {...profileForm.register("address")}
              placeholder="Address"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <input
              {...profileForm.register("city")}
              placeholder="City"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              {...profileForm.register("zone")}
              placeholder="Zone"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              {...profileForm.register("openingHours")}
              placeholder="Opening hours"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              type="number"
              {...profileForm.register("minOrder", { valueAsNumber: true })}
              placeholder="Minimum order"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              type="number"
              {...profileForm.register("deliveryFee", { valueAsNumber: true })}
              placeholder="Delivery fee"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              {...profileForm.register("logoUrl")}
              placeholder="Logo URL"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <input
              {...profileForm.register("coverImageUrl")}
              placeholder="Cover image URL"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <label className="flex items-center gap-2 text-xs text-gray-600 md:col-span-2">
              <input type="checkbox" {...profileForm.register("isOpenManualOverride")} />
              Restaurant open for orders
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 md:col-span-2">
              <input type="checkbox" {...profileForm.register("busyMode")} />
              Busy mode (pause new orders)
            </label>
            <button
              type="submit"
              className="rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white md:col-span-2"
              disabled={profileMutation.isPending}
            >
              {profileMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      )}

      {tab === "finance" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Payout Requests</h3>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                placeholder="Amount"
                className="flex-1 rounded-2xl border border-orange-100 px-4 py-2 text-xs"
              />
              <button
                onClick={() => payoutMutation.mutate(payoutAmount)}
                className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Request
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {payoutsQuery.data?.map((payout) => (
                <div key={payout._id} className="rounded-2xl border border-orange-100 px-4 py-2">
                  <p>Rs {payout.amount}</p>
                  <p className="text-xs text-gray-500">{payout.status}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Wallet Balance</h3>
            <p className="mt-3 text-sm text-gray-600">Rs {walletQuery.data?.balance ?? 0}</p>
            <p className="mt-2 text-xs text-gray-500">Net earnings after commission.</p>
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Add Expense</h3>
            <form className="mt-4 space-y-3" onSubmit={expenseForm.handleSubmit((values) => expenseMutation.mutate(values))}>
              <input {...expenseForm.register("category")} placeholder="Category" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input type="number" {...expenseForm.register("amount", { valueAsNumber: true })} placeholder="Amount" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <textarea {...expenseForm.register("note")} placeholder="Note" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <button type="submit" className="w-full rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white">Save Expense</button>
            </form>
          </div>
          <div className="space-y-3">
            {expensesQuery.data?.map((expense) => (
              <div key={expense._id} className="rounded-[32px] bg-white p-4 shadow-card">
                <p className="font-semibold text-ink">{expense.category}</p>
                <p className="text-xs text-gray-500">Rs {expense.amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-6 rounded-[32px] bg-white p-6 shadow-card">
          <h3 className="font-display text-xl text-ink">Sales Report (7 days)</h3>
          <p className="mt-2 text-sm text-gray-600">Gross: Rs {Math.round(reportsQuery.data?.gross || 0)}</p>
          <p className="text-sm text-gray-600">Net: Rs {Math.round(reportsQuery.data?.net || 0)}</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Add Menu Item</h3>
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-500">Close</button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
              <input
                {...register("name")}
                placeholder="Item name"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <textarea
                {...register("description")}
                placeholder="Description"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <input
                type="number"
                {...register("price", { valueAsNumber: true })}
                placeholder="Price"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <input
                {...register("imageUrl")}
                placeholder="Image URL"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <input
                type="number"
                {...register("prepTimeMins", { valueAsNumber: true })}
                placeholder="Prep time (mins)"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <input
                {...register("variants")}
                placeholder="Variants: Small:0, Medium:50"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <input
                {...register("addons")}
                placeholder="Addons: Cheese:30, Sauce:15"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" {...register("isVeg")} />
                Veg item
              </label>
              {Object.values(formState.errors).length > 0 && (
                <p className="text-xs text-red-500">Please check your inputs.</p>
              )}
              <button
                type="submit"
                className="w-full rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Save Item
              </button>
            </form>
          </div>
        </div>
      )}

      {chatOrderId && <ChatModal orderId={chatOrderId} onClose={() => setChatOrderId(null)} />}
    </section>
  );
};

export default VendorDashboard;
