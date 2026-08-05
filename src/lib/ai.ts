/**
 * Gemini client.
 *
 * Two hard-won rules encoded here:
 *
 * 1. NEVER use the `gemini-flash-latest` alias on a free-tier key. It resolves
 *    to the newest model, whose free allowance is a few dozen requests *per
 *    day* — and the 429 says "retry in ~26s", which reads like a per-minute
 *    limit and misleads you into retrying forever. Walk an explicit chain of
 *    pinned models instead and fail OVER on 429, not retry: the quota buckets
 *    are separate, so the next model usually answers immediately.
 *
 * 2. Never honour a long `retryDelay` inside a request. Serverless functions
 *    have a hard duration budget (60s here); sleeping 26s inside the handler
 *    turns a degraded-but-usable response into a 502. Bursts are absorbed by
 *    re-running the job, not by holding the request open.
 */

export const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-flash-lite-latest"];

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export type AiResult = {
  ok: boolean;
  text: string;
  model?: string;
  /** Machine-readable reason, so callers can report *why* they degraded. */
  reason?: "no-key" | "quota" | "http-error" | "network" | "empty";
};

export function hasAiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(
  prompt: string,
  opts: { system?: string; maxOutputTokens?: number; temperature?: number } = {},
): Promise<AiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, text: "", reason: "no-key" };

  let lastReason: AiResult["reason"] = "network";

  for (const model of MODEL_CHAIN) {
    try {
      const res = await fetch(`${ENDPOINT(model)}?key=${key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(opts.system
            ? { systemInstruction: { parts: [{ text: opts.system }] } }
            : {}),
          generationConfig: {
            temperature: opts.temperature ?? 0.4,
            maxOutputTokens: opts.maxOutputTokens ?? 1024,
          },
        }),
        // Keep well inside the function budget; a slow model is a failed model.
        signal: AbortSignal.timeout(25_000),
      });

      if (res.status === 429) {
        // Exhausted for this model — move to the next, do not wait.
        lastReason = "quota";
        continue;
      }
      if (!res.ok) {
        lastReason = "http-error";
        continue;
      }

      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("")
          .trim() ?? "";

      if (!text) {
        lastReason = "empty";
        continue;
      }
      return { ok: true, text, model };
    } catch {
      lastReason = "network";
    }
  }

  return { ok: false, text: "", reason: lastReason };
}

/**
 * Ask for JSON and parse it defensively. Models routinely wrap JSON in a
 * ```json fence even when told not to, so strip fences before parsing rather
 * than treating it as a failure.
 */
export async function generateJson<T>(
  prompt: string,
  opts: { system?: string; maxOutputTokens?: number } = {},
): Promise<{ ok: boolean; data: T | null; model?: string; reason?: string }> {
  const res = await generate(prompt, { ...opts, temperature: 0.2 });
  if (!res.ok) return { ok: false, data: null, reason: res.reason };

  const cleaned = res.text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  try {
    return { ok: true, data: JSON.parse(cleaned) as T, model: res.model };
  } catch {
    return { ok: false, data: null, model: res.model, reason: "unparsable" };
  }
}
