import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics";
import { rateLimit, clientKey } from "@/lib/submissions";

export const dynamic = "force-dynamic";

/** Explicit satisfaction signal from the chat widget (and, later, any surface). */
export async function POST(req: Request) {
  if (!rateLimit(`feedback:${clientKey(req)}`, 10).allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { sessionId?: string; score?: number; source?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const score = Number(body.score);
  if (score !== 1 && score !== -1) {
    return NextResponse.json({ ok: false, error: "score must be 1 or -1" }, { status: 400 });
  }

  await recordEvent({
    type: "feedback",
    source: body.source ?? "chat",
    sessionId: body.sessionId,
    score,
    text: body.note?.slice(0, 500),
  });

  return NextResponse.json({ ok: true });
}
