import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminTicketsPage = () => {
  const ticketsQuery = useQuery({
    queryKey: ["admin", "tickets"],
    queryFn: async () => (await api.get("/api/tickets")).data.data
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/api/tickets/${id}`, { status })).data.data,
    onSuccess: () => ticketsQuery.refetch()
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Support Tickets</h1>
        <p className="text-sm text-slate-500">Handle customer issues and disputes.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(ticketsQuery.data || []).map((ticket) => (
                <tr key={ticket._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{ticket.category}</td>
                  <td className="px-4 py-3 text-slate-600">{ticket.message}</td>
                  <td className="px-4 py-3 text-slate-600">{ticket.status}</td>
                  <td className="px-4 py-3">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateMutation.mutate({ id: ticket._id, status: e.target.value })}
                      className="h-9 rounded-xl border border-slate-200 px-3 text-xs"
                    >
                      {"OPEN,IN_PROGRESS,RESOLVED,REJECTED".split(",").map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {!ticketsQuery.isLoading && (ticketsQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                    No support tickets.
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

export default AdminTicketsPage;
