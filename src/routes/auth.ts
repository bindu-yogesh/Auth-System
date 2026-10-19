
import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/requireAuth";
import {
  loginLimiter,
  signupLimiter,
} from "../middleware/authRateLimit";

const router = Router();

// SIGNUP
router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, username, email and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        message: "Name must be between 1 and 100 characters.",
      });
    }

    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        message:
          "Username must be 3–30 characters and contain only letters, numbers, or underscores.",
      });
    }

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be 8–72 characters long.",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const existingUsername = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [cleanUsername]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({
        message: "Username is already taken.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, username, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, username, email, created_at`,
      [cleanName, cleanUsername, cleanEmail, passwordHash]
    );

    const user = result.rows[0];

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session creation failed:", sessionError.message);
        return res.status(500).json({
          message: "Account created, but login failed. Please log in.",
        });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);
          return res.status(500).json({
            message: "Account created, but login failed. Please log in.",
          });
        }

        return res.status(201).json({
          message: "Account created successfully.",
          user,
        });
      });
    });
  } catch (error) {
    // PostgreSQL unique-constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({
        message: "That username or email is already registered.",
      });
    }

    console.error("Signup failed:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

// LOGIN
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, username, email, password_hash
       FROM users
       WHERE email = $1`,
      [cleanEmail]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError.message);
        return res.status(500).json({
          message: "Unable to log in. Please try again.",
        });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);
          return res.status(500).json({
            message: "Unable to log in. Please try again.",
          });
        }

        return res.json({
          message: "Login successful.",
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

// GET CURRENT USER
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, username, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Fetching current user failed:", error);
    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

// UPDATE PROFILE (USERNAME AND EMAIL)
router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (typeof username !== "string" || typeof email !== "string") {
      return res.status(400).json({
        message: "Username and email are required.",
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        message:
          "Username must be 3–30 characters and contain only letters, numbers, or underscores.",
      });
    }

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET username = $1, email = $2
       WHERE id = $3
       RETURNING id, name, username, email, created_at`,
      [cleanUsername, cleanEmail, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({
        message: "That username or email is already in use.",
      });
    }

    console.error("Profile update failed:", error);
    return res.status(500).json({
      message: "Something went wrong while updating your profile.",
    });
  }
});

// CHANGE PASSWORD
router.patch("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({
        message: "New password must be 8–72 characters long.",
      });
    }

    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, req.session.userId]
    );

    // Regenerate the current session ID after a credential change.
    const userId = req.session.userId;

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed after password change:", sessionError.message);
        return res.status(500).json({
          message:
            "Password changed, but session renewal failed. Please log in again.",
        });
      }

      req.session.userId = userId;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed after password change:", saveError.message);
          return res.status(500).json({
            message:
              "Password changed, but session renewal failed. Please log in again.",
          });
        }

        return res.json({
          message: "Password changed successfully.",
        });
      });
    });
  } catch (error) {
    console.error("Password change failed:", error);
    return res.status(500).json({
      message: "Something went wrong while changing your password.",
    });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.status(200).json({
      message: "Logged out successfully.",
    });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);
      return res.status(500).json({
        message: "Unable to log out.",
      });
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({
      message: "Logged out successfully.",
    });
  });
});

export default router;
