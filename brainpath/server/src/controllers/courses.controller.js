import { pool } from "../config/db.js";

// GET /api/courses
export async function listCourses(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, title, description, category, difficulty, thumbnail_url FROM courses ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/:id
export async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM courses WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
