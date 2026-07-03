import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

// GET /api/admin/stats
export async function getStats(req, res, next) {
  try {
    const [students, instructors, courses, pending, liveSessions, progress] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'instructor'"),
        pool.query("SELECT COUNT(*) FROM courses"),
        pool.query("SELECT COUNT(*) FROM instructor_requests WHERE status = 'pending'"),
        pool.query("SELECT COUNT(*) FROM live_sessions WHERE status = 'live'"),
        pool.query(`
          SELECT
            ROUND(AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END), 1) AS avg_completion,
            ROUND(AVG(score), 1) AS avg_quiz_score,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) AS lessons_completed
          FROM progress
        `),
      ]);

    res.json({
      students: parseInt(students.rows[0].count),
      instructors: parseInt(instructors.rows[0].count),
      courses: parseInt(courses.rows[0].count),
      pendingRequests: parseInt(pending.rows[0].count),
      liveSessions: parseInt(liveSessions.rows[0].count),
      progress: progress.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/instructor-requests
export async function listRequests(req, res, next) {
  try {
    const { status = "pending" } = req.query;
    const result = await pool.query(
      `SELECT id, name, email, qualification, subject_areas, status, created_at
       FROM instructor_requests
       WHERE status = $1
       ORDER BY created_at DESC`,
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/instructor-requests/:id/approve
export async function approveRequest(req, res, next) {
  try {
    const { id } = req.params;

    const found = await pool.query(
      "SELECT * FROM instructor_requests WHERE id = $1 AND status = 'pending'",
      [id]
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ message: "Pending request not found" });
    }

    const request = found.rows[0];

    // Create the real user account using the password_hash they submitted
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'instructor')
       RETURNING id, name, email, role, created_at`,
      [request.name, request.email, request.password_hash]
    );

    // Mark the request as approved
    await pool.query(
      `UPDATE instructor_requests
       SET status = 'approved', reviewed_by = $1, reviewed_at = now()
       WHERE id = $2`,
      [req.user.id, id]
    );

    res.json({
      message: "Instructor account created",
      user: userResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/instructor-requests/:id/reject
export async function rejectRequest(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE instructor_requests
       SET status = 'rejected', reviewed_by = $1, reviewed_at = now()
       WHERE id = $2 AND status = 'pending'
       RETURNING id`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pending request not found" });
    }

    res.json({ message: "Request rejected" });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/recent-signups
export async function recentSignups(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}