import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="text-center space-y-3">
        <h1 className="text-xl font-medium text-slate-900">
          Brain<span className="text-brand-blue">Path</span>
        </h1>
        <p className="text-slate-500">Welcome, {user?.name}</p>
        <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-lg px-4 py-2">
          Role: <span className="font-medium text-slate-700">{user?.role}</span>
        </p>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Log out
        </button>
      </div>
    </div>
  );
}