import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../lib/api";

const statusStyles = {
  PAID: "bg-emerald-50 text-emerald-700",
  REQUESTED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-rose-50 text-rose-700"
};

const VendorFinancePage = () => {
  const [amount, setAmount] = useState("");

  const walletQuery = useQuery({
    queryKey: ["vendor", "wallet"],
    queryFn: async () => (await api.get("/api/wallet/me")).data.data
  });

  const transactionsQuery = useQuery({
    queryKey: ["vendor", "wallet", "transactions"],
    queryFn: async () => (await api.get("/api/wallet/me/transactions")).data.data
  });

  const payoutsQuery = useQuery({
    queryKey: ["vendor", "payouts"],
    queryFn: async () => (await api.get("/api/payouts/vendor")).data.data
  });

  const reportQuery = useQuery({
    queryKey: ["vendor", "reports", "sales"],
    queryFn: async () => (await api.get("/api/reports/vendor/sales")).data.data
  });

  const payoutMutation = useMutation({
    mutationFn: async (amountValue) => (await api.post("/api/payouts/request", { amount: amountValue })).data.data,
    onSuccess: () => {
      setAmount("");
      payoutsQuery.refetch();
      walletQuery.refetch();
    }
  });

  const pendingPayouts = (payoutsQuery.data || []).filter((p) => p.status === "REQUESTED");
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  const walletCards = [
    { label: "Wallet Balance", value: `Rs ${walletQuery.data?.balance ?? 0}` },
    { label: "Total Earnings", value: `Rs ${Math.round(reportQuery.data?.net || 0)}` },
    { label: "Platform Fee", value: `Rs ${Math.round(reportQuery.data?.gross - (reportQuery.data?.net || 0) || 0)}` },
    { label: "Payouts Paid", value: `Rs ${Math.round((payoutsQuery.data || []).filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0))}` },
    { label: "Payouts Pending", value: `Rs ${totalPending}` }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Finance</h1>
        <p className="text-sm text-slate-500">Track wallet balance, commissions, and payouts.</p>
      </div>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {walletCards.map((card) => (
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
                <th className="px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(transactionsQuery.data || []).map((row) => (
                <tr key={row._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{row.type}</td>
                  <td className="px-4 py-3 text-slate-600">{row.refOrderId || row.refPayoutId || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.amount > 0 ? `+Rs ${row.amount}` : `-Rs ${Math.abs(row.amount)}`}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {walletQuery.data?.balance ?? 0}</td>
                </tr>
              ))}
              {!transactionsQuery.isLoading && (transactionsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Payout Requests</h2>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <button
              onClick={() => payoutMutation.mutate(Number(amount))}
              className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
            >
              Request Payout
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Request ID</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(payoutsQuery.data || []).map((row) => (
                <tr key={row._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-ink">{row._id}</td>
                  <td className="px-4 py-3 text-slate-600">Rs {row.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs font-semibold text-orange-600">View</button>
                  </td>
                </tr>
              ))}
              {!payoutsQuery.isLoading && (payoutsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No payout requests yet.
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

export default VendorFinancePage;
