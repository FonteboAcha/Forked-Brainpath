import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

// POST /api/instructor-requests
// Public — any visitor can submit an instructor application
export async function submitRequest(req, res, next) {
  try {
    const { name, email, password, qualification, subject_areas } = req.body;

    if (!name || !email || !password || !qualification || !subject_areas) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Check no existing user or pending request shares this email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1", [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const existingRequest = await pool.query(
      "SELECT id, status FROM instructor_requests WHERE email = $1", [email]
    );
    if (existingRequest.rows.length > 0) {
      const { status } = existingRequest.rows[0];
      return res.status(409).json({
        message:
          status === "pending"
            ? "A request with this email is already under review"
            : "This email was previously reviewed — contact an admin",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO instructor_requests (name, email, password_hash, qualification, subject_areas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, qualification, subject_areas, status, created_at`,
      [name, email, passwordHash, qualification, subject_areas]
    );

    res.status(201).json({
      message: "Request submitted — you will be notified once reviewed",
      request: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}