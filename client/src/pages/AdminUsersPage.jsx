import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const AdminUsersPage = () => {
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await api.get("/api/users")).data.data
  });

  const userActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => (await api.put(`/api/users/${id}/active`, { isActive })).data.data,
    onSuccess: () => usersQuery.refetch()
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Users</h1>
        <p className="text-sm text-slate-500">View and manage platform users.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data || []).map((user) => (
                <tr key={user._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.role}</td>
                  <td className="px-4 py-3 text-slate-600">{user.isActive ? "Active" : "Blocked"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => userActiveMutation.mutate({ id: user._id, isActive: !user.isActive })}
                      className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-600"
                    >
                      {user.isActive ? "Block" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))}
              {!usersQuery.isLoading && (usersQuery.data || []).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No users found.
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

export default AdminUsersPage;
