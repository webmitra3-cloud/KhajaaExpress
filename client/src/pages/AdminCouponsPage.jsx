import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminCouponsPage = () => {
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: "",
    minOrder: "",
    maxDiscount: "",
    validFrom: "",
    validTo: ""
  });

  const couponsQuery = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => (await api.get("/api/coupons")).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/api/coupons", payload)).data.data,
    onSuccess: () => {
      setForm({ code: "", type: "PERCENT", value: "", minOrder: "", maxDiscount: "", validFrom: "", validTo: "" });
      couponsQuery.refetch();
    }
  });

  const submitCoupon = () => {
    createMutation.mutate({
      ...form,
      value: Number(form.value || 0),
      minOrder: Number(form.minOrder || 0),
      maxDiscount: Number(form.maxDiscount || 0)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Coupons</h1>
        <p className="text-sm text-slate-500">Create and manage promotional coupons.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
          <select
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="PERCENT">Percent</option>
            <option value="FLAT">Flat</option>
          </select>
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Value"
            value={form.value}
            onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Min order"
            value={form.minOrder}
            onChange={(e) => setForm((prev) => ({ ...prev, minOrder: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Max discount"
            value={form.maxDiscount}
            onChange={(e) => setForm((prev) => ({ ...prev, maxDiscount: e.target.value }))}
          />
          <input
            type="date"
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            value={form.validFrom}
            onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
          />
          <input
            type="date"
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            value={form.validTo}
            onChange={(e) => setForm((prev) => ({ ...prev, validTo: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={submitCoupon}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Save Coupon
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Validity</th>
              </tr>
            </thead>
            <tbody>
              {(couponsQuery.data || []).map((coupon) => (
                <tr key={coupon._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{coupon.code}</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.type}</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.value}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : "-"} - {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
              {!couponsQuery.isLoading && (couponsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No coupons created yet.
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

export default AdminCouponsPage;
