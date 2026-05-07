import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import api from "../lib/api";

const categories = ["Ingredients", "Staff", "Packaging", "Utilities", "Rent", "Misc"];

const VendorExpensesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: "", category: "", amount: "", note: "" });

  const expensesQuery = useQuery({
    queryKey: ["vendor", "expenses"],
    queryFn: async () => (await api.get("/api/expenses")).data.data
  });

  const reportQuery = useQuery({
    queryKey: ["vendor", "reports", "sales"],
    queryFn: async () => (await api.get("/api/reports/vendor/sales")).data.data
  });

  const addExpense = useMutation({
    mutationFn: async (payload) => (await api.post("/api/expenses", payload)).data.data,
    onSuccess: () => {
      setShowModal(false);
      setForm({ date: "", category: "", amount: "", note: "" });
      expensesQuery.refetch();
    }
  });

  const summary = useMemo(() => {
    const list = expensesQuery.data || [];
    const total = list.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = list.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const highestCategory = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0] || "-";
    const avgPerDay = list.length ? Math.round(total / list.length) : 0;
    const net = reportQuery.data?.net || 0;
    return {
      total,
      highestCategory,
      avgPerDay,
      profit: Math.round(net - total)
    };
  }, [expensesQuery.data, reportQuery.data]);

  const submitExpense = () => {
    addExpense.mutate({
      category: form.category,
      amount: Number(form.amount || 0),
      note: form.note,
      date: form.date ? new Date(form.date) : new Date()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Expenses</h1>
          <p className="text-sm text-slate-500">Track spending and estimate profit.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Expenses</p>
          <p className="mt-2 text-xl font-semibold text-ink">Rs {summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Highest Category</p>
          <p className="mt-2 text-xl font-semibold text-ink">{summary.highestCategory}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Avg per Entry</p>
          <p className="mt-2 text-xl font-semibold text-ink">Rs {summary.avgPerDay}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Estimated Profit</p>
          <p className="mt-2 text-xl font-semibold text-ink">Rs {summary.profit}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Expense Entries</h2>
          <button className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600">
            Export PDF
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {(expensesQuery.data || []).map((row) => (
                <tr key={row._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{row.category}</td>
                  <td className="px-4 py-3 font-semibold text-ink">Rs {row.amount}</td>
                  <td className="px-4 py-3 text-slate-500">{row.note || "-"}</td>
                </tr>
              ))}
              {!expensesQuery.isLoading && (expensesQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No expenses yet.
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
              <h2 className="text-lg font-semibold text-ink">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                type="date"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
              <select
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Note"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600"
              >
                Cancel
              </button>
              <button
                onClick={submitExpense}
                className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorExpensesPage;
