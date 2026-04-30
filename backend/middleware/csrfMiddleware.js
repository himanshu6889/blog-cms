import crypto from "crypto";

/**
 * CSRF Protection Middleware
 * ─────────────────────────
 * Flow:
 *  1. Frontend calls GET /api/csrf-token on app load → gets a token
 *  2. Frontend stores token in memory (window.__csrfToken)
 *  3. Frontend sends token as X-CSRF-Token header on every POST/PUT/DELETE
 *  4. verifyCsrfToken middleware validates it before any write operation
 */

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Map<token, expiryTimestamp>
const csrfTokens = new Map();

// ─── Clean up expired tokens (runs on every new token request) ───────────────
function purgeExpired() {
  const now = Date.now();
  for (const [token, expiry] of csrfTokens) {
    if (now > expiry) csrfTokens.delete(token);
  }
}

// ─── GET /api/csrf-token ──────────────────────────────────────────────────────
// Frontend fetches this once on app load and stores it in memory
export const getCsrfToken = (req, res) => {
  purgeExpired();

  const token = crypto.randomBytes(32).toString("hex");
  csrfTokens.set(token, Date.now() + TOKEN_EXPIRY_MS);

  res.json({ csrfToken: token });
};

// ─── Middleware: apply to all POST / PUT / DELETE routes ──────────────────────
export const verifyCsrfToken = (req, res, next) => {
  // Skip for safe methods (GET, HEAD, OPTIONS)
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  const token = req.headers["x-csrf-token"];

  if (!token) {
    return res.status(403).json({ error: "CSRF token missing" });
  }

  const expiry = csrfTokens.get(token);

  if (!expiry) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  if (Date.now() > expiry) {
    csrfTokens.delete(token);
    return res.status(403).json({ error: "CSRF token expired — refresh the page" });
  }

  // Token is valid — allow the request through
  next();
};
