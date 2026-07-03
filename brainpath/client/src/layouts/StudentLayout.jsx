import { Outlet } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";

export default function StudentLayout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-canvas)" }}>
      <OfflineBanner />
      {/* Desktop top nav — hidden on mobile */}
      <TopNav />

      {/* Page content
          pt-0 on desktop (TopNav is sticky, not padding-based)
          pb-16 on mobile to clear the fixed bottom nav */}
      <main className="pb-16 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav — hidden on desktop (sm:hidden in component) */}
      <BottomNav role="student" />
    </div>
  );
}