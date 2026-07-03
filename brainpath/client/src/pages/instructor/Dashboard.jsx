import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, BarChart2, Video,
  ChevronRight, Plus, Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";

// ── Helpers ──────────────────────────────────────────────────────────

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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const COURSE_COLORS = [
  { bg: "rgba(59,130,246,0.1)",  icon: "#3B82F6"  },
  { bg: "rgba(16,185,129,0.1)",  icon: "#10B981"  },
  { bg: "rgba(245,158,11,0.1)",  icon: "#F59E0B"  },
  { bg: "rgba(139,92,246,0.1)",  icon: "#8B5CF6"  },
  { bg: "rgba(236,72,153,0.1)",  icon: "#EC4899"  },
];

// ── Stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value, Icon, color, bg, suffix = "" }) {
  return (
    <div className="bp-stat">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <p className="bp-sub text-slate-500">{label}</p>
      </div>
      <p
        className="font-bold leading-none"
        style={{ fontSize: "28px", color }}
      >
        {value}
        {suffix && (
          <span className="text-base font-medium ml-1" style={{ color }}>
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/instructor/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => setError("Could not load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-56" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 rounded-xl" />
            <div className="h-64 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <p className="bp-body text-red-500">{error}</p>
      </div>
    );
  }

  const { stats, upcomingLive, recentEnrollments, topCourses } = data;

  return (
    <div className="p-6 sm:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="bp-display text-slate-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="bp-body text-slate-400 mt-1">
            Here's how your courses are performing
          </p>
        </div>
        <button
          onClick={() => navigate("/instructor/courses/new")}
          className="flex items-center gap-2 bp-sub font-semibold px-4 py-2.5 rounded-lg text-white shrink-0 hover:bg-blue-600 transition-colors"
          style={{ background: "#3B82F6" }}
        >
          <Plus size={15} />
          New course
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="My Courses"
          value={stats.totalCourses}
          Icon={BookOpen}
          color="#3B82F6"
          bg="rgba(59,130,246,0.1)"
        />
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          Icon={Users}
          color="#10B981"
          bg="rgba(16,185,129,0.1)"
        />
        <StatCard
          label="Avg Completion"
          value={stats.avgCompletion}
          Icon={BarChart2}
          color="#F59E0B"
          bg="rgba(245,158,11,0.1)"
          suffix="%"
        />
        <StatCard
          label="Upcoming Live"
          value={stats.upcomingLive}
          Icon={Video}
          color="#8B5CF6"
          bg="rgba(139,92,246,0.1)"
        />
      </div>

      {/* ── Two column grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top courses */}
        <div className="bp-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="bp-heading text-slate-900">Top courses</h2>
            <button
              onClick={() => navigate("/instructor/courses")}
              className="flex items-center gap-1 bp-micro font-semibold text-brand-blue hover:underline"
            >
              View all
              <ChevronRight size={13} />
            </button>
          </div>

          {topCourses.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="bp-body text-slate-400 mb-4">No courses yet</p>
              <button
                onClick={() => navigate("/instructor/courses/new")}
                className="bp-sub font-semibold text-brand-blue hover:underline"
              >
                Create your first course
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {topCourses.map((course, i) => {
                const { bg, icon } = COURSE_COLORS[i % COURSE_COLORS.length];
                const completion = course.avg_completion ?? 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/instructor/courses/${course.id}`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: bg }}
                    >
                      <BookOpen size={18} style={{ color: icon }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="bp-sub font-semibold text-slate-900 truncate">
                          {course.title}
                        </p>
                        <p
                          className="bp-micro font-semibold shrink-0"
                          style={{ color: icon }}
                        >
                          {completion}%
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div className="bp-progress-track">
                        <div
                          className="bp-progress-fill transition-all duration-500"
                          style={{ width: `${completion}%`, background: icon }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="bp-micro text-slate-400 flex items-center gap-1">
                          <Users size={10} />
                          {course.enrolled_students} students
                        </span>
                        <span className="bp-micro text-slate-400 flex items-center gap-1">
                          <BookOpen size={10} />
                          {course.total_lessons} lessons
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — upcoming live + recent enrollments */}
        <div className="space-y-6">

          {/* Upcoming live sessions */}
          <div className="bp-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="bp-heading text-slate-900">Upcoming live</h2>
              <button
                onClick={() => navigate("/instructor/sessions")}
                className="flex items-center gap-1 bp-micro font-semibold text-brand-blue hover:underline"
              >
                Manage
                <ChevronRight size={13} />
              </button>
            </div>

            {upcomingLive.length === 0 ? (
              <div className="text-center py-6">
                <Video size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="bp-body text-slate-400 mb-3">No upcoming sessions</p>
                <button
                  onClick={() => navigate("/instructor/sessions")}
                  className="bp-sub font-semibold text-brand-blue hover:underline"
                >
                  Schedule a session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingLive.map((session) => {
                  const isLive = session.status === "live";
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 p-3 rounded-xl"
                      style={{
                        background: isLive
                          ? "rgba(16,185,129,0.05)"
                          : "rgba(59,130,246,0.04)",
                        border: `0.5px solid ${
                          isLive
                            ? "rgba(16,185,129,0.2)"
                            : "rgba(59,130,246,0.15)"
                        }`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isLive
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(59,130,246,0.1)",
                        }}
                      >
                        <Video
                          size={18}
                          style={{ color: isLive ? "#10B981" : "#3B82F6" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="bp-sub font-semibold text-slate-900 truncate">
                          {session.title}
                        </p>
                        <p className="bp-micro text-slate-500 mt-0.5 truncate">
                          {session.course_title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="bp-micro text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {isLive
                              ? "Live now"
                              : `${formatDate(session.scheduled_at)} · ${formatTime(session.scheduled_at)}`}
                          </span>
                          <span className="bp-micro text-slate-400">
                            {timeUntil(session.scheduled_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        className="bp-micro font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          background: isLive
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(59,130,246,0.1)",
                          color: isLive ? "#065f46" : "#1d4ed8",
                        }}
                      >
                        {isLive ? "Live" : timeUntil(session.scheduled_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent enrollments */}
          <div className="bp-card">
            <h2 className="bp-heading text-slate-900 mb-5">Recent enrollments</h2>

            {recentEnrollments.length === 0 ? (
              <div className="text-center py-6">
                <Users size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="bp-body text-slate-400">No enrollments yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentEnrollments.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center bp-micro font-semibold shrink-0">
                      {initials(e.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="bp-sub font-semibold text-slate-900 truncate">
                        {e.name}
                      </p>
                      <p className="bp-micro text-slate-400 truncate">
                        {e.course_title}
                      </p>
                    </div>
                    <span className="bp-micro text-slate-400 shrink-0">
                      {timeAgo(e.enrolled_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}