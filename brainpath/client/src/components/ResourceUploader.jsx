import { useState } from "react";
import { Upload, FileText, Trash2 } from "lucide-react";
import { uploadPdfToCloudinary, formatBytes } from "../lib/cloudinary.js";
import api from "../lib/axios.js";

export default function ResourceUploader({ courseId, lessonId, existing = [], onUpdate }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
    setError("");
  }

  async function handleUpload() {
    if (!file || !title.trim()) {
      setError("Please select a file and enter a title");
      return;
    }
    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const uploaded = await uploadPdfToCloudinary(file, setProgress);

      await api.post("/instructor/resources", {
        title: title.trim(),
        file_url: uploaded.url,
        file_size: uploaded.bytes,
        ...(lessonId ? { lesson_id: lessonId } : { course_id: courseId }),
      });

      setFile(null);
      setTitle("");
      setProgress(0);
      onUpdate?.();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(resourceId) {
    setDeleting(resourceId);
    try {
      await api.delete(`/instructor/resources/${resourceId}`);
      onUpdate?.();
    } catch {
      setError("Could not delete resource");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-3">

      {existing.length > 0 && (
        <div className="space-y-2">
          {existing.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50"
            >
              <FileText size={16} className="text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="bp-sub font-semibold text-slate-800 truncate">{r.title}</p>
                {r.file_size && (
                  <p className="bp-micro text-slate-400 mt-0.5">{formatBytes(r.file_size)}</p>
                )}
              </div>
              <a
                href={r.file_url}
                target="_blank"
                rel="noreferrer"
                className="bp-micro text-brand-blue hover:underline shrink-0"
              >
                View
              </a>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={deleting === r.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
                aria-label="Delete resource"
              >
                <Trash2 size={13} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <label className="block bp-micro font-semibold text-slate-600 mb-1.5">
            Resource title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lecture Notes Week 1"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bp-body outline-none focus:ring-2 focus:border-brand-blue"
          />
        </div>

        <div>
          <label className="block bp-micro font-semibold text-slate-600 mb-1.5">
            PDF file
          </label>
          <label className="flex items-center gap-3 cursor-pointer border border-slate-200 rounded-lg px-3 py-2.5 hover:border-brand-blue transition-colors">
            <Upload size={15} className="text-slate-400 shrink-0" />
            <span className="bp-body text-slate-500 flex-1 truncate">
              {file ? file.name : "Click to select a PDF"}
            </span>
            {file && (
              <span className="bp-micro text-slate-400 shrink-0">
                {formatBytes(file.size)}
              </span>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="sr-only"
              disabled={uploading}
            />
          </label>
        </div>

        {error && (
          <p className="bp-micro text-red-500">{error}</p>
        )}

        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <p className="bp-micro text-slate-500">Uploading...</p>
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

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !title.trim()}
          className="w-full py-2 rounded-lg bp-sub font-semibold text-white disabled:opacity-40 transition-colors hover:bg-blue-600"
          style={{ background: "#3B82F6" }}
        >
          {uploading ? "Uploading..." : "Upload resource"}
        </button>
      </div>
    </div>
  );
}