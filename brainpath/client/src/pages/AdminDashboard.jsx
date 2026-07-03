import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/axios.js";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [s, r, sg] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/instructor-requests?status=pending"),
        api.get("/admin/recent-signups"),
      ]);
      setStats(s.data);
      setRequests(r.data);
      setSignups(sg.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id, action) {
    try {
      await api.patch(`/admin/instructor-requests/${id}/${action}`);
      setActionMsg(`Request ${action === "approve" ? "approved" : "rejected"} successfully`);
      setTimeout(() => setActionMsg(""), 3000);
      fetchAll();
    } catch (err) {
      setActionMsg(err.response?.data?.message || "Action failed");
    }
  }

  function initials(name) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-slate-900">
            Brain<span className="text-brand-blue">Path</span> Admin
          </h1>
          <p className="text-sm text-slate-400">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5"
        >
          Log out
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2">
          {actionMsg}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Students", value: stats?.students ?? 0 },
          { label: "Instructors", value: stats?.instructors ?? 0 },
          { label: "Courses", value: stats?.courses ?? 0 },
          { label: "Live now", value: stats?.liveSessions ?? 0, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-medium ${highlight ? "text-brand-emerald" : "text-slate-900"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

        {/* Pending instructor requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Pending requests
            </p>
            {stats?.pendingRequests > 0 && (
              <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5">
                {stats.pendingRequests} new
              </span>
            )}
          </div>

          {requests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {initials(r.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.subject_areas}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleDecision(r.id, "approve")}
                      className="text-xs bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision(r.id, "reject")}
                      className="text-xs bg-red-50 border border-red-300 text-red-600 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
            Recent signups
          </p>
          {signups.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No signups yet</p>
          ) : (
            <div className="space-y-3">
              {signups.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">{timeAgo(u.created_at)}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-brand-blue border border-blue-200 rounded-full px-2 py-0.5 flex-shrink-0">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress stats */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
          Platform-wide progress
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-medium text-brand-blue">
              {stats?.progress?.avg_completion ?? 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Avg. completion</p>
          </div>
          <div className="border-x border-slate-100">
            <p className="text-2xl font-medium text-brand-emerald">
              {stats?.progress?.avg_quiz_score ?? 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Avg. quiz score</p>
          </div>
          <div>
            <p className="text-2xl font-medium text-brand-amber">
              {stats?.progress?.lessons_completed ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Lessons completed</p>
          </div>
        </div>
      </div>

    </div>
  );
}