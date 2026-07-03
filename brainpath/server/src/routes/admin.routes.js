import { Router } from "express";
import {
  getStats,
  listRequests,
  approveRequest,
  rejectRequest,
  recentSignups,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// All admin routes require a valid token AND the 'admin' role
router.use(requireAuth, requireRole("admin"));

router.get("/stats", getStats);
router.get("/instructor-requests", listRequests);
router.patch("/instructor-requests/:id/approve", approveRequest);
router.patch("/instructor-requests/:id/reject", rejectRequest);
router.get("/recent-signups", recentSignups);

export default router;