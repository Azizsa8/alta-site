import { NextResponse } from "next/server";
import { recordEvent, type EventType } from "@/lib/analytics";
import { clientKey, rateLimit } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`track:${clientKey(req)}`, 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, message: "rate-limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "invalid JSON" }, { status: 400 });
  }

  const type = (typeof body.type === "string" ? body.type : "page_view") as EventType;
  const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : undefined;
  const source = typeof body.source === "string" ? body.source.slice(0, 50) : "web";
  const text = typeof body.text === "string" ? body.text.slice(0, 500) : undefined;
  const service = typeof body.service === "string" ? body.service.slice(0, 100) : undefined;

  const id = await recordEvent({
    type,
    path,
    sessionId,
    source,
    text,
    service,
    meta: typeof body.meta === "object" && body.meta !== null ? (body.meta as Record<string, string | number | boolean>) : undefined,
  });

  return NextResponse.json({ ok: true, id });
}
