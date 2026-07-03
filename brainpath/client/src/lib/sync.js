import { db } from "./db.js";
import api from "./axios.js";

// ── Cache course catalogue into Dexie ────────────────────────────────

export async function cacheCourses(courses) {
  const now = new Date().toISOString();
  await db.courses.bulkPut(
    courses.map((c) => ({ ...c, cachedAt: now }))
  );
}

export async function getCachedCourses() {
  return db.courses.toArray();
}

// ── Cache lesson metadata into Dexie ────────────────────────────────

export async function cacheLessons(lessons, courseId) {
  const now = new Date().toISOString();
  await db.lessons.bulkPut(
    lessons.map((l) => ({ ...l, courseId, cachedAt: now }))
  );
}

export async function getCachedLessons(courseId) {
  return db.lessons.where("courseId").equals(courseId).toArray();
}

// ── Write progress locally first, queue for server sync ─────────────

export async function saveProgressLocally({
  userId,
  lessonId,
  courseId,
  status,
  timeSpent,
}) {
  const now = new Date().toISOString();

  // Upsert into local progress table
  const existing = await db.progress
    .where("lessonId").equals(lessonId)
    .and((p) => p.userId === userId)
    .first();

  if (existing) {
    await db.progress.update(existing.localId, {
      status,
      timeSpent,
      updatedAt: now,
      synced: 0,
    });
  } else {
    await db.progress.add({
      userId,
      lessonId,
      courseId,
      status,
      timeSpent,
      updatedAt: now,
      synced: 0,
    });
  }

  // Add to sync queue
  await db.syncQueue.add({
    type: "progress",
    payload: JSON.stringify({ lessonId, courseId, status, timeSpent }),
    createdAt: now,
  });
}

// ── Write quiz attempt locally, queue for server sync ────────────────

export async function saveQuizAttemptLocally({
  userId,
  quizId,
  moduleId,
  courseId,
  answers,
  score,
}) {
  const now = new Date().toISOString();

  await db.quizAttempts.add({
    userId,
    quizId,
    moduleId,
    courseId,
    answers: JSON.stringify(answers),
    score,
    attemptedAt: now,
    synced: 0,
  });

  await db.syncQueue.add({
    type: "quiz_attempt",
    payload: JSON.stringify({ quizId, moduleId, courseId, answers, score }),
    createdAt: now,
  });
}

// ── Drain the sync queue to the server ──────────────────────────────

export async function drainSyncQueue() {
  const pending = await db.syncQueue.orderBy("createdAt").toArray();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload);

      if (item.type === "progress") {
        await api.post(
          `/student/courses/${payload.courseId}/lessons/${payload.lessonId}/complete`,
          { time_spent: payload.timeSpent }
        );
      }

      if (item.type === "quiz_attempt") {
        await api.post(
          `/student/courses/${payload.courseId}/modules/${payload.moduleId}/quiz/submit`,
          { answers: payload.answers }
        );
      }

      // Remove from queue on success
      await db.syncQueue.delete(item.id);

      // Mark local record as synced
      if (item.type === "progress") {
        await db.progress
          .where("lessonId").equals(payload.lessonId)
          .modify({ synced: 1 });
      }
      if (item.type === "quiz_attempt") {
        await db.quizAttempts
          .where("quizId").equals(payload.quizId)
          .modify({ synced: 1 });
      }

      synced++;
    } catch (err) {
      // Leave in queue — will retry on next reconnect
      console.warn(`Sync failed for item ${item.id}:`, err.message);
      failed++;
    }
  }

  return { synced, failed };
}

// ── Download tracking ────────────────────────────────────────────────

export async function markDownloaded(lessonId, courseId) {
  await db.downloads.put({
    lessonId,
    courseId,
    downloadedAt: new Date().toISOString(),
  });
}

export async function getDownloadedLessons() {
  return db.downloads.toArray();
}

export async function isDownloaded(lessonId) {
  const row = await db.downloads.get(lessonId);
  return !!row;
}

export async function removeDownload(lessonId) {
  await db.downloads.delete(lessonId);
}

// ── Pending sync count — useful for UI indicators ────────────────────

export async function getPendingSyncCount() {
  return db.syncQueue.count();
}