import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, Search, Compass, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios.js";

const DIFFICULTY_COLOR = {
  beginner:     { bg: "rgba(16,185,129,0.08)",  text: "#065f46" },
  intermediate: { bg: "rgba(245,158,11,0.08)",  text: "#92400e" },
  advanced:     { bg: "rgba(239,68,68,0.08)",   text: "#991b1b" },
};

const COURSE_COLORS = [
  { bg: "rgba(59,130,246,0.1)",  icon: "#3B82F6" },
  { bg: "rgba(16,185,129,0.1)",  icon: "#10B981" },
  { bg: "rgba(245,158,11,0.1)",  icon: "#F59E0B" },
  { bg: "rgba(139,92,246,0.1)",  icon: "#8B5CF6" },
  { bg: "rgba(236,72,153,0.1)",  icon: "#EC4899" },
];

function courseColor(index) {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

function ProgressBar({ percent, color }) {
  return (
    <div className="bp-progress-track mt-2">
      <div
        className="bp-progress-fill"
        style={{ width: `${percent ?? 0}%`, background: color }}
      />
    </div>
  );
}

function EnrolledCard({ course, index }) {
  const navigate = useNavigate();
  const { bg, icon } = courseColor(index);
  const diff = DIFFICULTY_COLOR[course.difficulty] || DIFFICULTY_COLOR.beginner;

  return (
    <div
      className="bp-card cursor-pointer hover:border-slate-300 transition-colors"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <BookOpen size={20} style={{ color: icon }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="bp-sub font-semibold text-slate-900 truncate">
            {course.title}
          </p>
          <p className="bp-micro text-slate-500 mt-0.5 truncate">
            {course.instructor_name ?? "BrainPath"} · {course.total_lessons} lessons
          </p>
          <ProgressBar percent={course.progress_percent} color={icon} />
          <div className="flex items-center justify-between mt-1.5">
            <p className="bp-micro text-slate-400">
              {course.completed_lessons} of {course.total_lessons} done ·{" "}
              {course.progress_percent ?? 0}%
            </p>
            <ChevronRight size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      {course.difficulty && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span
            className="bp-micro px-2 py-0.5 rounded-full font-semibold"
            style={{ background: diff.bg, color: diff.text }}
          >
            {course.difficulty}
          </span>
        </div>
      )}
    </div>
  );
}

function DiscoverCard({ course, index, onEnroll, enrolling }) {
  const { bg, icon } = courseColor(index);
  const diff = DIFFICULTY_COLOR[course.difficulty] || DIFFICULTY_COLOR.beginner;

  return (
    <div className="bp-card">
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <BookOpen size={20} style={{ color: icon }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="bp-sub font-semibold text-slate-900 truncate">
            {course.title}
          </p>
          <p className="bp-micro text-slate-500 mt-0.5 truncate">
            {course.instructor_name ?? "BrainPath"} · {course.total_lessons} lessons
          </p>
          {course.description && (
            <p className="bp-micro text-slate-400 mt-1 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {course.difficulty && (
            <span
              className="bp-micro px-2 py-0.5 rounded-full font-semibold"
              style={{ background: diff.bg, color: diff.text }}
            >
              {course.difficulty}
            </span>
          )}
          {course.category && (
            <span className="bp-micro text-slate-400">{course.category}</span>
          )}
        </div>

        {course.enrolled ? (
          <span className="bp-micro text-brand-emerald font-semibold">
            ✓ Enrolled
          </span>
        ) : (
          <button
            onClick={() => onEnroll(course.id)}
            disabled={enrolling === course.id}
            className="bp-micro font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(59,130,246,0.1)",
              color: "#1d4ed8",
            }}
          >
            {enrolling === course.id ? "Enrolling..." : "Enroll"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentCourses() {
  const [enrolled, setEnrolled] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [enrolling, setEnrolling] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEnrolled();
  }, []);

  async function fetchEnrolled() {
    try {
      const { data } = await api.get("/student/courses");
      setEnrolled(data);
    } catch {
      setError("Could not load courses");
    } finally {
      setLoading(false);
    }
  }

  async function openDiscover() {
    setDiscoverOpen(true);
    try {
      const { data } = await api.get("/student/courses/discover");
      setCatalogue(data);
    } catch {
      setError("Could not load course catalogue");
    }
  }

  async function handleEnroll(courseId) {
    setEnrolling(courseId);
    try {
      await api.post(`/student/courses/${courseId}/enroll`);
      // Refresh both lists
      const [enrolledRes, catalogueRes] = await Promise.all([
        api.get("/student/courses"),
        api.get("/student/courses/discover"),
      ]);
      setEnrolled(enrolledRes.data);
      setCatalogue(catalogueRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Enrollment failed");
    } finally {
      setEnrolling(null);
    }
  }

  const filteredCatalogue = catalogue.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="bp-display text-slate-900">My Courses</h1>
            <p className="bp-body text-slate-400 mt-1">
              {enrolled.length} enrolled
            </p>
          </div>
          <button
            onClick={openDiscover}
            className="flex items-center gap-2 bp-sub font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "0.5px solid rgba(59,130,246,0.25)",
              color: "#1d4ed8",
            }}
          >
            <Compass size={15} />
            Discover courses
          </button>
        </div>

        {error && (
          <p className="bp-body text-red-500 mb-4">{error}</p>
        )}

        {/* Enrolled course grid */}
        {enrolled.length === 0 ? (
          <div className="bp-card text-center py-12">
            <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="bp-body text-slate-500">You haven't enrolled in any courses yet</p>
            <button
              onClick={openDiscover}
              className="bp-sub text-brand-blue mt-3 inline-block"
            >
              Browse available courses →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolled.map((course, i) => (
              <EnrolledCard key={course.id} course={course} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Discover drawer — slides up on mobile, modal on desktop */}
      {discoverOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(15,23,42,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDiscoverOpen(false); }}
        >
          <div
            className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl"
            style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="bp-heading text-slate-900">Discover courses</h2>
                <p className="bp-micro text-slate-400 mt-0.5">
                  {filteredCatalogue.length} available
                </p>
              </div>
              <button
                onClick={() => setDiscoverOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  placeholder="Search by title, category or instructor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg bp-body outline-none focus:ring-2 focus:border-brand-blue"
                  style={{ "--tw-ring-color": "rgba(59,130,246,0.3)" }}
                  autoFocus
                />
              </div>
            </div>

            {/* Course list */}
            <div className="overflow-y-auto flex-1 px-6 pt-4 pb-20 sm:pb-4 space-y-3">
              {filteredCatalogue.length === 0 ? (
                <div className="text-center py-12">
                  <p className="bp-body text-slate-400">
                    {search ? "No courses match your search" : "No courses available yet"}
                  </p>
                </div>
              ) : (
                filteredCatalogue.map((course, i) => (
                  <DiscoverCard
                    key={course.id}
                    course={course}
                    index={i}
                    onEnroll={handleEnroll}
                    enrolling={enrolling}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}