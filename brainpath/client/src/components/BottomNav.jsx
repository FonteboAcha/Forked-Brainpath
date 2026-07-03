import { NavLink } from "react-router-dom";
import { Home, BookOpen, BarChart2, Download, User, Video } from "lucide-react";

const studentNav = [
  { to: "/dashboard",  label: "Home",     Icon: Home      },
  { to: "/courses",    label: "Courses",  Icon: BookOpen  },
  { to: "/live",       label: "Live",    Icon: Video    },
  { to: "/offline",    label: "Offline",  Icon: Download  },
  { to: "/profile",    label: "Profile",  Icon: User      },
];

const instructorNav = [
  { to: "/instructor",           label: "Home",     Icon: Home      },
  { to: "/instructor/courses",   label: "Courses",  Icon: BookOpen  },
  { to: "/instructor/sessions",  label: "Live",     Icon: BarChart2 },
  { to: "/instructor/analytics", label: "Analytics",Icon: BarChart2 },
  { to: "/instructor/builder",   label: "Builder",  Icon: User      },
];

export default function BottomNav({ role = "student" }) {
  const items = role === "instructor" ? instructorNav : studentNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 sm:hidden">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to.endsWith("/dashboard") || to.endsWith("/instructor")}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-brand-blue" : "text-slate-400"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}