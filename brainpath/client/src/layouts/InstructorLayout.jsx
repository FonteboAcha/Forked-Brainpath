import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";

export default function InstructorLayout({ badges }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-canvas)" }}>
      <OfflineBanner />
      <Sidebar role="instructor" badges={badges} />
      <main className="flex-1 overflow-x-hidden pb-16 sm:pb-0">
        <Outlet />
      </main>
      <BottomNav role="instructor" />
    </div>
  );
}