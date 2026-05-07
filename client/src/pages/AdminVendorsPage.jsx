import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const statusStyles = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-rose-50 text-rose-700"
};

const AdminVendorsPage = () => {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    restaurantName: "",
    description: "",
    address: "",
    city: "",
    zone: "",
    logoUrl: "",
    coverImageUrl: "",
    openingHours: "",
    minOrder: "",
    deliveryFee: "",
    commissionRate: "",
    status: "PENDING"
  });

  const vendorsQuery = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: async () => (await api.get("/api/vendors")).data.data
  });

  useEffect(() => {
    if (!selected) return;
    setForm({
      restaurantName: selected.restaurantName || "",
      description: selected.description || "",
      address: selected.address || "",
      city: selected.city || "",
      zone: selected.zone || "",
      logoUrl: selected.logoUrl || "",
      coverImageUrl: selected.coverImageUrl || "",
      openingHours: selected.openingHours || "",
      minOrder: selected.minOrder || "",
      deliveryFee: selected.deliveryFee || "",
      commissionRate: selected.commissionRate ?? 0.1,
      status: selected.status || "PENDING"
    });
  }, [selected]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/api/vendors/${id}/status`, { status })).data.data,
    onSuccess: () => vendorsQuery.refetch()
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => (await api.put(`/api/vendors/${selected._id}`, payload)).data.data,
    onSuccess: () => {
      setSelected(null);
      vendorsQuery.refetch();
    }
  });

  const saveVendor = () => {
    updateMutation.mutate({
      ...form,
      minOrder: Number(form.minOrder || 0),
      deliveryFee: Number(form.deliveryFee || 0),
      commissionRate: Number(form.commissionRate || 0)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Vendors</h1>
        <p className="text-sm text-slate-500">Approve, manage, and update vendor profiles.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Restaurant</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(vendorsQuery.data || []).map((vendor) => (
                <tr key={vendor._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{vendor.restaurantName}</td>
                  <td className="px-4 py-3 text-slate-600">{vendor.city}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[vendor.status]}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{Math.round((vendor.commissionRate || 0.1) * 100)}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => statusMutation.mutate({ id: vendor._id, status: "APPROVED" })}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: vendor._id, status: "REJECTED" })}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelected(vendor)}
                        className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-600"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!vendorsQuery.isLoading && (vendorsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No vendors yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Edit Vendor</h2>
              <button onClick={() => setSelected(null)} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
                placeholder="Restaurant name"
                value={form.restaurantName}
                onChange={(e) => setForm((prev) => ({ ...prev, restaurantName: e.target.value }))}
              />
              <textarea
                className="h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
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
                placeholder="Opening hours"
                value={form.openingHours}
                onChange={(e) => setForm((prev) => ({ ...prev, openingHours: e.target.value }))}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Min order"
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
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Commission rate (0.1)"
                value={form.commissionRate}
                onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
              />
              <select
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
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
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
              >
                Cancel
              </button>
              <button
                onClick={saveVendor}
                className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Save Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorsPage;
