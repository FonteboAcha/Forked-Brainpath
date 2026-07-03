import { Router } from "express";
import {
  getDashboardData,
  getEnrolledCourses,
  getAllCourses,
  enrollCourse,
  getLessonResources,
  getCoursePlayer,
  getLessonContent,
  completeLesson,
  getQuizForStudent,
  submitQuiz,
  getMyLiveSessions,
  joinSession,
} from "../controllers/student.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.get("/dashboard",                                    getDashboardData);
router.get("/courses",                                      getEnrolledCourses);
router.get("/courses/discover",                             getAllCourses);
router.post("/courses/:id/enroll",                          enrollCourse);
router.get("/lessons/:lessonId/resources",                  getLessonResources);
router.get("/courses/:courseId/learn",                      getCoursePlayer);
router.get("/courses/:courseId/lessons/:lessonId",          getLessonContent);
router.post("/courses/:courseId/lessons/:lessonId/complete", completeLesson);

router.get("/courses/:courseId/modules/:moduleId/quiz", getQuizForStudent);
router.post("/courses/:courseId/modules/:moduleId/quiz/submit", submitQuiz);
router.get("/sessions", getMyLiveSessions);
router.post("/sessions/:id/join", joinSession);

export default router;