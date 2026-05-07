import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import api from "../lib/api";

const tabs = ["Items", "Categories", "Add-ons", "Variants"];

const VendorMenuPage = () => {
  const [active, setActive] = useState("Items");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    categoryId: "",
    prepTimeMins: "",
    isAvailable: true,
    isVeg: false
  });

  const itemsQuery = useQuery({
    queryKey: ["vendor", "items"],
    queryFn: async () => (await api.get("/api/items/vendor/me")).data.data
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "public"],
    queryFn: async () => (await api.get("/api/categories/public")).data.data
  });

  const addItemMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/api/items", payload)).data.data,
    onSuccess: () => {
      setShowModal(false);
      setForm({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        categoryId: "",
        prepTimeMins: "",
        isAvailable: true,
        isVeg: false
      });
      itemsQuery.refetch();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/items/${id}`)).data.data,
    onSuccess: () => itemsQuery.refetch()
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }) =>
      (await api.put(`/api/items/${id}`, { isAvailable })).data.data,
    onSuccess: () => itemsQuery.refetch()
  });

  const categoryMap = useMemo(() => {
    const map = new Map();
    (categoriesQuery.data || []).forEach((cat) => map.set(cat._id, cat.name));
    return map;
  }, [categoriesQuery.data]);

  const submitItem = () => {
    addItemMutation.mutate({
      ...form,
      price: Number(form.price || 0),
      prepTimeMins: form.prepTimeMins ? Number(form.prepTimeMins) : undefined
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Menu Management</h1>
          <p className="text-sm text-slate-500">Organize categories, items, add-ons, and variants.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              active === tab ? "bg-orange-100 text-orange-700" : "bg-white text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Availability</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(itemsQuery.data || []).map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {item.price}</td>
                  <td className="px-4 py-3 text-slate-600">{categoryMap.get(item.categoryId) || "Uncategorized"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability.mutate({ id: item._id, isAvailable: !item.isAvailable })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs font-semibold text-orange-600">Edit</button>
                      <button
                        onClick={() => deleteMutation.mutate(item._id)}
                        className="text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!itemsQuery.isLoading && (itemsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No menu items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Add Menu Item</h2>
              <button onClick={() => setShowModal(false)} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Item name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              />
              <select
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {(categoriesQuery.data || []).map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
              <textarea
                className="h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Prep time (mins)"
                value={form.prepTimeMins}
                onChange={(e) => setForm((prev) => ({ ...prev, prepTimeMins: e.target.value }))}
              />
              <div className="flex items-center gap-3 text-sm text-slate-600 md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={form.isAvailable}
                    onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                  />
                  Available
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={form.isVeg}
                    onChange={(e) => setForm((prev) => ({ ...prev, isVeg: e.target.checked }))}
                  />
                  Veg item
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
              >
                Cancel
              </button>
              <button
                onClick={submitItem}
                className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
                disabled={addItemMutation.isPending}
              >
                {addItemMutation.isPending ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMenuPage;
