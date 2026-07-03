import { useEffect, useState } from "react";
import { BookOpen, Users, BarChart2, Plus, Trash2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios.js";

const COURSE_COLORS = [
  { bg: "rgba(59,130,246,0.1)",  icon: "#3B82F6" },
  { bg: "rgba(16,185,129,0.1)",  icon: "#10B981" },
  { bg: "rgba(245,158,11,0.1)",  icon: "#F59E0B" },
  { bg: "rgba(139,92,246,0.1)",  icon: "#8B5CF6" },
  { bg: "rgba(236,72,153,0.1)",  icon: "#EC4899" },
];

const DIFFICULTY_COLOR = {
  beginner:     { bg: "rgba(16,185,129,0.08)",  text: "#065f46" },
  intermediate: { bg: "rgba(245,158,11,0.08)",  text: "#92400e" },
  advanced:     { bg: "rgba(239,68,68,0.08)",   text: "#991b1b" },
};

export default function InstructorCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchCourses(); }, []);

  async function fetchCourses() {
    try {
      const { data } = await api.get("/instructor/courses");
      setCourses(data);
    } catch {
      setError("Could not load courses");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e, courseId) {
    e.stopPropagation();
    if (!confirm("Delete this course? This cannot be undone.")) return;
    setDeleting(courseId);
    try {
      await api.delete(`/instructor/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch {
      setError("Could not delete course");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bp-display text-slate-900">My Courses</h1>
          <p className="bp-body text-slate-400 mt-1">
            {courses.length} {courses.length === 1 ? "course" : "courses"} created
          </p>
        </div>
        <button
          onClick={() => navigate("/instructor/courses/new")}
          className="flex items-center gap-2 bp-sub font-semibold px-4 py-2.5 rounded-lg text-white transition-colors hover:bg-blue-600"
          style={{ background: "#3B82F6" }}
        >
          <Plus size={16} />
          New course
        </button>
      </div>

      {error && (
        <p className="bp-body text-red-500 mb-6">{error}</p>
      )}

      {/* Empty state */}
      {courses.length === 0 ? (
        <div className="bp-card text-center py-16">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-4" />
          <h2 className="bp-heading text-slate-700 mb-2">No courses yet</h2>
          <p className="bp-body text-slate-400 mb-6">
            Create your first course and start teaching
          </p>
          <button
            onClick={() => navigate("/instructor/courses/new")}
            className="bp-sub font-semibold px-5 py-2.5 rounded-lg text-white"
            style={{ background: "#3B82F6" }}
          >
            Create a course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course, i) => {
            const { bg, icon } = COURSE_COLORS[i % COURSE_COLORS.length];
            const diff = DIFFICULTY_COLOR[course.difficulty];

            return (
              <div
                key={course.id}
                onClick={() => navigate(`/instructor/courses/${course.id}`)}
                className="bp-card cursor-pointer hover:border-slate-300 transition-colors group relative"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, course.id)}
                  disabled={deleting === course.id}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  aria-label="Delete course"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>

                {/* Course icon + title */}
                <div className="flex items-start gap-3 mb-4 pr-8">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: bg }}
                  >
                    <BookOpen size={18} style={{ color: icon }} />
                  </div>
                  <div className="min-w-0">
                    <p className="bp-sub font-semibold text-slate-900 leading-snug">
                      {course.title}
                    </p>
                    {course.category && (
                      <p className="bp-micro text-slate-400 mt-0.5">{course.category}</p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.05)" }}>
                    <p className="text-[16px] font-bold text-brand-blue leading-none">
                      {course.enrolled_students ?? 0}
                    </p>
                    <p className="bp-micro text-slate-400 mt-1 flex items-center justify-center gap-1">
                      <Users size={10} />students
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.05)" }}>
                    <p className="text-[16px] font-bold text-brand-emerald leading-none">
                      {course.total_lessons ?? 0}
                    </p>
                    <p className="bp-micro text-slate-400 mt-1 flex items-center justify-center gap-1">
                      <BookOpen size={10} />lessons
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: "rgba(245,158,11,0.05)" }}>
                    <p className="text-[16px] font-bold text-brand-amber leading-none">
                      {course.avg_completion ?? 0}%
                    </p>
                    <p className="bp-micro text-slate-400 mt-1 flex items-center justify-center gap-1">
                      <BarChart2 size={10} />avg
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {diff ? (
                    <span
                      className="bp-micro px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: diff.bg, color: diff.text }}
                    >
                      {course.difficulty}
                    </span>
                  ) : <span />}
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}