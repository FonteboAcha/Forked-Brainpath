import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    // Redirect to the right place based on actual role
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "instructor") return <Navigate to="/instructor" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // If children passed, render them (used for single-page wrapping)
  // If not, render Outlet (used for layout route wrapping)
  return children ?? <Outlet />;
}