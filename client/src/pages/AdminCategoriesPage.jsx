import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

const AdminCategoriesPage = () => {
  const [form, setForm] = useState({ name: "", imageUrl: "" });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await api.get("/api/categories/public")).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/api/categories", payload)).data.data,
    onSuccess: () => {
      toast.success("Category added");
      setForm({ name: "", imageUrl: "" });
      categoriesQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add category");
    }
  });

  const submitCategory = () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    createMutation.mutate({ name, imageUrl: form.imageUrl.trim() });
  };

  const isSubmitting = createMutation.isPending;
  const isDisabled = isSubmitting || !form.name.trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Categories</h1>
        <p className="text-sm text-slate-500">Manage food categories shown to customers.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Category name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={submitCategory}
            disabled={isDisabled}
            className={`rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white ${
              isDisabled ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {isSubmitting ? "Saving..." : "Add Category"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Image</th>
              </tr>
            </thead>
            <tbody>
              {(categoriesQuery.data || []).map((cat) => (
                <tr key={cat._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-600">{cat.imageUrl || "-"}</td>
                </tr>
              ))}
              {!categoriesQuery.isLoading && (categoriesQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={2}>
                    No categories yet.
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

export default AdminCategoriesPage;
