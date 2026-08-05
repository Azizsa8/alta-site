/**
 * Admin authentication.
 *
 * Two credentials are accepted, for two different callers:
 *   • a signed session cookie — for a human in a browser (the dashboard)
 *   • `Authorization: Bearer <ADMIN_TOKEN>` — for scripts and curl
 *
 * A browser cannot attach a bearer header by navigating to a URL, which is why
 * the token alone was never enough to make a dashboard usable.
 *
 * The password is never stored — only a scrypt digest. Sessions are stateless
 * HMAC-signed cookies, so there is no session store to operate or invalidate.
 */

import crypto from "node:crypto";

export const SESSION_COOKIE = "alta_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // one working day

/* ------------------------------------------------------------- password -- */

/** Format: `scrypt$<saltHex>$<keyHex>`. Generate with scripts/hash-password.mjs. */
export function hashPassword(password: string, salt?: Buffer) {
  const s = salt ?? crypto.randomBytes(16);
  const key = crypto.scryptSync(password, s, 64);
  return `scrypt$${s.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, "hex");
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    // Constant-time: a length-varying or short-circuiting compare leaks the
    // digest one byte at a time.
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------- session -- */

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSession(username: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${Buffer.from(username).toString("base64url")}.${expires}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_SECONDS };
}

export function readSession(cookieValue: string | undefined): { username: string } | null {
  if (!cookieValue || !sessionSecret()) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;

  const [userB64, expiresRaw, signature] = parts;
  const payload = `${userB64}.${expiresRaw}`;
  const expected = sign(payload);

  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  // Verify the signature BEFORE trusting the expiry — the expiry is part of
  // the signed payload precisely so it cannot be edited by the client.
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return null;

  return { username: Buffer.from(userB64, "base64url").toString("utf8") };
}

/* ------------------------------------------------------------- gateway -- */

function bearerMatches(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** True when the caller may read admin data by either credential. */
export function isAdminRequest(req: Request, cookieValue?: string) {
  if (bearerMatches(req)) return true;
  if (readSession(cookieValue)) return true;
  // Nothing configured at all: allow locally, never in production.
  const configured = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD_HASH;
  return !configured && !process.env.NETLIFY;
}

export function isLoginConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.ADMIN_SESSION_SECRET,
  );
}
