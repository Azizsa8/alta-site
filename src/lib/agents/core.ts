/**
 * Transport-agnostic agent brain.
 *
 * `handleInboundMessage` takes a sender and some text and returns a reply
 * string. It knows nothing about WhatsApp, which is precisely why the whole
 * system can be exercised through `/api/agent/message` before any WhatsApp
 * number exists.
 *
 * SAFETY PROPERTIES — do not remove:
 *   1. Every mutation is a PROPOSAL. Nothing touches the live site until the
 *      client texts back `approve <id>`.
 *   2. Authorisation is by allow-listed sender, never by keyword alone.
 */

import { resolveSite, isAuthorised, canDo, getSites, type AgentSite } from "./registry";
import {
  createProposal,
  readProposal,
  saveProposal,
  listProposals,
  logAction,
  type Proposal,
} from "./proposals";
import {
  writeSettings,
  readSettings,
  restoreRevision,
  isValidColour,
  type ThemeOverrides,
  type ContentOverrides,
} from "@/lib/settings";
import { runDailyAnalysis, readReport, riyadhDay, previousDay } from "@/lib/analytics";
import { generateJson, hasAiKey } from "@/lib/ai";
import { revalidatePath } from "next/cache";

/**
 * Push the change to the live pages immediately.
 *
 * Without this, a theme or copy change would sit in the store until the next
 * ISR window expired — the client would text "موافقة", get "✅ تم التطبيق",
 * look at the site and see nothing. On-demand revalidation is what lets the
 * pages stay statically cached AND update the instant a change is approved.
 *
 * Revalidating the "layout" scope is required, not just the page: the theme
 * variables are emitted from the root layout, so a page-only revalidation
 * would refresh the copy but leave the old colours in place.
 */
function refreshSite() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // Called outside a request scope (e.g. a script) — nothing to revalidate.
  }
}

export type InboundMessage = {
  sender: string;
  text: string;
  /** Base64 audio from a voice note, if the transport supplied one. */
  audio?: { data: string; mimeType: string };
};

/* -------------------------------------------------------- colour language */

/** Natural-language colours, so a client can say "اجعل اللون ذهبي". */
const COLOUR_WORDS: Record<string, string> = {
  ذهبي: "#d9a84e",
  ذهب: "#d9a84e",
  gold: "#d9a84e",
  أزرق: "#1f4e79",
  ازرق: "#1f4e79",
  blue: "#1f4e79",
  "كحلي": "#0d1b29",
  navy: "#0d1b29",
  أخضر: "#1f7a5c",
  اخضر: "#1f7a5c",
  green: "#1f7a5c",
  أحمر: "#a02c2c",
  احمر: "#a02c2c",
  red: "#a02c2c",
  أسود: "#0b1622",
  اسود: "#0b1622",
  black: "#0b1622",
  أبيض: "#ffffff",
  ابيض: "#ffffff",
  white: "#ffffff",
  رمادي: "#55606d",
  grey: "#55606d",
  gray: "#55606d",
  برتقالي: "#cf4500",
  orange: "#cf4500",
  بنفسجي: "#5b3a8e",
  purple: "#5b3a8e",
};

/** Which token in the message names which theme slot. */
const SLOT_WORDS: { words: string[]; slot: keyof ThemeOverrides }[] = [
  { words: ["رئيسي", "الرئيسي", "أساسي", "اساسي", "primary"], slot: "primary" },
  { words: ["ثانوي", "الثانوي", "secondary", "container"], slot: "primaryContainer" },
  { words: ["نص", "النص", "ink", "text"], slot: "goldInk" },
  { words: ["خلفية", "الخلفية", "background", "surface"], slot: "surface" },
  { words: ["لوحة", "بطاقة", "panel", "card"], slot: "surfacePanel" },
  { words: ["ورق", "فاتح", "paper", "light"], slot: "paper" },
];

