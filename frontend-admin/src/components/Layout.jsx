import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-gray-800 bg-gray-950 px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">FormFlow</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
              }`
            }
          >
            <LayoutDashboard size={18} />
            Formulare
          </NavLink>
        </nav>
        <div className="mt-auto pt-4 text-xs text-gray-600">FormFlow v1.0</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-950 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
