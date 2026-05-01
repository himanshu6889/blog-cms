/**
 * csrfUtils.js  —  Frontend CSRF helper
 * ───────────────────────────────────────
 * Usage:
 *   1. Call initCsrf() once inside main.jsx (before rendering the app)
 *   2. Replace all fetch() calls that POST/PUT/DELETE with authFetch()
 */

import API_BASE from "../api";

// Stored in memory — XSS cannot steal this (unlike localStorage)
let _csrfToken = null;

// ─── Call once on app startup (main.jsx) ──────────────────────────────────────
export async function initCsrf() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/csrf-token`, {
      credentials: "include",
    });
    const data = await res.json();
    _csrfToken = data.csrfToken;
  } catch (err) {
    console.error("Failed to fetch CSRF token:", err);
  }
}

// ─── Drop-in replacement for fetch() on write operations ─────────────────────
// Automatically attaches X-CSRF-Token header + credentials.
// Skips Content-Type for FormData so the browser sets the multipart boundary.
export async function authFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Don't force Content-Type for FormData — browser must set it with boundary
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(needsCsrf && _csrfToken ? { "X-CSRF-Token": _csrfToken } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // always send HttpOnly cookie
  });

  // If the CSRF token is rejected for any reason (expired, invalid, missing —
  // e.g. server restarted and wiped its in-memory token store), silently fetch
  // a fresh token and retry the request once.
  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    const isCsrfError =
      body.error?.includes("expired") ||
      body.error?.includes("Invalid CSRF") ||
      body.error?.includes("CSRF token missing");
    if (isCsrfError) {
      await initCsrf();
      return authFetch(url, options); // retry once with fresh token
    }
  }

  return res;
}