function extractColour(text: string): string | null {
  const hex = text.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (hex) return hex[0].toLowerCase();
  for (const [word, value] of Object.entries(COLOUR_WORDS)) {
    if (new RegExp(`(^|\\s)${word}(\\s|$|\\.|،)`, "i").test(text)) return value;
  }
  return null;
}

function extractSlot(text: string): keyof ThemeOverrides {
  const lower = text.toLowerCase();
  for (const { words, slot } of SLOT_WORDS) {
    if (words.some((w) => lower.includes(w.toLowerCase()))) return slot;
  }
  // Unqualified "change the colour" means the brand colour.
  return "primary";
}

/* --------------------------------------------------------- command parser */

type Verb =
  | "help"
  | "theme"
  | "content"
  | "image"
  | "preview"
  | "report"
  | "status"
  | "approve"
  | "reject"
  | "restore"
  | "list"
  | "unknown";

const VERB_WORDS: { words: string[]; verb: Verb }[] = [
  { words: ["help", "مساعدة", "المساعدة", "اوامر", "أوامر", "?"], verb: "help" },
  { words: ["approve", "موافقة", "موافق", "اعتمد", "تأكيد", "تاكيد"], verb: "approve" },
  { words: ["reject", "رفض", "الغاء", "إلغاء", "تجاهل"], verb: "reject" },
  { words: ["restore", "استرجاع", "تراجع", "rollback"], verb: "restore" },
  { words: ["report", "تقرير", "التقرير", "احصائيات", "إحصائيات"], verb: "report" },
  { words: ["preview", "معاينة", "عرض", "اقتراح", "اقتراحات"], verb: "preview" },
  { words: ["status", "حالة", "الحالة"], verb: "status" },
  { words: ["list", "قائمة", "الطلبات"], verb: "list" },
  { words: ["color", "colour", "theme", "لون", "اللون", "الوان", "ألوان", "ثيم"], verb: "theme" },
  { words: ["image", "صورة", "الصورة", "صور"], verb: "image" },
  { words: ["text", "نص", "النص", "عنوان", "العنوان", "محتوى", "المحتوى"], verb: "content" },
];

export function parseVerb(body: string): Verb {
  const lower = body.toLowerCase();
  for (const { words, verb } of VERB_WORDS) {
    if (words.some((w) => new RegExp(`(^|\\s)${escapeRe(w)}(\\s|$|:|،|\\.)`, "i").test(lower))) {
      return verb;
    }
  }
  return "unknown";
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Pull `key: value` or text after a colon — how clients phrase copy changes. */
function afterColon(text: string): string | null {
  const idx = text.indexOf(":");
  const idxAr = text.indexOf("：");
  const at = idx >= 0 ? idx : idxAr;
  if (at < 0) return null;
  const value = text.slice(at + 1).trim();
  return value.length > 0 ? value.slice(0, 400) : null;
}

/* ---------------------------------------------------------- voice support */

/**
 * Transcribe a voice note.
 *
 * Gemini accepts inline audio, so a voice note becomes text and then flows
 * through exactly the same command path as a typed message — there is no
 * separate "voice pipeline" to keep in sync.
 */
export async function transcribe(audio: {
  data: string;
  mimeType: string;
}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "فرّغ هذه الرسالة الصوتية نصياً بالعربية حرفياً، دون أي شرح أو مقدمة.",
                },
                { inlineData: { mimeType: audio.mimeType, data: audio.data } },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 300 },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim() ?? "";
    return text || null;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- replies */

