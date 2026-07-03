import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
export default function AdminLayout({ badges }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-canvas)" }}>
      <OfflineBanner />
      <Sidebar role="admin" badges={badges} />
      <main className="flex-1 overflow-x-hidden p-6">
        <Outlet />
      </main>
    </div>
  );
}