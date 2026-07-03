import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

// GET /api/health — confirms the API is up and can reach Postgres
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      db: "connected",
      serverTime: result.rows[0].now,
    });
  } catch (err) {
    // Still respond 200 for the API itself, but flag the DB as down —
    // useful while you're setting up Supabase and the DB isn't ready yet.
    res.json({
      status: "ok",
      db: "unreachable",
      error: err.message,
    });
  }
});

export default router;
