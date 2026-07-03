import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../lib/axios.js";

const CATEGORIES = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Engineering",
  "Business",
  "Languages",
  "Arts",
  "Other",
];

export default function NewCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "beginner",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Course title is required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/instructor/courses", form);
      // Go straight to the course detail page to add modules/lessons
      navigate(`/instructor/courses/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">

      {/* Back link */}
      <button
        onClick={() => navigate("/instructor/courses")}
        className="flex items-center gap-2 bp-sub text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to courses
      </button>

      <h1 className="bp-display text-slate-900 mb-2">New course</h1>
      <p className="bp-body text-slate-400 mb-8">
        Fill in the details below. You can add modules and lessons after creating the course.
      </p>

      {error && (
        <div className="bp-body text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="bp-card space-y-5">
          <p className="bp-micro text-slate-400 uppercase tracking-widest">
            Basic information
          </p>

          <div>
            <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
              Course title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Introduction to Mobile Programming"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={update("description")}
              placeholder="What will students learn in this course?"
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue resize-none"
            />
          </div>
        </div>

        <div className="bp-card space-y-5">
          <p className="bp-micro text-slate-400 uppercase tracking-widest">
            Classification
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={update("category")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue bg-white"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: level })}
                    className="py-2.5 rounded-lg bp-sub font-semibold capitalize transition-colors border"
                    style={
                      form.difficulty === level
                        ? {
                            background:
                              level === "beginner"
                                ? "rgba(16,185,129,0.1)"
                                : level === "intermediate"
                                ? "rgba(245,158,11,0.1)"
                                : "rgba(239,68,68,0.08)",
                            borderColor:
                              level === "beginner"
                                ? "#10B981"
                                : level === "intermediate"
                                ? "#F59E0B"
                                : "#ef4444",
                            color:
                              level === "beginner"
                                ? "#065f46"
                                : level === "intermediate"
                                ? "#92400e"
                                : "#991b1b",
                          }
                        : {
                            background: "transparent",
                            borderColor: "#e2e8f0",
                            color: "#94a3b8",
                          }
                    }
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            style={{ background: "#3B82F6" }}
          >
            {loading ? "Creating..." : "Create course"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/instructor/courses")}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}