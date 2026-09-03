/**
 * Outbound notification for form submissions.
 *
 * Until this existed, every quote request landed in the store and notified
 * nobody — the client only saw it by logging into /admin. Requests now go to
 * the company inbox and the official WhatsApp number as soon as they arrive.
 *
 * Two rules govern everything here:
 *
 *  1. A notification failure must never fail the submission. The lead is
 *     already saved by the time we are called; losing it because an SMTP
 *     host was briefly down would be far worse than a missed alert. Every
 *     path swallows its errors and reports a boolean.
 *  2. Missing credentials are a no-op, not a crash. The site runs in
 *     environments (previews, local) with no mail or WhatsApp configured,
 *     and must keep accepting submissions there.
 *
 * Configure via env — nothing here is hardcoded except the destinations,
 * which the client fixed: alta@alta.sa and the official WhatsApp number.
 *
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   (SMTP, any mailbox)
 *   SMTP_FROM                                        defaults to SMTP_USER
 *   RESEND_API_KEY / RESEND_FROM                     (alternative to SMTP)
 *   WAHA_URL / WAHA_API_KEY / WAHA_SESSION           (WhatsApp via WAHA)
 *   WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID        (WhatsApp via Meta)
 *   QUOTE_NOTIFY_EMAIL / QUOTE_NOTIFY_WHATSAPP       override destinations
 */

import { company } from "@/content/site";

/** Where quote requests go. Overridable by env for staging. */
export const NOTIFY_EMAIL = process.env.QUOTE_NOTIFY_EMAIL || "alta@alta.sa";
/** Official WhatsApp, E.164 without "+" — 0533697956. */
export const NOTIFY_WHATSAPP = process.env.QUOTE_NOTIFY_WHATSAPP || "966533697956";

export type NotifyResult = { email: boolean; whatsapp: boolean };

/* ------------------------------------------------------------------ MAIL */

async function sendViaResend(subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.RESEND_FROM || `ALTA Website <onboarding@resend.dev>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: [NOTIFY_EMAIL], subject, text, html }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendViaSmtp(subject: string, text: string, html: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;
  const port = Number(process.env.SMTP_PORT ?? 587);
  try {
    // Imported lazily so environments without mail configured never pay the
    // cost of loading it, and so a packaging problem cannot break the route.
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; 587 upgrades via STARTTLS.
      secure: port === 465,
      auth: { user, pass },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || `"${company.nameAr}" <${user}>`,
      to: NOTIFY_EMAIL,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("notify: smtp failed", err);
    return false;
  }
}

async function sendEmail(subject: string, text: string, html: string) {
  // SMTP first: the client already owns the alta@alta.sa mailbox, so it is
  // the path most likely to be configured. Resend is the fallback.
  if (await sendViaSmtp(subject, text, html)) return true;
  return sendViaResend(subject, text, html);
}

/* -------------------------------------------------------------- WHATSAPP */

async function sendViaWaha(to: string, text: string) {
  const base = process.env.WAHA_URL;
  if (!base) return false;
  const session = process.env.WAHA_SESSION ?? "default";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/sendText`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.WAHA_API_KEY ? { "x-api-key": process.env.WAHA_API_KEY } : {}),
      },
      // WhatsApp rejects bodies over 4096 characters.
      body: JSON.stringify({ session, chatId: `${to}@c.us`, text: text.slice(0, 4000) }),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendViaMeta(to: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text.slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendWhatsApp(text: string) {
  if (await sendViaWaha(NOTIFY_WHATSAPP, text)) return true;
  return sendViaMeta(NOTIFY_WHATSAPP, text);
}

/* ----------------------------------------------------------- FORMATTING */

export type QuoteNotice = {
  id: string;
  fullName: string;
  organisation: string;
  jobTitle?: string;
  phone: string;
  email: string;
  sectorLabel?: string;
  serviceLabel?: string;
  city?: string;
  scope: string;
  timeline?: string;
  budget?: string;
  preferredContact?: string;
  hasAttachment: boolean;
};

const CONTACT_LABEL: Record<string, string> = {
  phone: "مكالمة هاتفية",
  whatsapp: "واتساب",
  email: "البريد الإلكتروني",
};

function rows(q: QuoteNotice): [string, string][] {
  return [
    ["اسم مقدم الطلب", q.fullName],
    ["المنشأة", q.organisation],
    ["المسمى الوظيفي", q.jobTitle || "—"],
    ["الجوال", q.phone],
    ["البريد الإلكتروني", q.email],
    ["القطاع", q.sectorLabel || "—"],
    ["الخدمة المطلوبة", q.serviceLabel || "—"],
    ["المدينة", q.city || "—"],
    ["المدة المتوقعة", q.timeline || "—"],
    ["الميزانية التقديرية", q.budget || "—"],
    ["طريقة التواصل المفضلة", CONTACT_LABEL[q.preferredContact ?? ""] || "—"],
    ["مرفق", q.hasAttachment ? "نعم" : "لا"],
    ["رقم الطلب", q.id],
  ];
}

function asText(q: QuoteNotice) {
  const lines = rows(q).map(([k, v]) => `${k}: ${v}`);
  return [
    "طلب عرض سعر جديد من موقع alta.sa",
    "",
    ...lines,
    "",
    "وصف الاحتياج:",
    q.scope,
  ].join("\n");
}

function asHtml(q: QuoteNotice) {
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
    );
  const cells = rows(q)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 12px;background:#faf4e6;font-weight:700;color:#0b1c30;border:1px solid #e0d5bb;width:35%">${esc(
          k,
        )}</td><td style="padding:7px 12px;border:1px solid #e0d5bb;color:#1a2431">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#fff;font-family:Tahoma,Arial,sans-serif;color:#1a2431">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:#0b1c30;color:#fff;padding:16px 20px;border-radius:4px 4px 0 0">
      <div style="font-size:18px;font-weight:700">طلب عرض سعر جديد</div>
      <div style="font-size:12px;color:#b9c4d4;margin-top:3px">${esc(company.nameAr)} — alta.sa</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${cells}</table>
    <div style="margin-top:18px">
      <div style="font-weight:700;color:#b8863f;margin-bottom:6px">وصف الاحتياج</div>
      <div style="white-space:pre-wrap;line-height:1.9;border:1px solid #e0d5bb;border-radius:4px;padding:12px">${esc(
        q.scope,
      )}</div>
    </div>
  </div></body></html>`;
}

/* -------------------------------------------------------------- ENTRY */

/**
 * Fire the quote notifications. Never throws; returns which channels
 * succeeded so the caller can log it without branching on failure.
 */
export async function notifyQuote(q: QuoteNotice): Promise<NotifyResult> {
  const subject = `طلب عرض سعر — ${q.organisation || q.fullName}`;
  const text = asText(q);
  const [email, whatsapp] = await Promise.all([
    sendEmail(subject, text, asHtml(q)).catch(() => false),
    sendWhatsApp(text).catch(() => false),
  ]);
  if (!email && !whatsapp) {
    // Loud enough to find in logs, quiet enough not to break the request.
    console.warn(
      `notify: quote ${q.id} reached no channel — check SMTP_*/RESEND_* and WAHA_*/WHATSAPP_* env`,
    );
  }
  return { email, whatsapp };
}
