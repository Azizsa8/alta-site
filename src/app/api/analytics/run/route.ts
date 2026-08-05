import { NextResponse } from "next/server";
import { runDailyAnalysis, riyadhDay, previousDay } from "@/lib/analytics";
import { isProductionRuntime } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
/** Stay inside the platform budget — the AI client already times out at 25s. */
export const maxDuration = 60;

/**
 * The daily analysis job.
 *
 * Kept as a route rather than living inside the scheduled function so it can be
 * triggered on demand and tested without waiting for 08:00. The scheduled
 * Netlify function is a thin trigger that POSTs here with the shared secret.
 */
function authorised(req: Request) {
  const expected = process.env.CRON_SECRET;
  // With no secret configured we only allow local/dev use, never public prod.
  // NODE_ENV, not NETLIFY: the latter is build-time only and is absent in the
  // deployed runtime, so a check against it would silently fail open.
  if (!expected) return !isProductionRuntime();
  return req.headers.get("x-cron-secret") === expected;
}

export async function POST(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(req.url);
  // Default target is *yesterday* in Riyadh: at 08:00 the previous day is the
  // most recent complete one.
  const day = url.searchParams.get("day") ?? previousDay(riyadhDay());

  try {
    const report = await runDailyAnalysis(day);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}

/** Convenience for manual checks; same auth. */
export async function GET(req: Request) {
  return POST(req);
}
