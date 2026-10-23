import { createHmac } from "node:crypto";
import { Router, type ErrorRequestHandler, type Request } from "express";
import { getToken } from "next-auth/jwt";
import { doubleCsrf } from "csrf-csrf";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/** Protect custom Express writes; NextAuth validates its own login/logout tokens. */
export function createCsrfProtection(origin: string, authSecret: string) {
  if (!authSecret) throw new Error("NEXTAUTH_SECRET is required for CSRF protection");
  const trustedOrigin = new URL(origin).origin;
  const secure = trustedOrigin.startsWith("https:");
  const sessions = new WeakMap<Request, string>();
  // Derive a separate signing key rather than reuse the authentication key directly.
  const secret = createHmac("sha256", authSecret).update("express-csrf-v1").digest("hex");
  const { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError } = doubleCsrf({
    getSecret: () => secret,
    getSessionIdentifier: (req) => sessions.get(req)!,
    cookieName: secure ? "__Host-legions.csrf" : "legions.csrf",
    cookieOptions: { httpOnly: true, secure, sameSite: "strict", path: "/" },
    getCsrfTokenFromRequest: (req) => req.get("x-csrf-token"),
  });
  const router = Router();
  router.use(async (req, res, next) => {
    if (req.path === "/api/auth" || req.path.startsWith("/api/auth/") ||
      (safeMethods.has(req.method) && req.path !== "/api/csrf")) {
      return next("router");
    }
    const source = req.get("origin");
    const site = req.get("sec-fetch-site");
    if ((source && source !== trustedOrigin) || site === "cross-site" || site === "same-site") {
      return res.status(403).json({ error: "Cross-origin request rejected", code: "EBADCSRFTOKEN" });
    }
    try {
      const token = await getToken({ req, secret: authSecret, secureCookie: secure });
      // Legacy JWTs remain usable until NextAuth upgrades them on session refresh.
      const sessionId = token?.csrfSessionId ?? token?.jti;
      if (!token?.sub || typeof sessionId !== "string" || !sessionId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      sessions.set(req, sessionId);
    } catch {
      return res.status(401).json({ error: "Invalid authentication" });
    }
    next();
  });
  router.get("/api/csrf", (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.vary("Cookie");
    res.json({ csrfToken: generateCsrfToken(req, res) });
  });
  router.use((req, res, next) => {
    // Keep the double-submit boundary explicit for review and static analysis.
    // The library additionally verifies the HMAC against this request's session.
    const csrfCookie = secure ? req.cookies["__Host-legions.csrf"] : req.cookies["legions.csrf"];
    if (typeof csrfCookie !== "string" || csrfCookie !== req.get("x-csrf-token")) {
      return next(invalidCsrfTokenError);
    }
    doubleCsrfProtection(req, res, next);
  });
  const handleCsrfError: ErrorRequestHandler = (error, _req, res, next) => {
    if (error !== invalidCsrfTokenError) return next(error);
    res.status(403).json({ error: "Invalid CSRF token", code: "EBADCSRFTOKEN" });
  };
  router.use(handleCsrfError);
  return router;
}
