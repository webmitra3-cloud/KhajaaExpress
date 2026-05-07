import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminSettingsPage = () => {
  const [form, setForm] = useState({
    deliveryFeeDefault: "",
    minOrderDefault: "",
    supportEmail: "",
    heroMessage: "",
    isOpen: true
  });

  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => (await api.get("/api/settings")).data.data
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      deliveryFeeDefault: settingsQuery.data.deliveryFeeDefault ?? 0,
      minOrderDefault: settingsQuery.data.minOrderDefault ?? 0,
      supportEmail: settingsQuery.data.supportEmail || "",
      heroMessage: settingsQuery.data.heroMessage || "",
      isOpen: settingsQuery.data.isOpen ?? true
    });
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => (await api.put("/api/settings", payload)).data.data,
    onSuccess: () => settingsQuery.refetch()
  });

  const saveSettings = () => {
    updateMutation.mutate({
      deliveryFeeDefault: Number(form.deliveryFeeDefault || 0),
      minOrderDefault: Number(form.minOrderDefault || 0),
      supportEmail: form.supportEmail,
      heroMessage: form.heroMessage,
      isOpen: form.isOpen
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        <p className="text-sm text-slate-500">Configure platform defaults and messaging.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Default delivery fee"
            value={form.deliveryFeeDefault}
            onChange={(e) => setForm((prev) => ({ ...prev, deliveryFeeDefault: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Default min order"
            value={form.minOrderDefault}
            onChange={(e) => setForm((prev) => ({ ...prev, minOrderDefault: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="Support email"
            value={form.supportEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="Hero message"
            value={form.heroMessage}
            onChange={(e) => setForm((prev) => ({ ...prev, heroMessage: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.isOpen}
              onChange={(e) => setForm((prev) => ({ ...prev, isOpen: e.target.checked }))}
            />
            Platform accepting orders
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveSettings}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Save Settings
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminSettingsPage;
