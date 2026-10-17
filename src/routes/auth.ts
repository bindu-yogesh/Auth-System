import { requireAuth } from "../middleware/requireAuth";
import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { loginLimiter, signupLimiter } from "../middleware/authRateLimit";

const router = Router();

router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({ message: "Name, email and password are required." });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 100) {
      res.status(400).json({ message: "Name must be between 1 and 100 characters." });
      return;
    }

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      res.status(400).json({ message: "Please enter a valid email address." });
      return;
    }

    if (password.length < 8 || password.length > 72) {
      res.status(400).json({ message: "Password must be 8–72 characters long." });
      return;
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = result.rows[0];

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session creation failed:", sessionError.message);
        res.status(500).json({ message: "Account created, but login failed. Please log in." });
        return;
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);
          res.status(500).json({ message: "Account created, but login failed. Please log in." });
          return;
        }

        res.status(201).json({
          message: "Account created successfully.",
          user,
        });
      });
    });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: "Email and password are required.",
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [cleanEmail]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError.message);
        res.status(500).json({ message: "Unable to log in. Please try again." });
        return;
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);
          res.status(500).json({ message: "Unable to log in. Please try again." });
          return;
        }

        res.json({
          message: "Login successful.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});



router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: "User account not found." });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Fetching current user failed:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

router.post("/logout", (req, res) => {
  if (!req.session) {
    res.status(200).json({ message: "Logged out successfully." });
    return;
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);
      res.status(500).json({ message: "Unable to log out." });
      return;
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({ message: "Logged out successfully." });
  });
});

export default router;