function helpText(site: AgentSite) {
  return [
    `👋 وكيل ${site.name} جاهز.`,
    "",
    "الأوامر المتاحة:",
    `• ${site.keyword} لون رئيسي #d9a84e — تغيير لون`,
    `• ${site.keyword} نص العنوان: ...  — تعديل محتوى`,
    `• ${site.keyword} معاينة — اقتراح تحسينات للصفحة الرئيسية`,
    `• ${site.keyword} تقرير — تقرير سلوك الزوار`,
    `• ${site.keyword} حالة — الإعدادات الحالية`,
    `• ${site.keyword} قائمة — الطلبات المعلّقة`,
    "• موافقة <الرمز> — اعتماد التغيير",
    "• رفض <الرمز> — إلغاء التغيير",
    "• استرجاع <رقم> — العودة لإصدار سابق",
    "",
    "⚠️ لا يُطبَّق أي تغيير قبل إرسال «موافقة <الرمز>».",
  ].join("\n");
}

function proposalText(p: Proposal, site: AgentSite) {
  return [
    `📝 تم تجهيز التغيير على ${site.name}:`,
    p.summary,
    "",
    `الرمز: ${p.id}`,
    `للاعتماد أرسل: موافقة ${p.id}`,
    `للإلغاء أرسل: رفض ${p.id}`,
    "",
    "الطلب صالح لمدة 24 ساعة.",
  ].join("\n");
}

/* ---------------------------------------------------------------- actions */

async function buildThemeProposal(
  site: AgentSite,
  sender: string,
  body: string,
): Promise<string> {
  if (!canDo(site, "theme")) return "هذه الصلاحية غير مفعّلة لهذا الموقع.";

  const colour = extractColour(body);
  if (!colour || !isValidColour(colour)) {
    return "لم أتعرف على اللون. أرسل رمزاً مثل #d9a84e أو اسماً مثل: ذهبي، كحلي، أزرق، أخضر.";
  }
  const slot = extractSlot(body);
  const labels: Record<keyof ThemeOverrides, string> = {
    primary: "اللون الرئيسي",
    primaryContainer: "اللون الثانوي",
    goldInk: "لون النصوص المميزة",
    surface: "لون الخلفية الداكنة",
    surfacePanel: "لون البطاقات",
    paper: "لون الخلفية الفاتحة",
  };

  const proposal = await createProposal({
    siteId: site.id,
    requestedBy: sender,
    instruction: body,
    summary: `تغيير ${labels[slot]} إلى ${colour}`,
    patch: { theme: { [slot]: colour } as ThemeOverrides },
  });
  await logAction({
    siteId: site.id,
    actor: sender,
    action: "propose:theme",
    detail: `${slot}=${colour}`,
  });
  return proposalText(proposal, site);
}

async function buildContentProposal(
  site: AgentSite,
  sender: string,
  body: string,
): Promise<string> {
  if (!canDo(site, "content")) return "هذه الصلاحية غير مفعّلة لهذا الموقع.";

  const value = afterColon(body);
  if (!value) {
    return "أرسل النص بعد نقطتين، مثال:\nنص العنوان: حلول متكاملة تقود أعمالك";
  }

  const lower = body.toLowerCase();
  let field: keyof ContentOverrides = "heroTitle";
  let label = "عنوان الصفحة الرئيسية";
  if (/وصف|فقرة|body|paragraph/.test(lower)) {
    field = "heroBody";
    label = "الفقرة التعريفية";
  } else if (/شريط|إعلان|اعلان|announcement/.test(lower)) {
    field = "announcement";
    label = "الشريط الإعلاني";
  } else if (/فرعي|accent|ثانوي/.test(lower)) {
    field = "heroTitleAccent";
    label = "العنوان الفرعي";
  }

  const proposal = await createProposal({
    siteId: site.id,
    requestedBy: sender,
    instruction: body,
    summary: `تعديل ${label} إلى:\n«${value}»`,
    patch: { content: { [field]: value } as ContentOverrides },
  });
  await logAction({
    siteId: site.id,
    actor: sender,
    action: "propose:content",
    detail: field,
  });
  return proposalText(proposal, site);
}

