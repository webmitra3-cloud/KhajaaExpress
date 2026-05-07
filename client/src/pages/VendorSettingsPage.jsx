import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const VendorSettingsPage = () => {
  const [form, setForm] = useState({
    restaurantName: "",
    address: "",
    city: "",
    zone: "",
    logoUrl: "",
    coverImageUrl: "",
    openingHours: "",
    minOrder: "",
    deliveryFee: "",
    busyMode: false
  });

  const vendorQuery = useQuery({
    queryKey: ["vendor", "me"],
    queryFn: async () => (await api.get("/api/vendors/me")).data.data
  });

  useEffect(() => {
    if (!vendorQuery.data) return;
    setForm({
      restaurantName: vendorQuery.data.restaurantName || "",
      address: vendorQuery.data.address || "",
      city: vendorQuery.data.city || "",
      zone: vendorQuery.data.zone || "",
      logoUrl: vendorQuery.data.logoUrl || "",
      coverImageUrl: vendorQuery.data.coverImageUrl || "",
      openingHours: vendorQuery.data.openingHours || "",
      minOrder: vendorQuery.data.minOrder || "",
      deliveryFee: vendorQuery.data.deliveryFee || "",
      busyMode: vendorQuery.data.busyMode || false
    });
  }, [vendorQuery.data]);

  const updateVendor = useMutation({
    mutationFn: async (payload) => (await api.put("/api/vendors/me", payload)).data.data,
    onSuccess: () => vendorQuery.refetch()
  });

  const saveProfile = () => {
    updateVendor.mutate({
      restaurantName: form.restaurantName,
      address: form.address,
      city: form.city,
      zone: form.zone,
      logoUrl: form.logoUrl,
      coverImageUrl: form.coverImageUrl,
      openingHours: form.openingHours,
      minOrder: Number(form.minOrder || 0),
      deliveryFee: Number(form.deliveryFee || 0),
      busyMode: form.busyMode
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Profile & Settings</h1>
        <p className="text-sm text-slate-500">Manage restaurant profile and preferences.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Restaurant Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Restaurant name"
            value={form.restaurantName}
            onChange={(e) => setForm((prev) => ({ ...prev, restaurantName: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Opening hours"
            value={form.openingHours}
            onChange={(e) => setForm((prev) => ({ ...prev, openingHours: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Zone"
            value={form.zone}
            onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Minimum order"
            value={form.minOrder}
            onChange={(e) => setForm((prev) => ({ ...prev, minOrder: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Delivery fee"
            value={form.deliveryFee}
            onChange={(e) => setForm((prev) => ({ ...prev, deliveryFee: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="Logo URL"
            value={form.logoUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="Cover image URL"
            value={form.coverImageUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveProfile}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Save Profile
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Operations</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.busyMode}
              onChange={(e) => setForm((prev) => ({ ...prev, busyMode: e.target.checked }))}
            />
            Busy mode default
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveProfile}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Update Settings
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Theme & Security</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" defaultValue="Light">
            <option>Light</option>
            <option>Dark</option>
          </select>
          <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Current password" type="password" />
          <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="New password" type="password" />
          <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Confirm password" type="password" />
        </div>
        <div className="mt-4 flex justify-end">
          <button className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600">
            Change Password
          </button>
        </div>
      </section>
    </div>
  );
};

export default VendorSettingsPage;
