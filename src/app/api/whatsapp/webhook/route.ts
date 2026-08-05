import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { handleInboundMessage } from "@/lib/agents/core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * WhatsApp Cloud API transport.
 *
 * This is the ONLY WhatsApp-specific file in the agent system — everything
 * else goes through `handleInboundMessage`. Swapping to another channel means
 * writing a second file like this one, not touching the brain.
 *
 * We deliberately use Meta's official Cloud API rather than a Baileys /
 * whatsapp-web.js bridge: those drive a real WhatsApp Web session, violate
 * WhatsApp's terms, and get the number permanently banned — which for a
 * "24/7 employee" product would take every client's agent down at once.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

/** GET: Meta's one-time subscription handshake. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

/**
 * Verify Meta's HMAC signature over the RAW body.
 *
 * Must run on the exact bytes received — re-serialising the parsed JSON
 * changes key order and whitespace and the digest will never match.
 */
function verifySignature(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return { ok: false, reason: "no-app-secret" };
  if (!header?.startsWith("sha256=")) return { ok: false, reason: "no-signature" };

  const expected = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const provided = header.slice(7);
  if (provided.length !== expected.length) return { ok: false, reason: "bad-signature" };

  const equal = crypto.timingSafeEqual(
    Buffer.from(provided, "hex"),
    Buffer.from(expected, "hex"),
  );
  return equal ? { ok: true } : { ok: false, reason: "bad-signature" };
}

async function downloadMedia(mediaId: string) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return null;
  try {
    const metaRes = await fetch(`${GRAPH}/${mediaId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) return null;
    const meta = await metaRes.json();

    const binRes = await fetch(meta.url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!binRes.ok) return null;

    const buf = Buffer.from(await binRes.arrayBuffer());
    return { data: buf.toString("base64"), mimeType: meta.mime_type ?? "audio/ogg" };
  } catch {
    return null;
  }
}

async function sendText(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    // Not yet provisioned — log so the reply is still observable in dev.
    console.log(JSON.stringify({ channel: "whatsapp", to, body, sent: false }));
    return false;
  }
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      // WhatsApp rejects bodies over 4096 characters.
      text: { body: body.slice(0, 4000), preview_url: true },
    }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = verifySignature(raw, req.headers.get("x-hub-signature-256"));
  if (!sig.ok) {
    return NextResponse.json({ ok: false, error: sig.reason }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Always 200 quickly. Meta retries aggressively on any non-2xx, which would
  // re-deliver — and therefore re-execute — the same client instruction.
  try {
    const entries = (payload.entry ?? []) as {
      changes?: { value?: { messages?: WaMessage[] } }[];
    }[];

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        for (const message of change.value?.messages ?? []) {
          await handleOne(message);
        }
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        channel: "whatsapp",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  return NextResponse.json({ ok: true });
}

type WaMessage = {
  from: string;
  type: string;
  text?: { body?: string };
  audio?: { id?: string };
  voice?: { id?: string };
};

async function handleOne(message: WaMessage) {
  const sender = message.from;
  let audio: { data: string; mimeType: string } | undefined;

  if (message.type === "audio" || message.type === "voice") {
    const mediaId = message.audio?.id ?? message.voice?.id;
    if (mediaId) audio = (await downloadMedia(mediaId)) ?? undefined;
  }

  const { reply } = await handleInboundMessage({
    sender,
    text: message.text?.body ?? "",
    audio,
  });

  await sendText(sender, reply);
}
