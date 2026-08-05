import { NextResponse } from "next/server";
import { handleInboundMessage } from "@/lib/agents/core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Simulator for the agent brain.
 *
 * This is what makes the WhatsApp system testable end-to-end with no WhatsApp
 * account, no phone number and no Meta approval: it feeds the same
 * `handleInboundMessage` the webhook feeds. Admin-token protected, because it
 * can drive real changes to a live site.
 */
function authorised(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return !process.env.NETLIFY; // local dev only
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  let body: { sender?: string; text?: string; audio?: { data: string; mimeType: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const sender = String(body.sender ?? "").trim();
  if (!sender) {
    return NextResponse.json({ ok: false, error: "sender required" }, { status: 400 });
  }

  const result = await handleInboundMessage({
    sender,
    text: String(body.text ?? ""),
    audio: body.audio,
  });

  return NextResponse.json({ ok: true, ...result });
}
