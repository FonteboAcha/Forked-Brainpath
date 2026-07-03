import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video, Plus, Play, Square, Trash2,
  Clock, Users, Calendar, ExternalLink,
} from "lucide-react";
import api from "../../lib/axios.js";

function formatDateTime(dateStr) {
  if (!dateStr) return "Immediately";
  return new Date(dateStr).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff < 0) return "overdue";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

const STATUS_STYLE = {
  scheduled: { bg: "rgba(59,130,246,0.08)",  color: "#1d4ed8",  label: "Scheduled" },
  live:      { bg: "rgba(16,185,129,0.1)",   color: "#065f46",  label: "Live now"  },
  ended:     { bg: "rgba(100,116,139,0.08)", color: "#475569",  label: "Ended"     },
  cancelled: { bg: "rgba(239,68,68,0.08)",   color: "#991b1b",  label: "Cancelled" },
};

export default function InstructorSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    course_id: "",
    scheduled_at: "",
    start_now: false,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [sessRes, courseRes] = await Promise.all([
        api.get("/instructor/sessions"),
        api.get("/instructor/courses"),
      ]);
      setSessions(sessRes.data);
      setCourses(courseRes.data);
    } catch {
      setError("Could not load sessions");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.course_id) {
      setError("Title and course are required");
      return;
    }
    setActionLoading("create");
    try {
      await api.post("/instructor/sessions", {
        title: form.title,
        course_id: form.course_id,
        scheduled_at: form.start_now ? null : form.scheduled_at || null,
      });
      setForm({ title: "", course_id: "", scheduled_at: "", start_now: false });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create session");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStart(id) {
  setActionLoading(id);
  try {
    const { data } = await api.patch(`/instructor/sessions/${id}/start`);
    navigate(`/instructor/sessions/${id}/room`, {
      state: { room_id: data.room_id, title: data.title },
    });
  } catch {
    setError("Could not start session");
  } finally {
    setActionLoading(null);
  }
}

 async function handleJoin(roomId, sessionId, title) {
  navigate(`/instructor/sessions/${sessionId}/room`, {
    state: { room_id: roomId, title },
  });
}

  async function handleEnd(id) {
    setActionLoading(id);
    try {
      await api.patch(`/instructor/sessions/${id}/end`);
      fetchAll();
    } catch {
      setError("Could not end session");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this session?")) return;
    setActionLoading(id);
    try {
      await api.delete(`/instructor/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Could not delete session");
    } finally {
      setActionLoading(null);
    }
  }

  const upcoming = sessions.filter((s) =>
    ["scheduled", "live"].includes(s.status)
  );
  const past = sessions.filter((s) =>
    ["ended", "cancelled"].includes(s.status)
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="bp-display text-slate-900">Live Sessions</h1>
          <p className="bp-body text-slate-400 mt-1">
            Schedule or start live classes for your students
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bp-sub font-semibold px-4 py-2.5 rounded-lg text-white shrink-0 hover:bg-blue-600 transition-colors"
          style={{ background: "#3B82F6" }}
        >
          <Plus size={15} />
          New session
        </button>
      </div>

      {error && (
        <div className="bp-body text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Create session form */}
      {showForm && (
        <div className="bp-card">
          <h2 className="bp-heading text-slate-900 mb-5">New live session</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
                  Session title <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Module 2 Q&A Session"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
                  Course <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue bg-white"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start now toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, start_now: !form.start_now })}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  form.start_now ? "bg-brand-blue" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    form.start_now ? "left-6" : "left-1"
                  }`}
                />
              </button>
              <span className="bp-body text-slate-700">Start immediately</span>
            </div>

            {/* Scheduled date/time — only shown if not starting now */}
            {!form.start_now && (
              <div>
                <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
                  Schedule for
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_at: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={actionLoading === "create"}
                className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
                style={{ background: "#3B82F6" }}
              >
                {actionLoading === "create"
                  ? "Creating..."
                  : form.start_now
                  ? "Start now"
                  : "Schedule session"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming + live sessions */}
      <div>
        <h2 className="bp-heading text-slate-900 mb-4">
          Upcoming & live
          {upcoming.length > 0 && (
            <span className="ml-2 bp-micro font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {upcoming.length}
            </span>
          )}
        </h2>

        {upcoming.length === 0 ? (
          <div className="bp-card text-center py-12">
            <Video size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="bp-body text-slate-400 mb-2">No upcoming sessions</p>
            <p className="bp-sub text-slate-400">
              Create a session to start teaching live
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => {
              const style = STATUS_STYLE[session.status];
              const isLive = session.status === "live";

              return (
                <div key={session.id} className="bp-card">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isLive
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(59,130,246,0.08)",
                      }}
                    >
                      <Video
                        size={20}
                        style={{ color: isLive ? "#10B981" : "#3B82F6" }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="bp-sub font-semibold text-slate-900">
                          {session.title}
                        </p>
                        <span
                          className="bp-micro font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="bp-micro text-slate-500 truncate">
                        {session.course_title}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="bp-micro text-slate-400 flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDateTime(session.scheduled_at)}
                        </span>
                        {!isLive && session.scheduled_at && (
                          <span className="bp-micro text-brand-blue font-semibold">
                            {timeUntil(session.scheduled_at)}
                          </span>
                        )}
                        <span className="bp-micro text-slate-400 flex items-center gap-1">
                          <Users size={11} />
                          {session.attendee_count} joined
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isLive ? (
                        <>
                          <button
                            onClick={() => handleJoin(session.room_id, session.id, session.title)}
                            className="flex items-center gap-1.5 bp-sub font-semibold px-3 py-1.5 rounded-lg text-white hover:bg-emerald-600 transition-colors"
                            style={{ background: "#10B981" }}
                          >
                            <ExternalLink size={13} />
                            Rejoin
                          </button>
                          <button
                            onClick={() => handleEnd(session.id)}
                            disabled={actionLoading === session.id}
                            className="flex items-center gap-1.5 bp-sub font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Square size={13} />
                            End
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStart(session.id)}
                            disabled={actionLoading === session.id}
                            className="flex items-center gap-1.5 bp-sub font-semibold px-3 py-1.5 rounded-lg text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                            style={{ background: "#3B82F6" }}
                          >
                            <Play size={13} />
                            {actionLoading === session.id
                              ? "Starting..."
                              : "Start"}
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            disabled={actionLoading === session.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <h2 className="bp-heading text-slate-900 mb-4">Past sessions</h2>
          <div className="space-y-3">
            {past.map((session) => {
              const style = STATUS_STYLE[session.status];
              return (
                <div
                  key={session.id}
                  className="bp-card flex items-center gap-4 opacity-75"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Video size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="bp-sub font-semibold text-slate-700 truncate">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="bp-micro text-slate-400 truncate">
                        {session.course_title}
                      </p>
                      <span className="bp-micro text-slate-400 flex items-center gap-1">
                        <Users size={10} />
                        {session.attendee_count}
                      </span>
                      <span className="bp-micro text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <span
                    className="bp-micro font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}