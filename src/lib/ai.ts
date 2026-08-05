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
 *
 * 3. `gemini-2.5-flash` is a THINKING model and its reasoning tokens are
 *    charged against `maxOutputTokens`. Observed in production: a 900-token
 *    budget was consumed by 821 thinking tokens, leaving 75 for the answer,
 *    which truncated the JSON mid-string and failed to parse. These calls are
 *    extraction and summarisation, not reasoning puzzles, so thinking is
 *    disabled by default via `thinkingBudget: 0`.
 */

export const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-flash-lite-latest"];

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export type AiResult = {
  ok: boolean;
  text: string;
  model?: string;
  /** Machine-readable reason, so callers can report *why* they degraded. */
  reason?: "no-key" | "quota" | "http-error" | "network" | "empty" | "truncated";
};

export function hasAiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(
  prompt: string,
  opts: {
    system?: string;
    maxOutputTokens?: number;
    temperature?: number;
    /** Reasoning-token allowance. 0 disables thinking (the default here). */
    thinkingBudget?: number;
    /** Set to "application/json" to force well-formed JSON with no fences. */
    responseMimeType?: string;
  } = {},
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
            // Thinking tokens count against maxOutputTokens; leaving this on
            // starves the actual answer. See rule 3 above.
            thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? 0 },
            ...(opts.responseMimeType
              ? { responseMimeType: opts.responseMimeType }
              : {}),
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
      const candidate = data?.candidates?.[0];
      const text: string =
        candidate?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("")
          .trim() ?? "";

      if (!text) {
        lastReason = "empty";
        continue;
      }
      // A truncated answer is a failure, not a result. Returning it silently
      // is how half a JSON object reaches the parser.
      if (candidate?.finishReason === "MAX_TOKENS") {
        lastReason = "truncated";
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
  const res = await generate(prompt, {
    ...opts,
    temperature: 0.2,
    // Native JSON mode: the model cannot emit a ```json fence or prose around
    // the object, which removes the most common parse failure at the source.
    responseMimeType: "application/json",
    // Structured output is verbose; give it real headroom now that thinking
    // is not competing for the same budget.
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
  });
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
