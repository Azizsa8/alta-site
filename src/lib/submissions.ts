import { put, listKeys, getMany } from "./store";
import { riyadhDay } from "./analytics";

export const SUBMISSIONS_STORE = "alta-submissions";

export type Submission = {
  id: string;
  kind: "contact" | "quote";
  at: string;
  day: string;
  path?: string;
  data: Record<string, unknown>;
};

export async function saveSubmission(
  kind: Submission["kind"],
  data: Record<string, unknown>,
  path?: string,
) {
  const at = new Date();
  const day = riyadhDay(at);
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const record: Submission = { id, kind, at: at.toISOString(), day, path, data };
  await put(SUBMISSIONS_STORE, `${kind}/${day}/${id}`, record);
  return id;
}

export async function listSubmissions(kind: Submission["kind"], day: string) {
  const keys = await listKeys(SUBMISSIONS_STORE, `${kind}/${day}/`);
  return getMany<Submission>(SUBMISSIONS_STORE, keys);
}

/**
 * Very small fixed-window limiter, per warm serverless instance.
 *
 * It is deliberately not a distributed limiter: the goal is to blunt naive
 * form spam and accidental double-submits, not to be a security control.
 * Treating it as more than that would be a mistake.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("x-nf-client-connection-ip") || "unknown";
}
