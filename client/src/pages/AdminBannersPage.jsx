import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminBannersPage = () => {
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "" });
  const [editing, setEditing] = useState(null);

  const bannersQuery = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => (await api.get("/api/banners")).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/api/banners", payload)).data.data,
    onSuccess: () => {
      setForm({ title: "", imageUrl: "", linkUrl: "" });
      bannersQuery.refetch();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/api/banners/${id}`, payload)).data.data,
    onSuccess: () => {
      setEditing(null);
      bannersQuery.refetch();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/banners/${id}`)).data.data,
    onSuccess: () => bannersQuery.refetch()
  });

  const submitBanner = () => {
    createMutation.mutate(form);
  };

  const startEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || ""
    });
  };

  const saveEdit = () => {
    if (!editing?._id) return;
    updateMutation.mutate({ id: editing._id, payload: form });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Banners</h1>
        <p className="text-sm text-slate-500">Manage home page banners and promotions.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="Link URL"
            value={form.linkUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={editing ? saveEdit : submitBanner}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            {editing ? "Update Banner" : "Save Banner"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Link</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(bannersQuery.data || []).map((banner) => (
                <tr key={banner._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{banner.title}</td>
                  <td className="px-4 py-3 text-slate-600">{banner.imageUrl}</td>
                  <td className="px-4 py-3 text-slate-600">{banner.linkUrl || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(banner)}
                        className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(banner._id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!bannersQuery.isLoading && (bannersQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No banners created yet.
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

export default AdminBannersPage;
