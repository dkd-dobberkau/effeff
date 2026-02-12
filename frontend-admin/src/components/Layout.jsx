import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        <div className="mt-auto border-t border-gray-800 pt-4">
          {user && (
            <div className="mb-2 truncate px-2 text-xs text-gray-500">
              {user.email}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-950 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
