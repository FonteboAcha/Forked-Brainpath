import { useEffect, useState } from "react";
import { Download, BookOpen, Video, FileText, Trash2, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDownloadedLessons, removeDownload } from "../../lib/sync.js";
import { db } from "../../lib/db.js";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { getPendingSyncCount } from "../../lib/sync.js";

export default function StudentOffline() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const [downloads, setDownloads] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [pendingSync, setPendingSync] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dl, pending] = await Promise.all([
        getDownloadedLessons(),
        getPendingSyncCount(),
      ]);
      setDownloads(dl);
      setPendingSync(pending);

      if (dl.length > 0) {
        const lessonIds = dl.map((d) => d.lessonId);
        const cached = await db.lessons
          .where("id")
          .anyOf(lessonIds)
          .toArray();
        setLessons(cached);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleRemove(lessonId) {
  await removeDownload(lessonId);
  await db.lessonContent.delete(lessonId);
  setDownloads((prev) => prev.filter((d) => d.lessonId !== lessonId));
  setLessons((prev) => prev.filter((l) => l.id !== lessonId));
}

  const typeIcon = (type) => {
    if (type === "video") return <Video size={16} className="text-brand-blue" />;
    if (type === "text") return <FileText size={16} className="text-brand-emerald" />;
    return <BookOpen size={16} className="text-slate-400" />;
  };

  return (
    <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">

      <div className="mb-6">
        <h1 className="bp-display text-slate-900">Offline content</h1>
        <p className="bp-body text-slate-400 mt-1">
          Lessons you've downloaded for offline study
        </p>
      </div>

      {/* Sync status */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-6"
        style={{
          background: online
            ? "rgba(16,185,129,0.06)"
            : "rgba(245,158,11,0.06)",
          border: `0.5px solid ${
            online
              ? "rgba(16,185,129,0.2)"
              : "rgba(245,158,11,0.25)"
          }`,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: online
              ? "rgba(16,185,129,0.1)"
              : "rgba(245,158,11,0.1)",
          }}
        >
          <WifiOff
            size={16}
            style={{ color: online ? "#10B981" : "#F59E0B" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="bp-sub font-semibold text-slate-900">
            {online ? "You're online" : "You're offline"}
          </p>
          <p className="bp-micro text-slate-500 mt-0.5">
            {pendingSync > 0
              ? `${pendingSync} item(s) waiting to sync — will upload when connected`
              : online
              ? "All progress synced"
              : "New progress saved locally until you reconnect"}
          </p>
        </div>
        {online && pendingSync > 0 && (
          <span
            className="bp-micro font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: "rgba(245,158,11,0.1)",
              color: "#92400e",
            }}
          >
            {pendingSync} pending
          </span>
        )}
      </div>

      {/* Downloaded lessons */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : downloads.length === 0 ? (
        <div className="bp-card text-center py-16">
          <Download size={40} className="text-slate-200 mx-auto mb-4" />
          <h2 className="bp-heading text-slate-700 mb-2">
            No downloads yet
          </h2>
          <p className="bp-body text-slate-400 mb-6">
            Download lessons from the lesson player to study without internet
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="bp-sub font-semibold text-brand-blue hover:underline"
          >
            Browse your courses →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((dl) => {
          const lesson = lessons.find((l) => l.id === dl.lessonId);
          const isText = lesson?.type === "text";
          const isVideo = lesson?.type === "video";

          return (
            <div key={dl.lessonId} className="bp-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {lesson ? typeIcon(lesson.type) : <BookOpen size={16} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="bp-sub font-semibold text-slate-900 truncate">
                  {lesson?.title ?? "Lesson"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="bp-micro text-slate-400">
                    {isText ? "Text lesson" : isVideo ? "Video lesson" : "Lesson"} ·{" "}
                    Downloaded {new Date(dl.downloadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    navigate(`/courses/${dl.courseId}/lessons/${dl.lessonId}`)
                  }
                  className="bp-micro font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {isText ? "Read" : "Watch"}
                </button>
                <button
                  onClick={() => handleRemove(dl.lessonId)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                  aria-label="Remove download"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}