async function buildImageProposal(
  site: AgentSite,
  sender: string,
  body: string,
): Promise<string> {
  if (!canDo(site, "images")) return "هذه الصلاحية غير مفعّلة لهذا الموقع.";

  const url = body.match(/https?:\/\/\S+\.(?:png|jpe?g|webp|avif)/i)?.[0];
  if (!url) {
    return "أرسل رابط الصورة مباشرة (png أو jpg أو webp)، مثال:\nصورة الرئيسية: https://…/hero.jpg";
  }
  const slot = /عن|about/i.test(body) ? "about" : "hero";
  const proposal = await createProposal({
    siteId: site.id,
    requestedBy: sender,
    instruction: body,
    summary: `تغيير صورة ${slot === "hero" ? "الواجهة الرئيسية" : "قسم عن الشركة"}`,
    patch: { images: { [slot]: url } },
  });
  await logAction({ siteId: site.id, actor: sender, action: "propose:image", detail: slot });
  return proposalText(proposal, site);
}

async function suggestions(site: AgentSite, body: string): Promise<string> {
  if (!canDo(site, "preview")) return "هذه الصلاحية غير مفعّلة لهذا الموقع.";

  const settings = await readSettings();
  const current = JSON.stringify(settings.theme);

  if (hasAiKey()) {
    const res = await generateJson<{ ideas: { title: string; why: string }[] }>(
      `أنت مستشار تصميم لموقع ${site.name}. الإعدادات الحالية: ${current}.
طلب العميل: "${body}".
اقترح 3 تحسينات محددة وقابلة للتنفيذ على الصفحة الرئيسية (ألوان، ترتيب أقسام، رسائل).
أعد JSON فقط: {"ideas":[{"title":"...","why":"..."}]}`,
      { maxOutputTokens: 500 },
    );
    if (res.ok && res.data?.ideas?.length) {
      return [
        `💡 اقتراحات للصفحة الرئيسية — ${site.name}:`,
        "",
        ...res.data.ideas.map((i, n) => `${n + 1}. ${i.title}\n   ${i.why}`),
        "",
        `للمعاينة المباشرة: ${site.siteUrl}`,
        "أرسل التغيير المطلوب وسأجهّزه لاعتمادك.",
      ].join("\n");
    }
  }

  return [
    `💡 اقتراحات للصفحة الرئيسية — ${site.name}:`,
    "",
    "1. تثبيت لون رئيسي واحد لكل أزرار الدعوة لاتخاذ إجراء لرفع وضوح المسار.",
    "2. رفع قسم الخدمات أعلى الصفحة ليظهر دون تمرير طويل.",
    "3. إضافة شريط إعلاني للعرض أو الخبر الأحدث أعلى الصفحة.",
    "",
    `للمعاينة: ${site.siteUrl}`,
    "أرسل التغيير المطلوب وسأجهّزه لاعتمادك.",
  ].join("\n");
}

async function reportFor(site: AgentSite): Promise<string> {
  if (!canDo(site, "reports")) return "هذه الصلاحية غير مفعّلة لهذا الموقع.";

  const day = previousDay(riyadhDay());
  // Use last night's report if the 08:00 job already produced one; otherwise
  // generate on demand so the client never gets "لا يوجد تقرير".
  const report = (await readReport(day)) ?? (await runDailyAnalysis(day));

  const lines = [
    `📊 تقرير ${site.name} — ${report.day}`,
    "",
    report.summary,
    "",
    `• النماذج: ${report.totals.formSubmissions} (عروض أسعار: ${report.totals.quoteRequests})`,
    `• رسائل المساعد: ${report.totals.chatMessages} عبر ${report.totals.chatSessions} جلسة`,
    `• التقييمات الصريحة: ${report.totals.explicitRatings}`,
  ];
  if (report.satisfaction.index !== null) {
    lines.push(`• مؤشر الرضا: ${report.satisfaction.index}`);
  }
  if (report.interests.length) {
    lines.push(
      `• أعلى الاهتمامات: ${report.interests
        .slice(0, 3)
        .map((i) => i.label)
        .join("، ")}`,
    );
  }
  if (report.recommendations.length) {
    lines.push("", "التوصيات:", ...report.recommendations.map((r) => `– ${r}`));
  }
  if (report.degraded) {
    lines.push("", `⚠️ التقرير مبني على التحليل الرقمي فقط (${report.degradedReason}).`);
  }
  return lines.join("\n");
}

