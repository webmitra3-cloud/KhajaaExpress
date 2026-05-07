import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { useAuth } from "../app/AuthProvider";
import SectionHeading from "../components/SectionHeading";
import StatCard from "../components/StatCard";

const categorySchema = z.object({
  name: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal(""))
});

const vendorSchema = z.object({
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
  busyMode: z.boolean().optional(),
  commissionRate: z.number().min(0).max(0.5).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
});

const settingsSchema = z.object({
  deliveryFeeDefault: z.number().min(0),
  minOrderDefault: z.number().min(0),
  supportEmail: z.string().email(),
  isOpen: z.boolean(),
  heroMessage: z.string().min(3)
});

const couponSchema = z.object({
  code: z.string().min(3),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().min(1),
  minOrder: z.number().min(0),
  maxDiscount: z.number().min(0),
  validFrom: z.string(),
  validTo: z.string()
});

const bannerSchema = z.object({
  title: z.string().min(2),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional().or(z.literal(""))
});

const AdminDashboard = () => {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState("vendors");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const vendorsQuery = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: async () => (await api.get("/api/vendors")).data.data
  });

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await api.get("/api/orders/admin")).data.data
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await api.get("/api/categories/public")).data.data
  });

  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => (await api.get("/api/settings")).data.data
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: async () => (await api.get("/api/payouts/admin")).data.data
  });

  const ticketsQuery = useQuery({
    queryKey: ["admin", "tickets"],
    queryFn: async () => (await api.get("/api/tickets")).data.data
  });

  const couponsQuery = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => (await api.get("/api/coupons")).data.data
  });

  const bannersQuery = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => (await api.get("/api/banners")).data.data
  });

  const reportsQuery = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => (await api.get("/api/reports/admin/revenue")).data.data
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await api.get("/api/users")).data.data
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.put(`/api/vendors/${id}/status`, { status })).data.data,
    onSuccess: () => {
      toast.success("Vendor updated");
      vendorsQuery.refetch();
    }
  });

  const orderStatusMutation = useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.put(`/api/orders/${id}/status`, { status })).data.data,
    onSuccess: () => {
      toast.success("Order status updated");
      ordersQuery.refetch();
    }
  });

  const ticketMutation = useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/api/tickets/${id}`, { status })).data.data,
    onSuccess: () => {
      toast.success("Ticket updated");
      ticketsQuery.refetch();
    }
  });

  const userActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => (await api.put(`/api/users/${id}/active`, { isActive })).data.data,
    onSuccess: () => {
      toast.success("User updated");
      usersQuery.refetch();
    }
  });

  const payoutApprove = useMutation({
    mutationFn: async (id) => (await api.put(`/api/payouts/${id}/approve`)).data.data,
    onSuccess: () => {
      toast.success("Payout approved");
      payoutsQuery.refetch();
    }
  });

  const payoutPaid = useMutation({
    mutationFn: async (id) => (await api.put(`/api/payouts/${id}/paid`)).data.data,
    onSuccess: () => {
      toast.success("Payout marked paid");
      payoutsQuery.refetch();
    }
  });

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(categorySchema)
  });

  const categoryMutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/categories", values)).data.data,
    onSuccess: () => {
      toast.success("Category added");
      setShowCategoryModal(false);
      reset();
      categoriesQuery.refetch();
    }
  });

  const vendorForm = useForm({
    resolver: zodResolver(vendorSchema)
  });

  useEffect(() => {
    if (selectedVendor) {
      vendorForm.reset({
        restaurantName: selectedVendor.restaurantName || "",
        description: selectedVendor.description || "",
        address: selectedVendor.address || "",
        city: selectedVendor.city || "",
        zone: selectedVendor.zone || "",
        coverImageUrl: selectedVendor.coverImageUrl || "",
        logoUrl: selectedVendor.logoUrl || "",
        openingHours: selectedVendor.openingHours || "",
        minOrder: selectedVendor.minOrder || 0,
        deliveryFee: selectedVendor.deliveryFee || 0,
        isOpenManualOverride: selectedVendor.isOpenManualOverride ?? true,
        busyMode: selectedVendor.busyMode ?? false,
        commissionRate: selectedVendor.commissionRate ?? 0.1,
        status: selectedVendor.status || "PENDING"
      });
    }
  }, [selectedVendor, vendorForm]);

  const vendorUpdateMutation = useMutation({
    mutationFn: async (values) =>
      (await api.put(`/api/vendors/${selectedVendor._id}`, values)).data.data,
    onSuccess: () => {
      toast.success("Vendor profile updated");
      setSelectedVendor(null);
      vendorsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Update failed");
    }
  });

  const settingsForm = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      deliveryFeeDefault: 60,
      minOrderDefault: 300,
      supportEmail: "support@khajaexpress.local",
      isOpen: true,
      heroMessage: "Fresh. Fast. Cash on Delivery."
    }
  });

  useEffect(() => {
    if (settingsQuery.data) {
      settingsForm.reset({
        deliveryFeeDefault: settingsQuery.data.deliveryFeeDefault ?? 60,
        minOrderDefault: settingsQuery.data.minOrderDefault ?? 300,
        supportEmail: settingsQuery.data.supportEmail || "support@khajaexpress.local",
        isOpen: settingsQuery.data.isOpen ?? true,
        heroMessage: settingsQuery.data.heroMessage || "Fresh. Fast. Cash on Delivery."
      });
    }
  }, [settingsQuery.data, settingsForm]);

  const settingsMutation = useMutation({
    mutationFn: async (values) => (await api.put("/api/settings", values)).data.data,
    onSuccess: () => {
      toast.success("Settings updated");
      settingsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Update failed");
    }
  });

  const couponForm = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: "PERCENT",
      minOrder: 0,
      maxDiscount: 0
    }
  });

  const couponMutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/coupons", values)).data.data,
    onSuccess: () => {
      toast.success("Coupon created");
      couponForm.reset();
      couponsQuery.refetch();
    }
  });

  const bannerForm = useForm({
    resolver: zodResolver(bannerSchema)
  });

  const bannerMutation = useMutation({
    mutationFn: async (values) => (await api.post("/api/banners", values)).data.data,
    onSuccess: () => {
      toast.success("Banner created");
      bannerForm.reset();
      bannersQuery.refetch();
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

  const platformRevenue = (ordersQuery.data || []).reduce(
    (sum, order) => sum + (order.platformFee ?? order.total * 0.1),
    0
  );

  const tabs = [
    "vendors",
    "orders",
    "users",
    "categories",
    "settings",
    "payouts",
    "tickets",
    "coupons",
    "banners",
    "reports"
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeading
        title="Admin Dashboard"
        subtitle="Professional overview of Khaja Express."
        action={
          <button
            onClick={() => themeMutation.mutate()}
            className="rounded-full border border-orange-200 px-4 py-2 text-xs text-orange-700"
          >
            {user?.theme === "dark" ? "Dark" : "Light"} Mode
          </button>
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <StatCard title="Vendors" value={vendorsQuery.data?.length || 0} />
        <StatCard title="Orders" value={ordersQuery.data?.length || 0} />
        <StatCard title="Categories" value={categoriesQuery.data?.length || 0} />
        <StatCard title="Pending" value={vendorsQuery.data?.filter((v) => v.status === "PENDING").length || 0} />
        <StatCard title="Platform Fee" value={`Rs ${Math.round(platformRevenue)}`} />
      </div>

      <div className="mt-8 rounded-[32px] bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-3">
          {tabs.map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                tab === name ? "bg-primary-500 text-white" : "bg-orange-50 text-orange-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {tab === "vendors" && (
        <div className="mt-6 grid gap-4">
          {vendorsQuery.data?.map((vendor) => (
            <div key={vendor._id} className="rounded-[32px] bg-white p-5 shadow-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={vendor.logoUrl || "https://images.unsplash.com/photo-1526367790999-0150786686a2"}
                    alt={vendor.restaurantName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-ink">{vendor.restaurantName}</p>
                    <p className="text-xs text-gray-500">{vendor.city}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-600">
                    {vendor.status}
                  </span>
                  <button
                    onClick={() => statusMutation.mutate({ id: vendor._id, status: "APPROVED" })}
                    className="rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => statusMutation.mutate({ id: vendor._id, status: "REJECTED" })}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedVendor(vendor)}
                    className="rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 space-y-4">
          {ordersQuery.data?.map((order) => (
            <div key={order._id} className="rounded-[32px] bg-white p-5 shadow-card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{order.orderCode}</p>
                  <p className="text-xs text-gray-500">{order.customerAddress}</p>
                  <p className="text-xs text-gray-500">Payment: {order.paymentMethod}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => orderStatusMutation.mutate({ id: order._id, status: e.target.value })}
                    className="rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-700"
                  >
                    {["PLACED", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "REJECTED_BY_VENDOR", "CANCELLED_BY_ADMIN"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-600">
                    Platform Fee: Rs {order.platformFee ?? Math.round(order.total * 0.1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="mt-6 space-y-4">
          {usersQuery.data?.map((user) => (
            <div key={user._id} className="rounded-[32px] bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => userActiveMutation.mutate({ id: user._id, isActive: !user.isActive })}
                  className="rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-700"
                >
                  {user.isActive ? "Block" : "Unblock"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "categories" && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-ink">Categories</h3>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
            >
              Add Category
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {categoriesQuery.data?.map((category) => (
              <div key={category._id} className="rounded-[32px] bg-white p-5 shadow-card">
                <p className="font-semibold text-ink">{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="mt-6 rounded-[32px] bg-white p-6 shadow-card">
          <h3 className="font-display text-xl text-ink">Platform Settings</h3>
          <form
            className="mt-4 grid gap-4 md:grid-cols-2"
            onSubmit={settingsForm.handleSubmit((values) => settingsMutation.mutate(values))}
          >
            <input
              type="number"
              {...settingsForm.register("deliveryFeeDefault", { valueAsNumber: true })}
              placeholder="Default delivery fee"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              type="number"
              {...settingsForm.register("minOrderDefault", { valueAsNumber: true })}
              placeholder="Default minimum order"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
            />
            <input
              {...settingsForm.register("supportEmail")}
              placeholder="Support email"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <input
              {...settingsForm.register("heroMessage")}
              placeholder="Hero message"
              className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" {...settingsForm.register("isOpen")} />
              Platform is accepting orders
            </label>
            <button
              type="submit"
              className="rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white md:col-span-2"
            >
              Save settings
            </button>
          </form>
        </div>
      )}

      {tab === "payouts" && (
        <div className="mt-6 space-y-4">
          {payoutsQuery.data?.map((payout) => (
            <div key={payout._id} className="rounded-[32px] bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">Vendor {payout.vendorId}</p>
                  <p className="text-xs text-gray-500">{payout.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => payoutApprove.mutate(payout._id)}
                    className="rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => payoutPaid.mutate(payout._id)}
                    className="rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-700"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tickets" && (
        <div className="mt-6 space-y-4">
          {ticketsQuery.data?.map((ticket) => (
            <div key={ticket._id} className="rounded-[32px] bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{ticket.category}</p>
                  <p className="text-xs text-gray-500">{ticket.status}</p>
                </div>
                <select
                  value={ticket.status}
                  onChange={(e) => ticketMutation.mutate({ id: ticket._id, status: e.target.value })}
                  className="rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-700"
                >
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "coupons" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Create Coupon</h3>
            <form className="mt-4 space-y-3" onSubmit={couponForm.handleSubmit((values) => couponMutation.mutate(values))}>
              <input {...couponForm.register("code")} placeholder="CODE" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <select {...couponForm.register("type")} className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs">
                <option value="PERCENT">Percent</option>
                <option value="FLAT">Flat</option>
              </select>
              <input type="number" {...couponForm.register("value", { valueAsNumber: true })} placeholder="Value" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input type="number" {...couponForm.register("minOrder", { valueAsNumber: true })} placeholder="Min order" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input type="number" {...couponForm.register("maxDiscount", { valueAsNumber: true })} placeholder="Max discount" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input type="date" {...couponForm.register("validFrom")} className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input type="date" {...couponForm.register("validTo")} className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <button type="submit" className="w-full rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white">Save Coupon</button>
            </form>
          </div>
          <div className="space-y-4">
            {couponsQuery.data?.map((coupon) => (
              <div key={coupon._id} className="rounded-[32px] bg-white p-5 shadow-card">
                <p className="font-semibold text-ink">{coupon.code}</p>
                <p className="text-xs text-gray-500">{coupon.type} - {coupon.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "banners" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[32px] bg-white p-6 shadow-card">
            <h3 className="font-display text-xl text-ink">Create Banner</h3>
            <form className="mt-4 space-y-3" onSubmit={bannerForm.handleSubmit((values) => bannerMutation.mutate(values))}>
              <input {...bannerForm.register("title")} placeholder="Title" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input {...bannerForm.register("imageUrl")} placeholder="Image URL" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <input {...bannerForm.register("linkUrl")} placeholder="Link URL" className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-xs" />
              <button type="submit" className="w-full rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white">Save Banner</button>
            </form>
          </div>
          <div className="space-y-4">
            {bannersQuery.data?.map((banner) => (
              <div key={banner._id} className="rounded-[32px] bg-white p-5 shadow-card">
                <p className="font-semibold text-ink">{banner.title}</p>
                <p className="text-xs text-gray-500">{banner.imageUrl}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-6 rounded-[32px] bg-white p-6 shadow-card">
          <h3 className="font-display text-xl text-ink">Platform Reports</h3>
          <div className="mt-4 text-sm text-gray-600">
            <p>Orders: {reportsQuery.data?.ordersCount || 0}</p>
            <p>Commission: Rs {Math.round(reportsQuery.data?.commission || 0)}</p>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Add Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-sm text-gray-500">Close</button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit((values) => categoryMutation.mutate(values))}>
              <input
                {...register("name")}
                placeholder="Category name"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <input
                {...register("imageUrl")}
                placeholder="Image URL (optional)"
                className="w-full rounded-2xl border border-orange-100 px-4 py-2 text-sm"
              />
              <button type="submit" className="w-full rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white">
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedVendor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Edit Vendor</h3>
              <button onClick={() => setSelectedVendor(null)} className="text-sm text-gray-500">Close</button>
            </div>
            <form
              className="mt-4 grid gap-4 md:grid-cols-2"
              onSubmit={vendorForm.handleSubmit((values) => vendorUpdateMutation.mutate(values))}
            >
              <input
                {...vendorForm.register("restaurantName")}
                placeholder="Restaurant name"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              />
              <textarea
                {...vendorForm.register("description")}
                placeholder="Description"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              />
              <input
                {...vendorForm.register("address")}
                placeholder="Address"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              />
              <input
                {...vendorForm.register("city")}
                placeholder="City"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
              />
              <input
                {...vendorForm.register("zone")}
                placeholder="Zone"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
              />
              <input
                {...vendorForm.register("openingHours")}
                placeholder="Opening hours"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
              />
              <input
                type="number"
                {...vendorForm.register("minOrder", { valueAsNumber: true })}
                placeholder="Minimum order"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
              />
              <input
                type="number"
                {...vendorForm.register("deliveryFee", { valueAsNumber: true })}
                placeholder="Delivery fee"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm"
              />
              <input
                {...vendorForm.register("logoUrl")}
                placeholder="Logo URL"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              />
              <input
                {...vendorForm.register("coverImageUrl")}
                placeholder="Cover image URL"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              />
              <input
                type="number"
                step="0.01"
                {...vendorForm.register("commissionRate", { valueAsNumber: true })}
                placeholder="Commission rate (0.1)"
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              />
              <label className="flex items-center gap-2 text-xs text-gray-600 md:col-span-2">
                <input type="checkbox" {...vendorForm.register("isOpenManualOverride")} />
                Open for orders
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 md:col-span-2">
                <input type="checkbox" {...vendorForm.register("busyMode")} />
                Busy mode
              </label>
              <select
                {...vendorForm.register("status")}
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm md:col-span-2"
              >
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white md:col-span-2"
              >
                Save Vendor
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
