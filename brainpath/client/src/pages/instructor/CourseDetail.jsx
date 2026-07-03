import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, BookOpen, Layers } from "lucide-react";
import api from "../../lib/axios.js";
import ResourceUploader from "../../components/ResourceUploader.jsx";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New module form
  const [moduleTitle, setModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [moduleLoading, setModuleLoading] = useState(false);

  useEffect(() => { fetchCourse(); }, [id]);

  async function fetchCourse() {
    try {
      const { data } = await api.get(`/instructor/courses/${id}`);
      setCourse(data);
    } catch {
      setError("Course not found");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddModule(e) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setModuleLoading(true);
    try {
      await api.post(`/instructor/courses/${id}/modules`, {
        title: moduleTitle,
        order_index: course.modules?.length ?? 0,
      });
      setModuleTitle("");
      setAddingModule(false);
      fetchCourse();
    } catch {
      setError("Could not add module");
    } finally {
      setModuleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-8">
        <p className="bp-body text-red-500">{error || "Course not found"}</p>
        <button
          onClick={() => navigate("/instructor/courses")}
          className="bp-sub text-brand-blue mt-3"
        >
          ← Back to courses
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl">

      <button
        onClick={() => navigate("/instructor/courses")}
        className="flex items-center gap-2 bp-sub text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to courses
      </button>

      {/* Course header */}
      <div className="bp-card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="bp-display text-slate-900">{course.title}</h1>
            {course.description && (
              <p className="bp-body text-slate-500 mt-2">{course.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {course.category && (
                <span className="bp-micro text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {course.category}
                </span>
              )}
              {course.difficulty && (
                <span className="bp-micro font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{
                    background: course.difficulty === "beginner"
                      ? "rgba(16,185,129,0.08)"
                      : course.difficulty === "intermediate"
                      ? "rgba(245,158,11,0.08)"
                      : "rgba(239,68,68,0.08)",
                    color: course.difficulty === "beginner"
                      ? "#065f46"
                      : course.difficulty === "intermediate"
                      ? "#92400e"
                      : "#991b1b",
                  }}
                >
                  {course.difficulty}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/instructor/courses/${id}/edit`)}
            className="bp-sub text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Modules section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="bp-heading text-slate-900">Modules</h2>
        <button
          onClick={() => setAddingModule(true)}
          className="flex items-center gap-1.5 bp-sub font-semibold text-brand-blue"
        >
          <Plus size={15} />
          Add module
        </button>
      </div>

      {/* Add module form */}
      {addingModule && (
        <form onSubmit={handleAddModule} className="bp-card mb-4 flex items-center gap-3">
          <Layers size={16} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Module title, e.g. Introduction"
            className="flex-1 bp-body outline-none border-b border-slate-200 pb-1 bg-transparent"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={moduleLoading}
              className="bp-sub font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: "#3B82F6" }}
            >
              {moduleLoading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setAddingModule(false); setModuleTitle(""); }}
              className="bp-sub text-slate-400 hover:text-slate-600 px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Module list */}
      {!course.modules || course.modules.length === 0 ? (
        <div className="bp-card text-center py-12">
          <Layers size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="bp-body text-slate-500 mb-1">No modules yet</p>
          <p className="bp-sub text-slate-400">
            Add a module to start building the course structure
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {course.modules.map((module, idx) => (
            <div key={module.id} className="bp-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center bp-micro font-semibold text-slate-500">
                    {idx + 1}
                  </span>
                  <p className="bp-sub font-semibold text-slate-900">{module.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      navigate(`/instructor/courses/${id}/modules/${module.id}/quiz`)
                    }
                    className="flex items-center gap-1.5 bp-micro font-semibold text-brand-amber"
                  >
                    <Plus size={13} />
                    Quiz
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/instructor/courses/${id}/modules/${module.id}/lessons/new`)
                    }
                    className="flex items-center gap-1.5 bp-micro font-semibold text-brand-blue"
                  >
                    <Plus size={13} />
                    Add lesson
                  </button>
                </div>
              </div>

              {/* Lessons list */}
              {module.lessons && module.lessons.length > 0 ? (
              <div className="space-y-1 pl-9">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                  >
                    <BookOpen size={13} className="text-slate-400 shrink-0" />
                    <p className="bp-body text-slate-700 flex-1 truncate">
                      {lesson.title}
                    </p>
                    <span className="bp-micro text-slate-400 capitalize shrink-0">
                      {lesson.type}
                    </span>
                    
                  </div>
                ))}
              </div>
            ) : (
              <p className="bp-micro text-slate-400 pl-9">No lessons yet</p>
            )}
            </div>
          ))}

        </div>
      )}

      

      {/* Course-level resources */}
    <div className="mt-8">
      <h2 className="bp-heading text-slate-900 mb-4">Course resources</h2>
      <div className="bp-card">
        <p className="bp-micro text-slate-400 mb-4">
          PDFs added here are available to all enrolled students across every lesson.
        </p>
        <ResourceUploader
          courseId={id}
          existing={course.resources ?? []}
          onUpdate={fetchCourse}
        />
      </div>
    </div>

    </div>
  );
}
