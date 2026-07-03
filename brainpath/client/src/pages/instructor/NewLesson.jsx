import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Video, FileText, Upload, CheckCircle } from "lucide-react";
import api from "../../lib/axios.js";
import { uploadToCloudinary, formatBytes, formatDuration } from "../../lib/cloudinary.js";

const LESSON_TYPES = [
  {
    id: "video",
    label: "Video",
    description: "Upload a video lesson",
    Icon: Video,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: "text",
    label: "Text",
    description: "Write a text-based lesson",
    Icon: FileText,
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
  },
];

function VideoUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(null);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;

    // Basic validation
    if (!selected.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    if (selected.size > 500 * 1024 * 1024) {
      setError("File must be under 500MB");
      return;
    }

    setFile(selected);
    setError("");
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const result = await uploadToCloudinary(file, setProgress);
      setUploaded(result);
      onUploadComplete(result);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (uploaded) {
    return (
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(16,185,129,0.06)", border: "0.5px solid rgba(16,185,129,0.3)" }}
      >
        <CheckCircle size={20} className="text-brand-emerald shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="bp-sub font-semibold text-slate-900">Upload complete</p>
          <p className="bp-micro text-slate-500 mt-0.5 truncate">{file.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="bp-micro text-slate-400">{formatBytes(uploaded.bytes)}</span>
            {uploaded.duration && (
              <span className="bp-micro text-slate-400">
                {formatDuration(uploaded.duration)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setUploaded(null);
            onUploadComplete(null);
          }}
          className="bp-micro text-slate-400 hover:text-slate-600"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label
        className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-blue transition-colors"
        style={{ background: file ? "rgba(59,130,246,0.03)" : "transparent" }}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="sr-only"
          disabled={uploading}
        />
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <Upload
            size={32}
            className={file ? "text-brand-blue" : "text-slate-300"}
          />
          <p className="bp-sub font-semibold text-slate-700 mt-3">
            {file ? file.name : "Click to select a video"}
          </p>
          <p className="bp-micro text-slate-400 mt-1">
            {file
              ? formatBytes(file.size)
              : "MP4, MOV, AVI — max 500MB"}
          </p>
        </div>
      </label>

      {error && (
        <p className="bp-micro text-red-500">{error}</p>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="bp-micro text-slate-500">Uploading to Cloudinary...</p>
            <p className="bp-micro font-semibold text-brand-blue">{progress}%</p>
          </div>
          <div className="bp-progress-track">
            <div
              className="bp-progress-fill bg-brand-blue transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {file && !uploading && (
        <button
          onClick={handleUpload}
          className="w-full py-2.5 rounded-lg bp-sub font-semibold text-white transition-colors hover:bg-blue-600"
          style={{ background: "#3B82F6" }}
        >
          Upload video
        </button>
      )}
    </div>
  );
}

export default function NewLesson() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();

  const [type, setType] = useState("video");
  const [form, setForm] = useState({
    title: "",
    content: "",
  });
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Lesson title is required");
      return;
    }
    if (type === "video" && !uploadedVideo) {
      setError("Please upload a video before saving");
      return;
    }
    if (type === "text" && !form.content.trim()) {
      setError("Lesson content cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        `/instructor/courses/${courseId}/modules/${moduleId}/lessons`,
        {
          title: form.title,
          type,
          content: type === "text" ? form.content : null,
          content_url: type === "video" ? uploadedVideo.url : null,
          duration: type === "video" ? uploadedVideo.duration : null,
        }
      );
      navigate(`/instructor/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save lesson");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">

      <button
        onClick={() => navigate(`/instructor/courses/${courseId}`)}
        className="flex items-center gap-2 bp-sub text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to course
      </button>

      <h1 className="bp-display text-slate-900 mb-2">New lesson</h1>
      <p className="bp-body text-slate-400 mb-8">
        Choose a lesson type and fill in the details below.
      </p>

      {error && (
        <div className="bp-body text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Lesson type picker */}
        <div className="bp-card space-y-4">
          <p className="bp-micro text-slate-400 uppercase tracking-widest">
            Lesson type
          </p>
          <div className="grid grid-cols-2 gap-3">
            {LESSON_TYPES.map(({ id, label, description, Icon, color, bg }) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all"
                style={
                  type === id
                    ? { background: bg, borderColor: color }
                    : { background: "transparent", borderColor: "#e2e8f0" }
                }
              >
                <Icon
                  size={20}
                  style={{ color: type === id ? color : "#94a3b8" }}
                  className="shrink-0 mt-0.5"
                />
                <div>
                  <p
                    className="bp-sub font-semibold"
                    style={{ color: type === id ? color : "#64748b" }}
                  >
                    {label}
                  </p>
                  <p className="bp-micro text-slate-400 mt-0.5">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lesson title */}
        <div className="bp-card space-y-4">
          <p className="bp-micro text-slate-400 uppercase tracking-widest">
            Details
          </p>
          <div>
            <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
              Lesson title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={update("title")}
              placeholder={
                type === "video"
                  ? "e.g. Introduction to Service Workers"
                  : "e.g. What is a Service Worker?"
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue"
            />
          </div>

          {/* Video uploader */}
          {type === "video" && (
            <div>
              <label className="block bp-sub font-semibold text-slate-700 mb-2">
                Video file <span className="text-red-400">*</span>
              </label>
              <VideoUploader onUploadComplete={setUploadedVideo} />
            </div>
          )}

          {/* Text content */}
          {type === "text" && (
            <div>
              <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={update("content")}
                placeholder="Write your lesson content here. Markdown is supported."
                rows={12}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue resize-none font-mono"
              />
              <p className="bp-micro text-slate-400 mt-1.5">
                Markdown supported — **bold**, *italic*, # headings, - lists
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg px-4 py-3" style={{ background: "rgba(59,130,246,0.05)", border: "0.5px solid rgba(59,130,246,0.2)" }}>
            <p className="bp-micro text-blue-700">
                You can attach PDF resources to this lesson after saving it.
            </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || (type === "video" && !uploadedVideo)}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            style={{ background: "#3B82F6" }}
          >
            {loading ? "Saving..." : "Save lesson"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/instructor/courses/${courseId}`)}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}