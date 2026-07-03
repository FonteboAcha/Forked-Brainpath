import { NavLink, useNavigate } from "react-router-dom";
import { Home, BookOpen, Video, User, LogOut, Download } from "lucide-react";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/dashboard",  label: "Home",    Icon: Home     },
  { to: "/courses",    label: "Courses", Icon: BookOpen },
  { to: "/live",       label: "Live",    Icon: Video    },
  { to: "/offline",    label: "Offline",  Icon: Download  },
];

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="hidden sm:flex items-center justify-between h-14 px-8 bg-white border-b border-slate-200/60 sticky top-0 z-40">
      {/* Left — logo */}
      <Logo size="lg" />

      {/* Center-right — nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg bp-sub font-medium transition-colors ${
                isActive
                  ? "text-brand-blue bg-blue-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Right — avatar + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center bp-micro font-semibold">
            {initials(user?.name)}
          </div>
          <span className="bp-sub font-medium text-slate-700 hidden md:block">
            {user?.name?.split(" ")[0]}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bp-sub text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Log out"
        >
          <LogOut size={14} />
          <span className="hidden md:block">Log out</span>
        </button>
      </div>
    </header>
  );
}