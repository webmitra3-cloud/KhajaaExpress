import { Link, NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  Users,
  Wallet,
  Ticket,
  BadgePercent,
  Image,
  Settings,
  BarChart3,
  Grid3X3,
  Bell
} from "lucide-react";
import { useAuth } from "../app/AuthProvider";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/vendors", label: "Vendors", icon: Store },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/finance", label: "Finance", icon: Wallet },
  { to: "/admin/categories", label: "Categories", icon: Grid3X3 },
  { to: "/admin/tickets", label: "Tickets", icon: Ticket },
  { to: "/admin/coupons", label: "Coupons", icon: BadgePercent },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const [range, setRange] = useState("7 days");

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-500 font-bold text-white">K</div>
          <div>
            <p className="text-sm font-semibold text-ink">Khaja Express</p>
            <p className="text-xs text-orange-400">Admin Panel</p>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "border-l-4 border-primary-500 bg-orange-50 text-orange-700"
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
              <p className="text-sm text-slate-500">Admin Overview</p>
              <h1 className="text-xl font-semibold text-ink">Khaja Express</h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 px-3 text-xs"
              >
                {"Today,7 days,30 days,Custom".split(",").map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <Link
                to="/admin/banners"
                className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-700"
              >
                Manage Carousel
              </Link>
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

export default AdminLayout;
