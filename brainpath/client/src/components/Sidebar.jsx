import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";
import {
  LayoutDashboard, UserCheck, Users, BookOpen,
  Video, BarChart2, PenLine, LogOut,
} from "lucide-react";

const adminNav = [
  {
    group: "Overview",
    items: [
      { to: "/admin",            label: "Dashboard", Icon: LayoutDashboard, end: true },
      { to: "/admin/requests",   label: "Requests",  Icon: UserCheck, badge: "requests" },
      { to: "/admin/users",      label: "Users",     Icon: Users     },
      { to: "/admin/courses",    label: "Courses",   Icon: BookOpen  },
    ],
  },
  {
    group: "Live",
    items: [
      { to: "/admin/sessions",   label: "Sessions",  Icon: Video, badge: "live" },
    ],
  },
];

const instructorNav = [
  {
    group: "Teaching",
    items: [
      { to: "/instructor",          label: "Dashboard",     Icon: LayoutDashboard, end: true },
      { to: "/instructor/courses",  label: "My Courses",    Icon: BookOpen  },
      { to: "/instructor/builder",  label: "Lesson Builder",Icon: PenLine   },
    ],
  },
  {
    group: "Engagement",
    items: [
      { to: "/instructor/sessions", label: "Live Sessions", Icon: Video     },
      { to: "/instructor/analytics",label: "Analytics",     Icon: BarChart2 },
    ],
  },
];

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar({ role, badges = {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navGroups = role === "admin" ? adminNav : instructorNav;
  const subtitle = role === "admin" ? "Admin console" : "Instructor portal";
  const avatarColor = role === "admin"
    ? "bg-blue-50 text-blue-700"
    : "bg-emerald-50 text-emerald-700";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="hidden sm:flex flex-col w-52 shrink-0 bg-slate-50 border-r border-slate-200 min-h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200">
        <Logo size="sm" />
        <p className="bp-micro text-slate-400 mt-1.5 pl-0.5">{subtitle}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navGroups.map(({ group, items }) => (
          <div key={group}>
            <p className="bp-body font-medium uppercase tracking-widest text-slate-400 px-2 mb-1.5">
              {group}
            </p>
            {items.map(({ to, label, Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg bp-body font-medium mb-0.5 transition-colors ${
                    isActive
                      ? "bg-brand-blue text-white"
                      : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="flex-1">{label}</span>
                    {badge && badges[badge] ? (
                      <span className={`bp-micro font-medium px-1.5 py-0.5 rounded-full ${
                        badge === "live"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {badges[badge]}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-2.5 py-3 border-t border-slate-200">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${avatarColor}`}>
            {initials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="bp-sub font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="bp-micro text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2.5 py-2 mt-1 rounded-lg bp-sub text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <LogOut size={13} />
          Log out
        </button>
      </div>
    </aside>
  );
}