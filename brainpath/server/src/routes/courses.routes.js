import { Router } from "express";
import { listCourses, getCourseById } from "../controllers/courses.controller.js";

const router = Router();

router.get("/", listCourses);
router.get("/:id", getCourseById);

export default router;
