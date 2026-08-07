import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { handleInboundMessage } from "@/lib/agents/core";
import { isProductionRuntime } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * WAHA transport (WhatsApp HTTP API — devlikeapro/waha).
 *
 * A second transport alongside the Meta Cloud API webhook. Both are thin: all
 * behaviour lives in `handleInboundMessage`, so the two channels cannot drift
 * apart in what they allow or how they authorise.
 *
 * WAHA differs from the Cloud API in three ways that matter here:
 *   • payload is { event, session, payload:{ from, body, media } }, not
 *     entry[].changes[].value.messages[]
 *   • the sender arrives as a chat id ("9665…@c.us"), not a bare number
 *   • auth is an HMAC of the raw body in `x-webhook-hmac`, not
 *     `x-hub-signature-256`
 *
 * NOTE ON RISK, recorded deliberately: WAHA drives a WhatsApp Web session
 * rather than the official Business API. That is against WhatsApp's terms and
 * the number can be banned. The client chose this transport knowingly; the
 * Meta Cloud API route remains in place so switching later is a config change,
 * not a rewrite.
 */

/** "9665XXXXXXXX@c.us" -> "9665XXXXXXXX". Groups (@g.us) are ignored. */
function senderFromChatId(chatId: string): string | null {
  if (!chatId || chatId.includes("@g.us")) return null;
  const digits = chatId.split("@")[0].replace(/[^\d]/g, "");
  return digits.length >= 8 ? digits : null;
}

/**
 * Verify the webhook over the RAW body.
 *
 * WAHA signs the exact bytes it sent; re-serialising the parsed JSON changes
 * key order and whitespace, and the digest will never match.
 */
function authorise(raw: string, req: Request) {
  const hmacKey = process.env.WAHA_WEBHOOK_HMAC;
  if (hmacKey) {
    const provided = req.headers.get("x-webhook-hmac") ?? "";
    const algorithm = (
      req.headers.get("x-webhook-hmac-algorithm") ?? "sha512"
    ).toLowerCase();
    if (!provided) return { ok: false, reason: "missing-hmac" };
    let expected: string;
    try {
      expected = crypto.createHmac(algorithm, hmacKey).update(raw, "utf8").digest("hex");
    } catch {
      return { ok: false, reason: "bad-hmac-algorithm" };
    }
    if (provided.length !== expected.length) return { ok: false, reason: "bad-hmac" };
    const equal = crypto.timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(expected, "utf8"),
    );
    return equal ? { ok: true } : { ok: false, reason: "bad-hmac" };
  }

  // Fallback: a shared token header, for WAHA deployments without HMAC.
  const token = process.env.WAHA_WEBHOOK_TOKEN;
  if (token) {
    const provided = req.headers.get("x-api-key") ?? "";
    if (provided.length !== token.length) return { ok: false, reason: "bad-token" };
    const equal = crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(token));
    return equal ? { ok: true } : { ok: false, reason: "bad-token" };
  }

  // Nothing configured: local development only, never open in production.
  return isProductionRuntime()
    ? { ok: false, reason: "no-webhook-secret-configured" }
    : { ok: true };
}

async function downloadMedia(url: string) {
  try {
    const res = await fetch(url, {
      headers: process.env.WAHA_API_KEY
        ? { "x-api-key": process.env.WAHA_API_KEY }
        : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      data: buf.toString("base64"),
      mimeType: res.headers.get("content-type") ?? "audio/ogg",
    };
  } catch {
    return null;
  }
}

async function sendText(chatId: string, text: string) {
  const base = process.env.WAHA_URL;
  const session = process.env.WAHA_SESSION ?? "default";
  if (!base) {
    console.log(JSON.stringify({ channel: "waha", chatId, text, sent: false }));
    return false;
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/sendText`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.WAHA_API_KEY ? { "x-api-key": process.env.WAHA_API_KEY } : {}),
      },
      // WhatsApp rejects bodies over 4096 characters.
      body: JSON.stringify({ session, chatId, text: text.slice(0, 4000) }),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type WahaPayload = {
  event?: string;
  payload?: {
    from?: string;
    body?: string;
    fromMe?: boolean;
    hasMedia?: boolean;
    media?: { url?: string; mimetype?: string };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const auth = authorise(raw, req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  }

  let body: WahaPayload;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // Always 200 quickly: WAHA retries on non-2xx, which would re-execute the
  // same client instruction.
  try {
    if (body.event === "message" && body.payload && !body.payload.fromMe) {
      const sender = senderFromChatId(body.payload.from ?? "");
      if (sender) {
        let audio: { data: string; mimeType: string } | undefined;
        if (body.payload.hasMedia && body.payload.media?.url) {
          const mime = body.payload.media.mimetype ?? "";
          // Only voice notes are executable input; ignore images/documents.
          if (mime.startsWith("audio")) {
            audio = (await downloadMedia(body.payload.media.url)) ?? undefined;
          }
        }

        const { reply } = await handleInboundMessage({
          sender,
          text: body.payload.body ?? "",
          audio,
        });
        await sendText(body.payload.from!, reply);
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        channel: "waha",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  return NextResponse.json({ ok: true });
}

/** Convenience probe so the URL can be checked from a browser. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    transport: "waha",
    configured: {
      url: Boolean(process.env.WAHA_URL),
      apiKey: Boolean(process.env.WAHA_API_KEY),
      webhookSecret: Boolean(
        process.env.WAHA_WEBHOOK_HMAC ?? process.env.WAHA_WEBHOOK_TOKEN,
      ),
      session: process.env.WAHA_SESSION ?? "default",
    },
  });
}
