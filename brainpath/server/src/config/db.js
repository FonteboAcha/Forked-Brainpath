import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// Supabase (and most managed Postgres hosts) require SSL.
// rejectUnauthorized: false is fine for class-project / free-tier use.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});
