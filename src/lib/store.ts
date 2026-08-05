/**
 * Tiny key/value store with two backends.
 *
 * On Netlify the data lives in Netlify Blobs. Everywhere else (local dev, CI,
 * the verification script) it falls back to `.data/` on disk. Both expose the
 * same four operations, so nothing above this file knows or cares which is
 * active — that is what makes the analytics and agent layers testable without
 * a deploy.
 *
 * Design note: there is no atomic append in Blobs, so callers write ONE KEY
 * PER RECORD and reduce at read time. Appending to a shared array would drop
 * writes whenever two visitors submit within the same round-trip.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type Backend = "blobs" | "filesystem";

type BlobStore = {
  get(key: string, opts?: { type?: "json"; consistency?: "strong" }): Promise<unknown>;
  setJSON(key: string, value: unknown): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  list(opts?: { prefix?: string }): Promise<{ blobs: { key: string }[] }>;
};

const ROOT = path.join(process.cwd(), ".data");

let cached: { name: string; store: BlobStore } | null = null;

async function blobStore(name: string): Promise<BlobStore | null> {
  // Netlify injects these at runtime; their absence is the signal to fall back.
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return null;
  try {
    if (cached?.name === name) return cached.store;
    const mod = await import("@netlify/blobs");
    const store = mod.getStore({ name, consistency: "strong" }) as BlobStore;
    cached = { name, store };
    return store;
  } catch {
    // Package not installed / not running on Netlify — use the filesystem.
    return null;
  }
}

function fsPath(name: string, key: string) {
  // Keys contain "/" as a namespace separator; map that onto directories and
  // guard against traversal from any caller-supplied id.
  const safe = key
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join(path.sep);
  return path.join(ROOT, name, `${safe}.json`);
}

export function backendName(): Backend {
  return process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT
    ? "blobs"
    : "filesystem";
}

export async function put(name: string, key: string, value: unknown) {
  const store = await blobStore(name);
  if (store) {
    await store.setJSON(key, value);
    return;
  }
  const file = fsPath(name, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

export async function get<T>(name: string, key: string): Promise<T | null> {
  const store = await blobStore(name);
  if (store) {
    // Strong consistency matters here: the default is eventual, which can
    // serve a stale report for up to a minute right after it is written.
    const v = await store.get(key, { type: "json", consistency: "strong" });
    return (v as T) ?? null;
  }
  try {
    return JSON.parse(await fs.readFile(fsPath(name, key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function listKeys(name: string, prefix: string): Promise<string[]> {
  const store = await blobStore(name);
  if (store) {
    const res = await store.list({ prefix });
    return res.blobs.map((b) => b.key);
  }

  const dir = path.join(ROOT, name);
  const out: string[] = [];
  async function walk(current: string, rel: string) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const nextRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(path.join(current, entry.name), nextRel);
      } else if (entry.name.endsWith(".json")) {
        out.push(nextRel.replace(/\.json$/, ""));
      }
    }
  }
  await walk(dir, "");
  return out.filter((k) => k.startsWith(prefix)).sort();
}

export async function getMany<T>(name: string, keys: string[]): Promise<T[]> {
  const results = await Promise.all(keys.map((k) => get<T>(name, k)));
  return results.filter((r) => r !== null) as T[];
}

export async function remove(name: string, key: string) {
  const store = await blobStore(name);
  if (store) {
    await store.delete(key);
    return;
  }
  try {
    await fs.unlink(fsPath(name, key));
  } catch {
    /* already gone */
  }
}
