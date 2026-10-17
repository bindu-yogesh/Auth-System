import { sessionMiddleware } from "./middleware/session";
import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "node:path";
import { pool } from "./db/pool";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(sessionMiddleware);
app.use("/api/auth", authRouter);

// Serve the frontend from the frontend directory.
app.use(express.static(path.join(process.cwd(), "frontend")));

// Check whether the API is running.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Authentication API is running",
  });
});

// Check whether PostgreSQL is reachable.
app.get("/api/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      status: "ok",
      message: "Database connection successful",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`API health: http://localhost:${PORT}/api/health`);
      console.log(`DB health: http://localhost:${PORT}/api/health/db`);
    });
  } catch (error) {
    console.error("Could not connect to PostgreSQL:", error);
    await pool.end();
    process.exit(1);
  }
}

startServer();
