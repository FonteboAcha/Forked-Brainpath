import { useEffect, useState } from "react";
import { Video, Calendar, ExternalLink, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios.js";

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff < 0) return "starting soon";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

export default function StudentLive() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/student/sessions");
      setSessions(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load sessions — make sure you are enrolled in at least one course"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(session) {
  setJoining(session.id);
  try {
    const { data } = await api.post(`/student/sessions/${session.id}/join`);
    navigate(`/live/${session.id}`, {
      state: {
        room_id: data.room_id,  // matches what JitsiRoom reads
        title: data.title,
      },
    });
  } catch (err) {
    setError(err.response?.data?.message || "Could not join session");
    setJoining(null);
  } finally {
    setJoining(null);
  }
}

  const liveSessions = sessions.filter((s) => s.status === "live");
  const upcomingSessions = sessions.filter((s) => s.status === "scheduled");

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8 space-y-8">

      <div>
        <h1 className="bp-display text-slate-900">Live Sessions</h1>
        <p className="bp-body text-slate-400 mt-1">
          Join live classes from your instructors
        </p>
      </div>

      {error && (
        <div
          className="bp-body px-4 py-3 rounded-lg"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "0.5px solid rgba(239,68,68,0.2)",
            color: "#991b1b",
          }}
        >
          {error}
          <button
            onClick={fetchSessions}
            className="ml-3 underline text-brand-blue"
          >
            Retry
          </button>
        </div>
      )}

      {/* Live now */}
      {liveSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            <h2 className="bp-heading text-slate-900">Live now</h2>
          </div>
          <div className="space-y-3">
            {liveSessions.map((session) => (
              <div
                key={session.id}
                className="bp-card"
                style={{
                  background: "rgba(16,185,129,0.03)",
                  border: "0.5px solid rgba(16,185,129,0.25)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(16,185,129,0.1)" }}
                  >
                    <Video size={22} className="text-brand-emerald" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="bp-sub font-semibold text-slate-900 truncate">
                      {session.title}
                    </p>
                    <p className="bp-micro text-slate-500 mt-0.5 truncate">
                      {session.course_title} · {session.instructor_name}
                    </p>
                    {session.joined && (
                      <p className="bp-micro text-brand-emerald font-semibold mt-1">
                        ✓ You joined this session
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleJoin(session)}
                    disabled={joining === session.id}
                    className="flex items-center gap-2 bp-sub font-semibold px-4 py-2.5 rounded-lg text-white shrink-0 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    style={{ background: "#10B981" }}
                  >
                    {joining === session.id ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    {joining === session.id ? "Joining..." : "Join now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="bp-heading text-slate-900 mb-4">Upcoming sessions</h2>

        {sessions.length === 0 && !error ? (
          <div className="bp-card text-center py-16">
            <Video size={40} className="text-slate-200 mx-auto mb-4" />
            <h2 className="bp-heading text-slate-700 mb-2">
              No sessions scheduled
            </h2>
            <p className="bp-body text-slate-400">
              Your instructors have not scheduled any live classes yet.
              Check back soon.
            </p>
          </div>
        ) : upcomingSessions.length === 0 && liveSessions.length > 0 ? (
          <div className="bp-card text-center py-8">
            <p className="bp-body text-slate-400">No more upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="bp-card">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(59,130,246,0.08)" }}
                  >
                    <Video size={20} className="text-brand-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="bp-sub font-semibold text-slate-900 truncate">
                      {session.title}
                    </p>
                    <p className="bp-micro text-slate-500 mt-0.5 truncate">
                      {session.course_title} · {session.instructor_name}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="bp-micro text-slate-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                      <span className="bp-micro font-semibold text-brand-blue">
                        {timeUntil(session.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <span
                    className="bp-micro font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      color: "#1d4ed8",
                    }}
                  >
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}