async function statusFor(site: AgentSite): Promise<string> {
  const s = await readSettings();
  const pending = (await listProposals(site.id)).filter((p) => p.status === "pending");
  const theme = Object.entries(s.theme);
  return [
    `⚙️ حالة ${site.name}`,
    `الإصدار: r${s.revision} — آخر تحديث ${s.updatedAt.slice(0, 16).replace("T", " ")}`,
    theme.length
      ? `الألوان المخصصة: ${theme.map(([k, v]) => `${k}=${v}`).join("، ")}`
      : "الألوان: الافتراضية المعتمدة",
    Object.keys(s.content).length
      ? `نصوص مخصصة: ${Object.keys(s.content).join("، ")}`
      : "النصوص: المعتمدة",
    `طلبات معلّقة: ${pending.length}${pending.length ? ` (${pending.map((p) => p.id).join("، ")})` : ""}`,
    `الرابط: ${site.siteUrl}`,
  ].join("\n");
}

async function applyProposal(p: Proposal, sender: string): Promise<string> {
  const settings = await writeSettings(p.patch, `whatsapp:${sender}`);
  refreshSite();
  const updated: Proposal = {
    ...p,
    status: "approved",
    appliedAt: new Date().toISOString(),
    appliedRevision: settings.revision,
  };
  await saveProposal(updated);
  await logAction({
    siteId: p.siteId,
    actor: sender,
    action: "apply",
    detail: `${p.id} -> r${settings.revision}`,
  });
  const site = getSites().find((s) => s.id === p.siteId);
  return [
    `✅ تم تطبيق التغيير (${p.id}).`,
    p.summary,
    `الإصدار الجديد: r${settings.revision}`,
    site ? `تحقق من: ${site.siteUrl}` : "",
    `للتراجع أرسل: استرجاع ${settings.revision - 1}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ------------------------------------------------------------ entry point */

export async function handleInboundMessage(
  msg: InboundMessage,
): Promise<{ reply: string; siteId?: string; authorised: boolean }> {
  let text = (msg.text ?? "").trim();

  // A voice note becomes text, then follows the identical command path.
  if (!text && msg.audio) {
    const spoken = await transcribe(msg.audio);
    if (!spoken) {
      return {
        reply:
          "تعذر تفريغ الرسالة الصوتية. يرجى إرسال الطلب نصياً، مثال:\nalta لون رئيسي #d9a84e",
        authorised: false,
      };
    }
    text = spoken.trim();
  }

  if (!text) {
    return { reply: "أرسل الكلمة المفتاحية للمشروع متبوعة بطلبك.", authorised: false };
  }

  // Approval verbs are site-less: the proposal id carries the site.
  const bare = parseVerb(text);
  const idMatch = text.match(/\b([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5})\b/);

  const currentSettings = await readSettings();
  const dynamicSenders = (currentSettings.content?.allowedSenders ?? "")
    .split(",")
    .map((s) => s.replace(/[^\d]/g, ""))
    .filter((s) => s.length >= 8);

  if ((bare === "approve" || bare === "reject") && idMatch) {
    const proposal = await readProposal(idMatch[1]);
    if (!proposal) return { reply: "لم أجد طلباً بهذا الرمز.", authorised: false };

    const site = getSites().find((s) => s.id === proposal.siteId);
    if (!site || !isAuthorised(site, msg.sender, dynamicSenders)) {
      return { reply: "غير مصرح لهذا الرقم باعتماد التغييرات.", authorised: false };
    }
    if (proposal.status === "expired") {
      return { reply: "انتهت صلاحية هذا الطلب. أرسل الطلب مرة أخرى.", siteId: site.id, authorised: true };
    }
    if (proposal.status !== "pending") {
      return {
        reply: `هذا الطلب سبق أن تمت معالجته (${proposal.status}).`,
        siteId: site.id,
        authorised: true,
      };
    }

    if (bare === "reject") {
      await saveProposal({ ...proposal, status: "rejected" });
      await logAction({ siteId: site.id, actor: msg.sender, action: "reject", detail: proposal.id });
      return { reply: `تم إلغاء الطلب ${proposal.id}.`, siteId: site.id, authorised: true };
    }
    return { reply: await applyProposal(proposal, msg.sender), siteId: site.id, authorised: true };
  }

  const site = resolveSite(text);
  if (!site) {
    const keywords = getSites().map((s) => s.keyword).join(" / ");
    return {
      reply: `لم أتعرف على المشروع. ابدأ رسالتك بالكلمة المفتاحية: ${keywords}`,
      authorised: false,
    };
  }

  if (!isAuthorised(site, msg.sender, dynamicSenders)) {
    // Log the attempt: an unknown number using a real keyword is worth seeing.
    await logAction({
      siteId: site.id,
      actor: msg.sender,
      action: "denied",
      detail: text.slice(0, 80),
    });
    return {
      reply:
        "هذا الرقم غير مصرح له بإدارة هذا الموقع. يرجى التواصل مع مسؤول الحساب لإضافته.",
      siteId: site.id,
      authorised: false,
    };
  }

  // Strip the keyword; the rest is the instruction.
  const body = text.slice(text.split(/\s+/)[0].length).trim();
  const verb = body ? parseVerb(body) : "help";

  switch (verb) {
    case "help":
      return { reply: helpText(site), siteId: site.id, authorised: true };
    case "theme":
      return { reply: await buildThemeProposal(site, msg.sender, body), siteId: site.id, authorised: true };
    case "content":
      return { reply: await buildContentProposal(site, msg.sender, body), siteId: site.id, authorised: true };
    case "image":
      return { reply: await buildImageProposal(site, msg.sender, body), siteId: site.id, authorised: true };
    case "preview":
      return { reply: await suggestions(site, body), siteId: site.id, authorised: true };
    case "report":
      return { reply: await reportFor(site), siteId: site.id, authorised: true };
    case "status":
      return { reply: await statusFor(site), siteId: site.id, authorised: true };
    case "list": {
      const pending = (await listProposals(site.id)).filter((p) => p.status === "pending");
      return {
        reply: pending.length
          ? ["الطلبات المعلّقة:", ...pending.map((p) => `• ${p.id} — ${p.summary}`)].join("\n")
          : "لا توجد طلبات معلّقة.",
        siteId: site.id,
        authorised: true,
      };
    }
    case "restore": {
      const rev = Number(body.match(/\d+/)?.[0]);
      if (!Number.isFinite(rev)) {
        return { reply: "أرسل رقم الإصدار، مثال: استرجاع 3", siteId: site.id, authorised: true };
      }
      const restored = await restoreRevision(rev, `whatsapp:${msg.sender}`);
      if (restored) refreshSite();
      await logAction({ siteId: site.id, actor: msg.sender, action: "restore", detail: `r${rev}` });
      return {
        reply: restored
          ? `↩️ تم الرجوع إلى الإصدار r${rev}. الإصدار الحالي r${restored.revision}.`
          : `لم أجد الإصدار r${rev}.`,
        siteId: site.id,
        authorised: true,
      };
    }
    default:
      // An unrecognised instruction from an authorised sender is far more
      // likely a phrasing miss than an attack — answer with the menu.
      return { reply: helpText(site), siteId: site.id, authorised: true };
  }
}
