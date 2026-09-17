/**
 * Tiny key/value store with multiple backends:
 * 1. KV REST API (Upstash Redis / Vercel KV via KV_REST_API_URL or UPSTASH_REDIS_REST_URL)
 * 2. Netlify Blobs (when deployed on Netlify)
 * 3. Filesystem with /tmp fallback (local dev and serverless runtime)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { isConfigured as supabaseConfigured, rpc } from "./supabase";

export type Backend = "supabase" | "kv" | "blobs" | "filesystem";

type BlobStore = {
  get(key: string, opts?: { type?: "json"; consistency?: "strong" }): Promise<unknown>;
  setJSON(key: string, value: unknown): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  list(opts?: { prefix?: string }): Promise<{ blobs: { key: string }[] }>;
};

function getLocalRootDir(): string {
  // On Vercel / serverless lambda, process.cwd() is read-only.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), ".alta_data");
  }
  return path.join(process.cwd(), ".data");
}

let cached: { name: string; store: BlobStore } | null = null;

function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ""), token };
  }
  return null;
}

async function kvFetch<T = unknown>(endpoint: string, method = "GET", body?: unknown): Promise<T | null> {
  const cfg = getKvConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T };
    return json.result !== undefined ? json.result : null;
  } catch {
    return null;
  }
}

async function blobStore(name: string): Promise<BlobStore | null> {
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return null;
  try {
    if (cached?.name === name) return cached.store;
    const mod = await import("@netlify/blobs");
    const store = mod.getStore({ name, consistency: "strong" }) as BlobStore;
    cached = { name, store };
    return store;
  } catch {
    return null;
  }
}

function fsPath(name: string, key: string) {
  const root = getLocalRootDir();
  const safe = key
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join(path.sep);
  return path.join(root, name, `${safe}.json`);
}

export function backendName(): Backend {
  // Supabase first: it is the only backend here that survives a deploy.
  // "filesystem" on Vercel means the lambda's own /tmp, which is wiped on
  // every deployment and whenever an idle instance recycles — that is how
  // submissions were being lost before this existed.
  if (supabaseConfigured()) return "supabase";
  if (getKvConfig()) return "kv";
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) return "blobs";
  return "filesystem";
}

export async function put(name: string, key: string, value: unknown) {
  if (supabaseConfigured()) {
    await rpc("admin_kv_put", { p_store: name, p_key: key, p_value: value });
    return;
  }

  const kv = getKvConfig();
  if (kv) {
    const kvKey = `alta:${name}:${key}`;
    const stringVal = JSON.stringify(value);
    await kvFetch(`/set/${encodeURIComponent(kvKey)}`, "POST", stringVal);
    return;
  }

  const store = await blobStore(name);
  if (store) {
    await store.setJSON(key, value);
    return;
  }

  const file = fsPath(name, key);
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
  } catch (err) {
    console.error("Storage put error:", err);
  }
}

export async function get<T>(name: string, key: string): Promise<T | null> {
  if (supabaseConfigured()) {
    return (await rpc<T>("admin_kv_get", { p_store: name, p_key: key })) ?? null;
  }

  const kv = getKvConfig();
  if (kv) {
    const kvKey = `alta:${name}:${key}`;
    const res = await kvFetch<string>(`/get/${encodeURIComponent(kvKey)}`);
    if (!res) return null;
    try {
      return (typeof res === "string" ? JSON.parse(res) : res) as T;
    } catch {
      return null;
    }
  }

  const store = await blobStore(name);
  if (store) {
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
  if (supabaseConfigured()) {
    const rows = await rpc<{ key: string }[]>("admin_kv_list", {
      p_store: name,
      p_prefix: prefix,
    });
    return Array.isArray(rows) ? rows.map((r) => r.key).sort() : [];
  }

  const kv = getKvConfig();
  if (kv) {
    const kvPrefix = `alta:${name}:${prefix}`;
    const keys = await kvFetch<string[]>(`/keys/${encodeURIComponent(kvPrefix)}*`);
    if (!Array.isArray(keys)) return [];
    const stripPrefix = `alta:${name}:`;
    return keys
      .map((k) => (k.startsWith(stripPrefix) ? k.slice(stripPrefix.length) : k))
      .sort();
  }

  const store = await blobStore(name);
  if (store) {
    const res = await store.list({ prefix });
    return res.blobs.map((b) => b.key);
  }

  const root = getLocalRootDir();
  const dir = path.join(root, name);
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
  if (supabaseConfigured()) {
    await rpc("admin_kv_delete", { p_store: name, p_key: key });
    return;
  }

  const kv = getKvConfig();
  if (kv) {
    const kvKey = `alta:${name}:${key}`;
    await kvFetch(`/del/${encodeURIComponent(kvKey)}`, "POST");
    return;
  }

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
