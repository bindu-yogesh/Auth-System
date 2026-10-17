
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";

dotenv.config();

const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env");
}

export const sessionMiddleware = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "user_sessions",
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
});
