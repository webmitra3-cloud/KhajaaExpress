import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, LayoutDashboard, ClipboardList, UtensilsCrossed, Wallet, Receipt, BarChart3, Settings } from "lucide-react";
import { useAuth } from "../app/AuthProvider";
import api from "../lib/api";

const navItems = [
  { to: "/vendor", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vendor/orders", label: "Orders", icon: ClipboardList },
  { to: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/vendor/finance", label: "Finance", icon: Wallet },
  { to: "/vendor/expenses", label: "Expenses", icon: Receipt },
  { to: "/vendor/reports", label: "Reports", icon: BarChart3 },
  { to: "/vendor/settings", label: "Profile/Settings", icon: Settings }
];

const VendorLayout = () => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState("7 days");

  const vendorQuery = useQuery({
    queryKey: ["vendor", "me"],
    queryFn: async () => (await api.get("/api/vendors/me")).data.data
  });

  useEffect(() => {
    if (!vendorQuery.data) return;
    setOpen(vendorQuery.data.isOpenManualOverride ?? true);
    setBusy(vendorQuery.data.busyMode ?? false);
  }, [vendorQuery.data]);

  const statusMutation = useMutation({
    mutationFn: async (payload) => (await api.put("/api/vendors/me", payload)).data.data
  });

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    statusMutation.mutate({ isOpenManualOverride: next });
  };

  const toggleBusy = () => {
    const next = !busy;
    setBusy(next);
    statusMutation.mutate({ busyMode: next });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="h-10 w-10 rounded-2xl bg-primary-500 text-white grid place-items-center font-bold">K</div>
          <div>
            <p className="text-sm font-semibold text-ink">Khaja Express</p>
            <p className="text-xs text-orange-400">Vendor Panel</p>
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-orange-50 text-orange-700 border-l-4 border-primary-500"
                    : "text-gray-600 hover:bg-orange-50/60"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm text-gray-500">Vendor Dashboard</p>
              <h1 className="text-xl font-semibold text-ink">Khaja Express</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleOpen}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  open ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {open ? "Open" : "Closed"}
              </button>
              <button
                onClick={toggleBusy}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  busy ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {busy ? "Busy" : "Normal"}
              </button>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 px-3 text-xs"
              >
                {"Today,7 days,30 days,Custom".split(",").map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-orange-50 text-orange-600">
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={logout}
                className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
