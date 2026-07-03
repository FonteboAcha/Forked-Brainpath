import Dexie from "dexie";

export const db = new Dexie("BrainPathDB");

db.version(1).stores({
  courses:      "id, title, category",
  lessons:      "id, moduleId, title, type",
  progress:     "++localId, userId, lessonId, status, updatedAt, synced",
  quizAttempts: "++localId, userId, quizId, attemptedAt, synced",
  syncQueue:    "++id, type, createdAt",
});

// Version 2 — adds richer course caching and downloaded lessons tracking
db.version(2).stores({
  courses:      "id, title, category, cachedAt",
  lessons:      "id, moduleId, courseId, title, type, cachedAt",
  progress:     "++localId, userId, lessonId, status, updatedAt, synced",
  quizAttempts: "++localId, userId, quizId, attemptedAt, synced",
  syncQueue:    "++id, type, createdAt",
  // Tracks which lessons the student explicitly downloaded for offline
  downloads:    "lessonId, courseId, downloadedAt",
  lessonContent: "lessonId",  // stores full text content for offline reading
});

export default db;