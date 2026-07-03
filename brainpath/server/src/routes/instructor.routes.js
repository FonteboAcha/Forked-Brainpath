import { Router } from "express";
import {
  getMyCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  createLesson,
  updateLesson,
  deleteLesson,
  addResource,
  deleteResource,
  createQuiz,
  getQuiz,
  getDashboardData,
  getMySessions,
  createSession,
  startSession,
  endSession,
  deleteSession,
} from "../controllers/instructor.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("instructor"));

router.get("/dashboard", getDashboardData);
router.get("/courses",              getMyCourses);
router.get("/courses/:id",          getCourseDetail);
router.post("/courses",             createCourse);
router.patch("/courses/:id",        updateCourse);
router.delete("/courses/:id",       deleteCourse);
router.post("/courses/:id/modules", createModule);

router.post(
  "/courses/:courseId/modules/:moduleId/lessons",
  createLesson
);
router.patch(
  "/courses/:courseId/modules/:moduleId/lessons/:lessonId",
  updateLesson
);
router.delete(
  "/courses/:courseId/modules/:moduleId/lessons/:lessonId",
  deleteLesson
);
router.post("/resources", addResource);
router.delete("/resources/:id", deleteResource);

router.post("/courses/:courseId/modules/:moduleId/quiz", createQuiz);
router.get("/courses/:courseId/modules/:moduleId/quiz",  getQuiz);

router.get("/sessions", getMySessions);
router.post("/sessions", createSession);
router.patch("/sessions/:id/start", startSession);
router.patch("/sessions/:id/end", endSession);
router.delete("/sessions/:id", deleteSession);
export default router;