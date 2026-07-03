import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { db } from "../../lib/db.js";
import ReactMarkdown from "react-markdown";
import {
  ChevronLeft, ChevronRight, CheckCircle, FileText,
  Download, BookOpen, Video, Menu, X, Clock, Wifi,
} from "lucide-react";
import api from "../../lib/axios.js";
import { formatBytes, formatDuration } from "../../lib/cloudinary.js";

import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { getConnectionHint } from "../../lib/connection.js";

import { saveProgressLocally, markDownloaded, isDownloaded, removeDownload } from "../../lib/sync.js";

import { getAdaptiveVideoUrl, shouldSuggestAudioOnly } from "../../lib/videoQuality.js";
import { useConnectionQuality, useDemoQualityOverride, } from "../../hooks/useConnectionQuality.js";
import ConnectionBadge from "../../components/ConnectionBadge.jsx";

// ── Sidebar lesson list ──────────────────────────────────────────────
function LessonSidebar({ course, courseId, activeLessonId, onSelect, onQuiz })  {
  return (
    <aside className="hidden sm:flex flex-col w-72 shrink-0 border-r border-slate-200 bg-white min-h-screen overflow-y-auto">
      {/* Course title */}
      <div className="px-4 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <p className="bp-micro text-slate-400 mb-1">Course</p>
        <p className="bp-sub font-semibold text-slate-900 leading-snug">
          {course.title}
        </p>
      </div>

      {/* Modules + lessons */}
      <div className="flex-1 py-3">
        {course.modules?.map((module, mi) => (
          <div key={module.id} className="mb-2">
            <p className="bp-micro font-semibold text-slate-400 uppercase tracking-widest px-4 py-2">
              {mi + 1}. {module.title}
            </p>
            {module.lessons?.map((lesson) => {
              const isActive = lesson.id === activeLessonId;
              const isDone = lesson.status === "completed";

              return (
                <button
                  key={lesson.id}
                  onClick={() => onSelect(lesson.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-blue-50 border-r-2 border-brand-blue"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle size={15} className="text-brand-emerald" />
                    ) : lesson.type === "video" ? (
                      <Video
                        size={15}
                        className={isActive ? "text-brand-blue" : "text-slate-400"}
                      />
                    ) : (
                      <BookOpen
                        size={15}
                        className={isActive ? "text-brand-blue" : "text-slate-400"}
                      />
                    )}
                  </div>
                  <span
                    className={`bp-body truncate ${
                      isActive
                        ? "text-brand-blue font-medium"
                        : isDone
                        ? "text-slate-500"
                        : "text-slate-700"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  {lesson.duration && (
                    <span className="bp-micro text-slate-400 shrink-0 ml-auto">
                      {formatDuration(lesson.duration)}
                    </span>
                  )}
                </button>
              );
            })}
            {/* Module quiz button */}
            <button
            onClick={() =>
                onQuiz(module.id)
            }
            className="w-full flex items-center gap-3 px-4 py-2 text-left bp-micro font-semibold text-brand-amber hover:bg-amber-50 transition-colors"
            >
            <CheckCircle size={13} className="shrink-0" />
            Module quiz
            </button>
          </div>
        ))}
      </div>

      {/* Course resources */}
      {course.resources?.length > 0 && (
        <div className="border-t border-slate-200 p-4">
          <p className="bp-micro font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Course resources
          </p>
          <div className="space-y-2">
            {course.resources.map((r) => (
              <a
                key={r.id}
                href={r.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bp-micro text-slate-600 hover:text-brand-blue transition-colors"
              >
                <FileText size={13} className="text-red-400 shrink-0" />
                <span className="truncate">{r.title}</span>
                <Download size={11} className="ml-auto shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Video player ─────────────────────────────────────────────────────
function VideoPlayer({ url, effectiveType, audioOnly, onTimeUpdate }) {
  const videoRef = useRef(null);
  const adaptiveUrl = getAdaptiveVideoUrl(url, effectiveType);

  // When audio-only mode toggles, pause/resume video track
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (audioOnly) {
      // Hide video visually but keep audio playing
      video.style.opacity = "0";
    } else {
      video.style.opacity = "1";
    }
  }, [audioOnly]);

  // When quality tier changes, reload the video at new quality
// Resume from exact playback position
useEffect(() => {
  if (!videoRef.current || !adaptiveUrl) return;
  const video = videoRef.current;
  const currentTime = video.currentTime;
  const wasPaused = video.paused;

  // Listen for when the new source has loaded enough to seek
  function onCanPlay() {
    video.currentTime = currentTime;
    if (!wasPaused) {
      video.play().catch(() => {});
    }
    video.removeEventListener("canplay", onCanPlay);
  }

  video.addEventListener("canplay", onCanPlay);
  video.src = adaptiveUrl;
  video.load();

  // Cleanup in case component unmounts before canplay fires
  return () => {
    video.removeEventListener("canplay", onCanPlay);
  };
}, [adaptiveUrl]);

  return (
    <div
      className="w-full rounded-xl overflow-hidden relative"
      style={{
        background: "#000",
        aspectRatio: audioOnly ? "unset" : "16/9",
        height: audioOnly ? "80px" : undefined,
      }}
    >
      <video
        ref={videoRef}
        src={adaptiveUrl}
        controls
        className="w-full h-full transition-opacity duration-300"
        onTimeUpdate={() =>
          onTimeUpdate?.(Math.floor(videoRef.current?.currentTime ?? 0))
        }
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>

      {/* Audio-only overlay */}
      {audioOnly && (
        <div
          className="absolute inset-0 flex items-center justify-center gap-3"
          style={{ background: "#1e293b" }}
        >
          <div className="flex items-end gap-0.5 h-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-brand-blue"
                style={{
                  height: "40%",
                  animationName: "audioBar",
                  animationDuration: `${0.8 + i * 0.1}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDirection: "alternate",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p className="bp-sub font-semibold text-white">Audio only mode</p>
        </div>
      )}
    </div>
  );
}

// ── Markdown renderer ────────────────────────────────────────────────
function MarkdownContent({ content }) {
  return (
    <div className="bp-prose">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

// ── Main lesson player ───────────────────────────────────────────────
export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // const effectiveType = useConnectionQuality();
  const [effectiveType, setEffectiveType] = useState(
  () => getConnectionHint()?.effectiveType ?? "4g"
  );
  const [audioOnly, setAudioOnly] = useState(false);
  const [qualityChanged, setQualityChanged] = useState(false);


  const prevEffectiveType = useRef(effectiveType);
  // Track time spent on lesson
  const timeSpentRef = useRef(0);
  const timerRef = useRef(null);

   const online = useOnlineStatus();
   useConnectionQuality(setEffectiveType);
   useDemoQualityOverride(setEffectiveType);

  // Flat list of all lessons for Previous/Next navigation
  const allLessons = course?.modules?.flatMap((m) => m.lessons ?? []) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = allLessons[currentIndex - 1] ?? null;
  const nextLesson = allLessons[currentIndex + 1] ?? null;

  // Load course structure once
  useEffect(() => {
  api.get(`/student/courses/${courseId}/learn`)
    .then(({ data }) => {
      setCourse(data);
      setError("");
    })
    .catch(async () => {
      // Try loading course structure from Dexie
      try {
        const cachedCourse = await db.courses.get(courseId);
        if (cachedCourse) {
          // Build a minimal course object from cached data
          const cachedLessons = await db.lessons
            .where("courseId").equals(courseId).toArray();

          setCourse({
            ...cachedCourse,
            modules: cachedCourse.modules ?? [],
            resources: [],
          });
          setError("");
        } else {
          setError("Course not available offline. Connect to the internet.");
        }
      } catch {
        setError("Course not available offline. Connect to the internet.");
      }
    })
    .finally(() => setLoading(false));
}, [courseId]);

  // Load lesson content when lessonId changes
  useEffect(() => {
  if (!lessonId) return;
  setLessonLoading(true);
  timeSpentRef.current = 0;
  isDownloaded(lessonId).then(setDownloaded);

  clearInterval(timerRef.current);
  timerRef.current = setInterval(() => {
    timeSpentRef.current += 1;
  }, 1000);

  api.get(`/student/courses/${courseId}/lessons/${lessonId}`)
    .then(({ data }) => {
      setLesson(data);
      setError("");
    })
    .catch(async () => {
      // API failed — try loading from Dexie (offline fallback)
      try {
        const cachedLesson = await db.lessons.get(lessonId);
        const cachedContent = await db.lessonContent.get(lessonId);

        if (cachedLesson) {
          setLesson({
            id: lessonId,
            title: cachedLesson.title,
            type: cachedLesson.type,
            content: cachedContent?.content ?? null,
            content_url: cachedLesson.content_url ?? null,
            duration: cachedLesson.duration ?? null,
            status: "not_started",
            resources: [],
          });
          setError("");
        } else {
          setError(
            "This lesson isn't available offline. Connect to the internet or download it first."
          );
        }
      } catch {
        setError(
          "This lesson isn't available offline. Connect to the internet or download it first."
        );
      }
    })
    .finally(() => setLessonLoading(false));

  return () => clearInterval(timerRef.current);
}, [courseId, lessonId]);

// React to connection quality changes
useEffect(() => {
  if (prevEffectiveType.current === effectiveType) return;
  prevEffectiveType.current = effectiveType;

  // Show quality changed banner briefly
  setQualityChanged(true);
  const timer = setTimeout(() => setQualityChanged(false), 3000);

  return () => clearTimeout(timer);
}, [effectiveType]);

  function navigateToLesson(id) {
    setMobileMenuOpen(false);
    navigate(`/courses/${courseId}/lessons/${id}`);
  }

  async function handleDownload() {
  if (downloaded) {
    await removeDownload(lessonId);
    // Also remove cached content if it was a text lesson
    await db.lessonContent.delete(lessonId);
    setDownloaded(false);
    return;
  }

  setDownloading(true);
  try {
    if (lesson.type === "video" && lesson.content_url) {
      // Video — cache via Cache Storage (Serwist serves it offline)
      const cache = await caches.open("brainpath-lessons");
      await cache.add(lesson.content_url);
    } else if (lesson.type === "text" && lesson.content) {
      // Text — save markdown directly into Dexie
      await db.lessonContent.put({
        lessonId,
        title: lesson.title,
        content: lesson.content,
        savedAt: new Date().toISOString(),
      });
    }

    // Also cache lesson metadata so it's queryable offline
    await db.lessons.put({
        id: lessonId,
        moduleId: lesson.module_id ?? lesson.moduleId ?? null,
        courseId,
        title: lesson.title,
        type: lesson.type,
        content_url: lesson.content_url ?? null,
        duration: lesson.duration ?? null,
        cachedAt: new Date().toISOString(),
    });

    await markDownloaded(lessonId, courseId);
    setDownloaded(true);
  } catch (err) {
    console.error("Download failed:", err);
  } finally {
    setDownloading(false);
  }
}

  async function handleComplete() {
  setCompleting(true);
  try {
    const timeSpent = timeSpentRef.current;

    if (online) {
      // Online — write directly to server
      await api.post(
        `/student/courses/${courseId}/lessons/${lessonId}/complete`,
        { time_spent: timeSpent }
      );
    } else {
      // Offline — write to Dexie and queue for later sync
      await saveProgressLocally({
        userId: user?.id,
        lessonId,
        courseId,
        status: "completed",
        timeSpent,
      });
    }

    // Refresh course structure to update sidebar indicators
    if (online) {
      const { data } = await api.get(`/student/courses/${courseId}/learn`);
      setCourse(data);
    }

    setLesson((prev) => ({ ...prev, status: "completed" }));

    if (nextLesson) {
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
    }
  } catch {
    setError("Could not mark lesson as complete");
  } finally {
    setCompleting(false);
  }
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="bp-body text-slate-400">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="bp-body text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="bp-sub text-brand-blue"
          >
            ← Back to courses
          </button>
        </div>
      </div>
    );
  }

  // If no lessonId in URL, redirect to first lesson
  if (!lessonId && allLessons.length > 0) {
    navigate(`/courses/${courseId}/lessons/${allLessons[0].id}`, { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">

      {/* Desktop sidebar */}
      {course && (
        <LessonSidebar
          course={course}
          courseId={courseId}
          activeLessonId={lessonId}
          onSelect={navigateToLesson}
          onQuiz={(moduleId) => navigate(`/courses/${courseId}/modules/${moduleId}/quiz`)}
        />
      )}

      {/* Mobile lesson menu overlay */}
      {mobileMenuOpen && course && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          style={{ background: "rgba(15,23,42,0.5)" }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-4/5 bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
              <p className="bp-sub font-semibold text-slate-900">Lessons</p>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="py-3">
              {course.modules?.map((module, mi) => (
                <div key={module.id} className="mb-2">
                  <p className="bp-micro font-semibold text-slate-400 uppercase tracking-widest px-4 py-2">
                    {mi + 1}. {module.title}
                  </p>
                 {module.lessons?.map((l) => (
                    <button
                        key={l.id}
                        onClick={() => navigateToLesson(l.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                        l.id === lessonId ? "bg-blue-50 text-brand-blue" : "text-slate-700"
                        }`}
                    >
                        {l.status === "completed" ? (
                        <CheckCircle size={14} className="text-brand-emerald shrink-0" />
                        ) : (
                        <BookOpen size={14} className="text-slate-400 shrink-0" />
                        )}
                        <span className="bp-body truncate">{l.title}</span>
                    </button>
                    ))}

                    {/* Module quiz button */}
                    <button
                    onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(`/courses/${courseId}/modules/${module.id}/quiz`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left bp-micro font-semibold text-brand-amber hover:bg-amber-50 transition-colors"
                    >
                    <CheckCircle size={13} className="shrink-0" />
                    Module quiz
                    </button> 

                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu size={18} className="text-slate-600" />
            </button>
            <button
              onClick={() => navigate("/courses")}
              className="flex items-center gap-1.5 bp-sub text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:block">My courses</span>
            </button>
            {lesson && (
              <p className="bp-sub font-semibold text-slate-900 truncate">
                {lesson.title}
              </p>
            )}
          </div>

          {/* Completion status */}
          {lesson && (
            <div className="shrink-0 flex items-center gap-2">
              {/* Download button */}
            <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 bp-micro font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                style={{
                borderColor: downloaded ? "#10B981" : "#e2e8f0",
                color: downloaded ? "#065f46" : "#94a3b8",
                background: downloaded ? "rgba(16,185,129,0.06)" : "transparent",
                }}
                aria-label={downloaded ? "Remove download" : "Download for offline"}>
                <Download size={13} />
                {downloading ? "..." : downloaded ? "Downloaded" : "Download"}
            </button>
              {lesson.status === "completed" ? (
                <div className="flex items-center gap-1.5 bp-micro font-semibold text-brand-emerald">
                  <CheckCircle size={15} />
                  Completed
                </div>
              ) : (
                <button
                onClick={handleComplete}
                disabled={completing}
                className="flex items-center gap-1.5 bp-sub font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-colors hover:bg-blue-600"
                style={{ background: "#3B82F6" }}
                >
                <CheckCircle size={14} />
                {completing
                    ? "Saving..."
                    : online
                    ? "Mark complete"
                    : "Mark complete (offline)"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lesson content */}
        <div className="flex-1 px-4 sm:px-8 py-6 max-w-3xl w-full mx-auto">
          {lessonLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-64" />
              <div className="aspect-video bg-slate-200 rounded-xl" />
            </div>
          ) : lesson ? (
            <div className="space-y-6">

              {/* Lesson title */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {lesson.type === "video" ? (
                    <Video size={15} className="text-slate-400" />
                  ) : (
                    <BookOpen size={15} className="text-slate-400" />
                  )}
                  <span className="bp-micro text-slate-400 capitalize">{lesson.type} lesson</span>
                  {lesson.duration && (
                    <>
                      <span className="text-slate-300">·</span>
                      <Clock size={12} className="text-slate-400" />
                      <span className="bp-micro text-slate-400">
                        {formatDuration(lesson.duration)}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="bp-display text-slate-900">{lesson.title}</h1>
              </div>

              {/* Video player */}
              {lesson.type === "video" && lesson.content_url && (
                <div className="space-y-2">
                  {/* Quality changed banner — disappears after 3 seconds */}
                  {qualityChanged && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bp-micro font-semibold"
                      style={{
                        background: shouldSuggestAudioOnly(effectiveType)
                          ? "rgba(245,158,11,0.1)"
                          : "rgba(16,185,129,0.08)",
                        color: shouldSuggestAudioOnly(effectiveType)
                          ? "#92400e"
                          : "#065f46",
                        border: `0.5px solid ${
                          shouldSuggestAudioOnly(effectiveType)
                            ? "rgba(245,158,11,0.3)"
                            : "rgba(16,185,129,0.2)"
                        }`,
                      }}
                    >
                      <Wifi size={13} />
                      Connection changed to {effectiveType.toUpperCase()} —
                      video quality adjusted automatically
                    </div>
                  )}

                  {/* Audio-only suggestion — stays visible as long as connection is poor */}
                  {shouldSuggestAudioOnly(effectiveType) && !audioOnly && (
                    <div
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                      style={{
                        background: "rgba(245,158,11,0.08)",
                        border: "0.5px solid rgba(245,158,11,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">📶</span>
                        <p className="bp-micro font-semibold text-amber-800">
                          Poor connection detected — switch to audio only to save data
                        </p>
                      </div>
                      <button
                        onClick={() => setAudioOnly(true)}
                        className="bp-micro font-semibold px-3 py-1.5 rounded-lg text-white shrink-0 hover:bg-amber-600 transition-colors"
                        style={{ background: "#F59E0B" }}
                      >
                        Switch
                      </button>
                    </div>
                  )}

                  <VideoPlayer
                    url={lesson.content_url}
                    effectiveType={effectiveType}
                    audioOnly={audioOnly}
                    onTimeUpdate={(t) => { timeSpentRef.current = t; }}
                  />

                  {/* Audio-only toggle */}
                  <div className="flex items-center justify-between">
                    <ConnectionBadge effectiveType={effectiveType} />
                    {lesson.type === "video" && (
                      <button
                        onClick={() => setAudioOnly((prev) => !prev)}
                        className="flex items-center gap-1.5 bp-micro font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: audioOnly ? "#3B82F6" : "#e2e8f0",
                          color: audioOnly ? "#1d4ed8" : "#94a3b8",
                          background: audioOnly ? "rgba(59,130,246,0.06)" : "transparent",
                        }}
                      >
                        {audioOnly ? "▶ Show video" : "🎧 Audio only"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Text content */}
              {lesson.type === "text" && lesson.content && (
                <div className="bp-card">
                  <MarkdownContent content={lesson.content} />
                </div>
              )}

              {/* Lesson resources */}
              {lesson.resources?.length > 0 && (
                <div className="bp-card">
                  <p className="bp-sub font-semibold text-slate-700 mb-3">
                    Lesson resources
                  </p>
                  <div className="space-y-2">
                    {lesson.resources.map((r) => (
                      <a
                        key={r.id}
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-blue hover:bg-blue-50 transition-colors group"
                      >
                        <FileText size={16} className="text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="bp-sub font-semibold text-slate-800 truncate group-hover:text-brand-blue">
                            {r.title}
                          </p>
                          {r.file_size && (
                            <p className="bp-micro text-slate-400 mt-0.5">
                              {formatBytes(r.file_size)}
                            </p>
                          )}
                        </div>
                        <Download size={14} className="text-slate-400 group-hover:text-brand-blue shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous / Next navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {prevLesson ? (
                  <button
                    onClick={() => navigateToLesson(prevLesson.id)}
                    className="flex items-center gap-2 bp-sub font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span className="truncate max-w-[140px] sm:max-w-xs">
                      {prevLesson.title}
                    </span>
                  </button>
                ) : <span />}

                {nextLesson ? (
                  <button
                    onClick={() => navigateToLesson(nextLesson.id)}
                    className="flex items-center gap-2 bp-sub font-semibold text-brand-blue hover:text-blue-700 transition-colors ml-auto"
                  >
                    <span className="truncate max-w-[140px] sm:max-w-xs">
                      {nextLesson.title}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/courses")}
                    className="flex items-center gap-2 bp-sub font-semibold text-brand-emerald ml-auto"
                  >
                    Back to courses
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-16">
              <p className="bp-body text-slate-400">Select a lesson to begin</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}