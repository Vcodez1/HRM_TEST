import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Always use in-memory session store for local development with PGlite
  // The connect-pg-simple package requires a real PostgreSQL connection
  // which we don't have when using PGlite for data storage
  console.log("Using in-memory session store (PGlite mode)");
  const sessionStore = new session.MemoryStore();
  return session({
    secret: process.env.SESSION_SECRET || "default_local_secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Changed to false for local development
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple logout routes (both GET and POST for compatibility)
  app.get("/api/logout", (req, res) => {
    const session = (req as any).session;
    if (session?.user) {
      delete session.user;
    }
    res.redirect("/login");
  });

  app.post("/api/logout", (req, res) => {
    const session = (req as any).session;
    if (session?.user) {
      delete session.user;
    }
    res.json({ success: true, message: "Logged out successfully" });
  });

  console.log("Password-based authentication system initialized");
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const session = (req as any).session;
  console.log(`[Auth Check] ${req.method} ${req.path} - SessionID: ${req.sessionID} - User: ${session?.user?.email ?? 'None'}`);

  // Check for password-based session
  if (session?.user?.loginType === 'password') {
    // Verify the user still exists and is active
    try {
      const dbUser = await storage.getUser(session.user.id);
      if (!dbUser || !dbUser.isActive) {
        delete session.user;
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Attach user info to request for route handlers
      (req as any).user = {
        claims: {
          sub: dbUser.id,
          email: dbUser.email,
        },
        role: dbUser.role.toLowerCase(),
        loginType: 'password'
      };

      console.log(`[Auth Success] User ID: ${dbUser.id}, Role: ${dbUser.role}`);
      return next();
    } catch (error) {
      console.error("[Auth Error] Database check failed:", error);
      delete session.user;
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // No valid session found
  console.log(`[Auth Fail] No valid session user found for ${req.method} ${req.path}`);
  return res.status(401).json({ message: "Unauthorized" });
};