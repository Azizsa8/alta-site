import { NextResponse } from "next/server";
import { getSites } from "@/lib/agents/registry";
import { backendName } from "@/lib/store";
import { hasAiKey } from "@/lib/ai";
import { readSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Deployment readiness for the 24/7 agent system.
 *
 * Every check reports what is configured WITHOUT revealing any secret value,
 * so this can be called during a demo. `blocking` lists exactly what a human
 * still has to do — the honest answer to "is it live yet?".
 */
export async function GET() {
  const sites = getSites();
  const settings = await readSettings();

  const checks = {
    storage: { ok: true, backend: backendName() },
    ai: { ok: hasAiKey(), detail: hasAiKey() ? "GEMINI_API_KEY set" : "GEMINI_API_KEY missing" },
    whatsappInbound: {
      ok: Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_APP_SECRET),
      detail: "WHATSAPP_VERIFY_TOKEN + WHATSAPP_APP_SECRET",
    },
    whatsappOutbound: {
      ok: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      detail: "WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID",
    },
    cron: {
      ok: Boolean(process.env.CRON_SECRET),
      detail: "CRON_SECRET (daily 08:00 Riyadh analysis)",
    },
    admin: { ok: Boolean(process.env.ADMIN_TOKEN), detail: "ADMIN_TOKEN" },
  };

  const blocking: string[] = [];
  if (!checks.whatsappInbound.ok || !checks.whatsappOutbound.ok) {
    blocking.push(
      "WhatsApp Business number not provisioned. Meta sends a verification code to a physical device — this step requires a human and cannot be automated.",
    );
  }
  const withoutSenders = sites.filter((s) => s.allowedSenders.length === 0);
  if (withoutSenders.length) {
    blocking.push(
      `No allow-listed sender for: ${withoutSenders
        .map((s) => s.id)
        .join(", ")}. Set AGENT_ALLOWED_SENDERS_<ID>. Until then those agents fail closed and accept nothing.`,
    );
  }
  if (!checks.ai.ok) {
    blocking.push("GEMINI_API_KEY missing — voice notes and AI suggestions degrade to text-only.");
  }

  return NextResponse.json({
    ok: blocking.length === 0,
    checks,
    blocking,
    settingsRevision: settings.revision,
    sites: sites.map((s) => ({
      id: s.id,
      name: s.name,
      keyword: s.keyword,
      aliases: s.aliases,
      host: s.host,
      capabilities: s.capabilities,
      // Count only — never echo the numbers themselves.
      allowedSenderCount: s.allowedSenders.length,
    })),
  });
}
