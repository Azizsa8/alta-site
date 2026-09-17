/**
 * Minimal PostgREST client for the ALTA CMS database.
 *
 * Written against `fetch` rather than pulling in @supabase/supabase-js: the
 * site only needs a handful of table reads, RPC calls and inserts, and every
 * kilobyte here is paid on each serverless cold start.
 *
 * Security model (see the alta_cms_access_model migration):
 *   * Only the anon key lives in the environment. There is no service-role
 *     key anywhere in this codebase, so no single leaked value grants full
 *     database access.
 *   * The anon key can INSERT a submission and SELECT published pages and
 *     public site settings. It cannot read a single lead — RLS forbids it.
 *   * Anything touching customer PII goes through a SECURITY DEFINER RPC
 *     guarded by ALTA_DB_SECRET.
 *
 * Every function returns null / false rather than throwing, because these sit
 * behind request handlers that must not 500 a visitor over a database blip.
 */

const URL_ = process.env.SUPABASE_URL ?? "";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const SECRET = process.env.ALTA_DB_SECRET ?? "";

export function isConfigured() {
  return Boolean(URL_ && ANON);
}

/** True when privileged (PII-reading) calls are possible. */
export function hasAdminSecret() {
  return Boolean(isConfigured() && SECRET);
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: ANON,
    authorization: `Bearer ${ANON}`,
    "content-type": "application/json",
    ...extra,
  };
}

async function request<T>(path: string, init: RequestInit): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers as Record<string, string>) },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`supabase ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
      return null;
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`supabase ${path} failed`, err);
    return null;
  }
}

/** Call a SECURITY DEFINER function, injecting the shared secret. */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}) {
  if (!SECRET) return null;
  return request<T>(`rpc/${fn}`, {
    method: "POST",
    body: JSON.stringify({ p_secret: SECRET, ...args }),
  });
}

/* ------------------------------------------------------------ TABLES -- */

export async function insertRow<T>(table: string, row: Record<string, unknown>) {
  return request<T>(table, {
    method: "POST",
    body: JSON.stringify(row),
    headers: { prefer: "return=minimal" },
  });
}

export async function selectRows<T>(table: string, query = "select=*") {
  return request<T>(`${table}?${query}`, { method: "GET" });
}
