
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error.message);
});
