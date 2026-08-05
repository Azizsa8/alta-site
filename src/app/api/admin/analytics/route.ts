import { NextResponse } from "next/server";
import {
  readReport,
  listReportDays,
  readEvents,
  computeMetrics,
  riyadhDay,
  previousDay,
} from "@/lib/analytics";
import { listSubmissions } from "@/lib/submissions";
import { cookies } from "next/headers";
import { isAdminRequest, SESSION_COOKIE } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Admin read API.
 *
 * Returns raw visitor messages, so it accepts only an admin credential —
 * either the dashboard's signed session cookie or a bearer token for scripts.
 * With nothing configured it fails CLOSED in production.
 */
export async function GET(req: Request) {
  const jar = await cookies();
  if (!isAdminRequest(req, jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(req.url);
  const day = url.searchParams.get("day") ?? previousDay(riyadhDay());
  const live = url.searchParams.get("live") === "1";
  const withSubmissions = url.searchParams.get("submissions") === "1";

  // `live=1` recomputes today's numbers from raw events without writing a
  // report — useful for checking the pipeline before 08:00 has ever run.
  if (live) {
    const today = riyadhDay();
    const events = await readEvents(today);
    return NextResponse.json({
      ok: true,
      live: true,
      day: today,
      metrics: computeMetrics(today, events),
      eventCount: events.length,
    });
  }

  const report = await readReport(day);
  const days = await listReportDays();

  const submissions = withSubmissions
    ? {
        contact: await listSubmissions("contact", day),
        quote: await listSubmissions("quote", day),
      }
    : undefined;

  return NextResponse.json({ ok: true, day, report, availableDays: days, submissions });
}
