import type { Config } from "@netlify/functions";

/**
 * Daily behaviour-analysis trigger.
 *
 * 05:00 UTC == 08:00 Asia/Riyadh. Saudi Arabia is UTC+3 year-round (AST) and
 * does NOT observe daylight saving, so this single cron expression is correct
 * every day of the year. (Using 04:00 would be Gulf Standard Time / Dubai —
 * an hour early here.)
 *
 * This function stays deliberately thin: all the logic lives in the
 * /api/analytics/run route so it can be exercised on demand and unit-tested
 * without waiting for the schedule to fire.
 */
export default async function handler() {
  const base =
    process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET ?? "";

  const started = Date.now();
  try {
    const res = await fetch(`${base}/api/analytics/run`, {
      method: "POST",
      headers: { "x-cron-secret": secret, "content-type": "application/json" },
    });
    const body = await res.json();

    console.log(
      JSON.stringify({
        job: "daily-analysis",
        status: res.status,
        ms: Date.now() - started,
        day: body?.report?.day,
        degraded: body?.report?.degraded,
        degradedReason: body?.report?.degradedReason,
        events: body?.report?.totals?.events,
      }),
    );

    return new Response(JSON.stringify({ ok: res.ok }), { status: res.ok ? 200 : 500 });
  } catch (error) {
    console.error(
      JSON.stringify({
        job: "daily-analysis",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}

export const config: Config = {
  schedule: "0 5 * * *",
};
