/**
 * sanitize.js — Server-side HTML sanitizer
 *
 * DOMPurify is browser-only. isomorphic-dompurify wraps it with jsdom
 * so the exact same sanitization rules run on the backend before anything
 * is written to the database.
 *
 * Usage:
 *   import { sanitizeHtml, sanitizeText } from "../utils/sanitize.js";
 *
 *   sanitizeHtml(content)   → strips dangerous tags/attrs, keeps formatting
 *   sanitizeText(value)     → strips ALL HTML — for plain text fields
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * For rich HTML fields (post content).
 * Keeps safe formatting tags (p, h1-h6, strong, em, ul, ol, li, a, img, etc.)
 * Strips: <script>, <iframe>, <object>, on* event attributes, javascript: hrefs.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return dirty;

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },       // standard HTML allowlist
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "action"],
  });
}

/**
 * For plain-text fields (title, category, description, slug, tags).
 * Strips every HTML tag — result is always safe plain text.
 */
export function sanitizeText(dirty) {
  if (!dirty || typeof dirty !== "string") return dirty;

  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
