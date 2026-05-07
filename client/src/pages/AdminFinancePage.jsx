import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const statusStyles = {
  REQUESTED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700"
};

const AdminFinancePage = () => {
  const walletQuery = useQuery({
    queryKey: ["admin", "wallet"],
    queryFn: async () => (await api.get("/api/wallet/me")).data.data
  });

  const transactionsQuery = useQuery({
    queryKey: ["admin", "wallet", "transactions"],
    queryFn: async () => (await api.get("/api/wallet/me/transactions")).data.data
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: async () => (await api.get("/api/payouts/admin")).data.data
  });

  const revenueQuery = useQuery({
    queryKey: ["admin", "reports", "revenue"],
    queryFn: async () => (await api.get("/api/reports/admin/revenue")).data.data
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => (await api.put(`/api/payouts/${id}/approve`)).data.data,
    onSuccess: () => payoutsQuery.refetch()
  });

  const paidMutation = useMutation({
    mutationFn: async (id) => (await api.put(`/api/payouts/${id}/paid`)).data.data,
    onSuccess: () => payoutsQuery.refetch()
  });

  const cards = [
    { label: "Platform Wallet", value: `Rs ${walletQuery.data?.balance ?? 0}` },
    { label: "Commission Earned", value: `Rs ${Math.round(revenueQuery.data?.commission || 0)}` },
    { label: "Total Orders", value: revenueQuery.data?.ordersCount || 0 },
    { label: "Payouts Pending", value: (payoutsQuery.data || []).filter((p) => p.status === "REQUESTED").length }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Finance</h1>
        <p className="text-sm text-slate-500">Track platform revenue, payouts, and wallet balance.</p>
      </div>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Wallet Transactions</h2>
          <button className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600">
            Export PDF
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(transactionsQuery.data || []).map((row) => (
                <tr key={row._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{row.type}</td>
                  <td className="px-4 py-3 text-slate-600">{row.refOrderId || row.refPayoutId || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.amount > 0 ? `+Rs ${row.amount}` : `-Rs ${Math.abs(row.amount)}`}</td>
                </tr>
              ))}
              {!transactionsQuery.isLoading && (transactionsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Payout Requests</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(payoutsQuery.data || []).map((payout) => (
                <tr key={payout._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{payout.vendorId}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {payout.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[payout.status]}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => approveMutation.mutate(payout._id)}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => paidMutation.mutate(payout._id)}
                        className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-600"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!payoutsQuery.isLoading && (payoutsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No payout requests.
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

export default AdminFinancePage;
