import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Flame, BookOpen, Video, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";

function formatHours(h) {
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h}h`;
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff < 0) return "Live now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/student/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">
        <p className="bp-body text-red-500">{error}</p>
      </div>
    );
  }

  const { learningHours, completionPercent, streak, continueLearning, upcomingLive } = data;

  return (
    <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8 space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="bp-display text-slate-900">
          {greeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="bp-body text-slate-400 mt-1">Here's where you left off</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bp-stat">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-slate-400" />
            <p className="bp-micro text-slate-500">Learning hours</p>
          </div>
          <p className="text-[26px] font-bold text-brand-blue leading-none">
            {formatHours(learningHours)}
          </p>
        </div>

        <div className="bp-stat">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-slate-400" />
            <p className="bp-micro text-slate-500">Overall</p>
          </div>
          <p className="text-[26px] font-bold text-brand-emerald leading-none">
            {completionPercent}%
          </p>
        </div>

        <div className="bp-stat flex items-center gap-3">
          <span className="text-3xl leading-none">🔥</span>
          <div>
            <p className="text-[26px] font-bold text-slate-900 leading-none">{streak}</p>
            <p className="bp-micro text-slate-500 mt-1">day streak</p>
          </div>
        </div>

        {upcomingLive.length > 0 ? (
        <div
          className="bp-stat cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            background: upcomingLive[0].status === "live"
              ? "rgba(16,185,129,0.06)"
              : "rgba(59,130,246,0.06)",
            border: `0.5px solid ${
              upcomingLive[0].status === "live"
                ? "rgba(16,185,129,0.2)"
                : "rgba(59,130,246,0.2)"
            }`,
          }}
          onClick={() => navigate("/live")}
        >
          <p
            className="bp-micro font-semibold mb-1 flex items-center gap-1"
            style={{
              color: upcomingLive[0].status === "live" ? "#065f46" : "#1d4ed8",
            }}
          >
            <Video size={12} />
            {upcomingLive[0].status === "live"
              ? "Live now"
              : timeUntil(upcomingLive[0].scheduled_at)}
          </p>
          <p className="bp-sub font-semibold text-slate-900 truncate">
            {upcomingLive[0].course_title}
          </p>
          <p className="bp-micro text-slate-500 mt-0.5 truncate">
            {upcomingLive[0].status === "live"
              ? "Tap to join →"
              : `${formatTime(upcomingLive[0].scheduled_at)} · ${upcomingLive[0].instructor_name}`}
          </p>
        </div>
        ) : (
          <div className="bp-stat">
            <p className="bp-micro text-slate-400 mb-1">No upcoming live</p>
            <p className="bp-sub text-slate-500">Check back soon</p>
          </div>
        )}
      </div>

      {/* Two-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Left — continue learning */}
        <div className="space-y-4">
          <h2 className="bp-heading text-slate-900">Continue learning</h2>

          {continueLearning ? (
            <Link
              to={`/courses/${continueLearning.course_id}/lessons/${continueLearning.lesson_id}`}
              className="bp-card block hover:border-brand-blue/40 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-brand-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="bp-sub font-semibold text-slate-900 truncate">
                    {continueLearning.course_title}
                  </p>
                  <p className="bp-micro text-slate-500 mt-0.5 truncate">
                    {continueLearning.lesson_title}
                  </p>
                  {/* Progress bar */}
                  <div className="bp-progress-track mt-3">
                    <div
                      className="bp-progress-fill bg-brand-blue"
                      style={{ width: `${continueLearning.course_progress ?? 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="bp-micro text-slate-400">
                      {continueLearning.course_progress ?? 0}% complete
                    </p>
                    <p className="bp-micro text-brand-blue font-semibold group-hover:underline">
                      Resume →
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bp-card text-center py-8">
              <p className="bp-body text-slate-400">No lessons started yet</p>
              <Link to="/courses" className="bp-sub text-brand-blue mt-2 block">
                Browse your courses →
              </Link>
            </div>
          )}
        </div>

        {/* Right — upcoming live sessions */}
        <div className="space-y-4">
          <h2 className="bp-heading text-slate-900">Upcoming live sessions</h2>

          {upcomingLive.length > 0 ? (
            <div className="bp-card divide-y divide-slate-100">
              {upcomingLive.map((session) => (
                <div key={session.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Video size={18} className="text-brand-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="bp-sub font-semibold text-slate-900 truncate">
                      {session.title}
                    </p>
                    <p className="bp-micro text-slate-500 mt-0.5 truncate">
                      {session.instructor_name} · {formatTime(session.scheduled_at)}
                    </p>
                  </div>
                  <span
                    className="bp-micro font-semibold shrink-0 px-2.5 py-1 rounded-full"
                    style={{
                      background: session.status === "live"
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(59,130,246,0.1)",
                      color: session.status === "live" ? "#065f46" : "#1d4ed8",
                    }}
                  >
                    {session.status === "live" ? "Live now" : timeUntil(session.scheduled_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bp-card text-center py-8">
              <p className="bp-body text-slate-400">No upcoming sessions</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}