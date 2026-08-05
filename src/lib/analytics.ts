/**
 * Behaviour analytics: capture + daily analysis.
 *
 * The analysis has two layers on purpose:
 *
 *   1. A DETERMINISTIC layer (counts, interest scoring, satisfaction,
 *      funnel) computed in plain TypeScript. It always runs.
 *   2. An AI layer that writes the narrative summary and recommendations.
 *
 * If the AI key is missing or the quota is exhausted, the report is still
 * produced — it is marked `degraded` with a machine-readable reason and keeps
 * every number. A report that silently vanishes on a quota error is worse than
 * one that says why it is thin.
 */

import { get, getMany, listKeys, put, backendName } from "./store";
import { generateJson, hasAiKey } from "./ai";
import { services } from "@/content/services";

export const STORE = "alta-analytics";

/* ------------------------------------------------------------------ types */

export type EventType = "form_submit" | "chat_turn" | "feedback" | "page_view";

export type AnalyticsEvent = {
  id: string;
  type: EventType;
  at: string;
  /** Riyadh calendar day the event belongs to (YYYY-MM-DD). */
  day: string;
  path?: string;
  sessionId?: string;
  /** "contact" | "quote" | "chat" */
  source?: string;
  /** Service slug the visitor expressed interest in, when known. */
  service?: string;
  /** Free text the visitor wrote. Never contains contact details. */
  text?: string;
  /** Explicit satisfaction: 1 or -1. */
  score?: number;
  /** Seconds the visitor spent filling the form. */
  elapsedMs?: number;
  meta?: Record<string, string | number | boolean>;
};

export type DailyReport = {
  day: string;
  generatedAt: string;
  degraded: boolean;
  degradedReason?: string;
  model?: string;
  backend: string;
  totals: {
    events: number;
    formSubmissions: number;
    quoteRequests: number;
    contactMessages: number;
    chatMessages: number;
    chatSessions: number;
    explicitRatings: number;
  };
  interests: { key: string; label: string; score: number }[];
  satisfaction: {
    explicitPositive: number;
    explicitNegative: number;
    /** -1..1, blending explicit ratings with inferred chat sentiment. */
    index: number | null;
    inferredPositive: number;
    inferredNegative: number;
    inferredNeutral: number;
  };
  funnel: {
    chatSessions: number;
    sessionsReachingForm: number;
    conversionRate: number | null;
  };
  formQuality: {
    medianCompletionSeconds: number | null;
    abandonedValidationCount: number;
  };
  topPaths: { path: string; count: number }[];
  topQuestions: string[];
  summary: string;
  highlights: string[];
  recommendations: string[];
};

/* ------------------------------------------------------- Riyadh calendar */

/**
 * Saudi Arabia is UTC+3 year round (AST, no daylight saving). Everything is
 * bucketed by the Riyadh day so "yesterday" in a report means what the client
 * means by it.
 */
export const RIYADH_OFFSET_MINUTES = 3 * 60;

export function riyadhDay(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + RIYADH_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 10);
}

export function previousDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------- capture */

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Persist one event. Never throws: analytics must not be able to fail a
 * visitor-facing request.
 */
export async function recordEvent(
  event: Omit<AnalyticsEvent, "id" | "at" | "day">,
): Promise<string | null> {
  try {
    const at = new Date();
    const full: AnalyticsEvent = {
      ...event,
      id: newId(),
      at: at.toISOString(),
      day: riyadhDay(at),
      // Trim free text: enough to analyse intent, short enough to stay cheap.
      text: event.text ? event.text.slice(0, 1200) : undefined,
    };
    await put(STORE, `events/${full.day}/${full.id}`, full);
    return full.id;
  } catch {
    return null;
  }
}

export async function readEvents(day: string): Promise<AnalyticsEvent[]> {
  const keys = await listKeys(STORE, `events/${day}/`);
  const events = await getMany<AnalyticsEvent>(STORE, keys);
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

/* ------------------------------------------------- deterministic analysis */

/** Arabic + English cues mapped onto the eight approved service areas. */
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "ai-engineering": [
    "ذكاء", "اصطناعي", "وكيل", "وكلاء", "أتمتة", "اتمتة", "بيانات", "تحليل",
    "روبوت", "شات", "محادثة", "تقنية", "رقمي", "ai", "automation", "agent",
  ],
  "facilities-management": [
    "تشغيل", "صيانة", "نظافة", "مرافق", "أعطال", "اعطال", "تكييف", "كهرباء",
    "سباكة", "بلاغ", "أصول", "maintenance", "facility", "cleaning",
  ],
  "hospitality-catering": [
    "ضيافة", "إعاشة", "اعاشة", "وجبات", "مطبخ", "تموين", "أغذية", "اغذية",
    "بوفيه", "قهوة", "catering", "hospitality", "meal",
  ],
  "management-consulting": [
    "استشارة", "استشارات", "هيكل", "سياسات", "إجراءات", "اجراءات", "تأهيل",
    "حوكمة", "استراتيج", "أداء", "مؤشرات", "consulting", "strategy",
  ],
  "procurement-supplies": [
    "توريد", "مشتريات", "مورد", "أصناف", "اصناف", "مستلزمات", "معدات",
    "قرطاسية", "procurement", "supply", "vendor",
  ],
  "media-social": [
    "إعلام", "اعلام", "دعاية", "تسويق", "هوية", "محتوى", "حملة", "سوشيال",
    "تواصل الاجتماعي", "تصميم", "marketing", "branding", "social",
  ],
  "events-exhibitions": [
    "فعالية", "فعاليات", "معرض", "معارض", "مؤتمر", "مؤتمرات", "جناح",
    "تنظيم", "حفل", "event", "exhibition", "conference",
  ],
  "research-surveys": [
    "بحث", "بحوث", "استطلاع", "استبيان", "دراسة", "رضا", "عينة", "سوق",
    "research", "survey", "study",
  ],
};

const POSITIVE = [
  "شكرا", "شكراً", "ممتاز", "رائع", "مفيد", "جيد", "جميل", "أحسنت", "احسنت",
  "واضح", "سريع", "مناسب", "موفق", "تمام", "نعم", "great", "thanks", "good",
];
const NEGATIVE = [
  "سيء", "سيئ", "بطيء", "مشكلة", "لا يعمل", "غير واضح", "متأخر", "متاخر",
  "شكوى", "معقد", "صعب", "خطأ", "خطا", "لم أفهم", "لم افهم", "bad", "slow",
  "problem", "issue",
];

function countHits(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.reduce((n, w) => (lower.includes(w.toLowerCase()) ? n + 1 : n), 0);
}

export function scoreInterests(events: AnalyticsEvent[]) {
  const scores = new Map<string, number>();
  const bump = (slug: string, by: number) =>
    scores.set(slug, (scores.get(slug) ?? 0) + by);

  for (const e of events) {
    // An explicitly chosen service is a much stronger signal than a keyword.
    if (e.service && INTEREST_KEYWORDS[e.service]) bump(e.service, 5);
    if (!e.text) continue;
    for (const [slug, words] of Object.entries(INTEREST_KEYWORDS)) {
      const hits = countHits(e.text, words);
      if (hits > 0) bump(slug, Math.min(hits, 3));
    }
  }

  return [...scores.entries()]
    .map(([key, score]) => ({
      key,
      label: services.find((s) => s.slug === key)?.title ?? key,
      score,
    }))
    .sort((a, b) => b.score - a.score);
}

export function scoreSatisfaction(events: AnalyticsEvent[]) {
  let explicitPositive = 0;
  let explicitNegative = 0;
  let inferredPositive = 0;
  let inferredNegative = 0;
  let inferredNeutral = 0;

  for (const e of events) {
    if (e.type === "feedback") {
      if ((e.score ?? 0) > 0) explicitPositive++;
      else if ((e.score ?? 0) < 0) explicitNegative++;
      continue;
    }
    if (e.type !== "chat_turn" || !e.text || e.source !== "visitor") continue;
    const pos = countHits(e.text, POSITIVE);
    const neg = countHits(e.text, NEGATIVE);
    if (pos > neg) inferredPositive++;
    else if (neg > pos) inferredNegative++;
    else inferredNeutral++;
  }

  // Explicit ratings are worth 3x an inferred signal — someone who clicked
  // "نعم/لا" told us directly; a keyword match is a guess.
  const weighted =
    explicitPositive * 3 - explicitNegative * 3 + inferredPositive - inferredNegative;
  const volume =
    (explicitPositive + explicitNegative) * 3 + inferredPositive + inferredNegative;

  return {
    explicitPositive,
    explicitNegative,
    inferredPositive,
    inferredNegative,
    inferredNeutral,
    index: volume === 0 ? null : Number((weighted / volume).toFixed(3)),
  };
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function computeMetrics(day: string, events: AnalyticsEvent[]) {
  const forms = events.filter((e) => e.type === "form_submit");
  const quotes = forms.filter((e) => e.source === "quote");
  const contacts = forms.filter((e) => e.source === "contact");
  const chats = events.filter((e) => e.type === "chat_turn");
  const ratings = events.filter((e) => e.type === "feedback");

  const chatSessions = new Set(
    chats.map((e) => e.sessionId).filter(Boolean) as string[],
  );
  const formSessions = new Set(
    forms.map((e) => e.sessionId).filter(Boolean) as string[],
  );
  const reachingForm = [...chatSessions].filter((s) => formSessions.has(s)).length;

  const pathCounts = new Map<string, number>();
  for (const e of events) {
    if (!e.path) continue;
    pathCounts.set(e.path, (pathCounts.get(e.path) ?? 0) + 1);
  }

  const completionSeconds = forms
    .map((e) => e.elapsedMs)
    .filter((v): v is number => typeof v === "number" && v > 0)
    .map((ms) => Math.round(ms / 1000));

  return {
    day,
    totals: {
      events: events.length,
      formSubmissions: forms.length,
      quoteRequests: quotes.length,
      contactMessages: contacts.length,
      chatMessages: chats.length,
      chatSessions: chatSessions.size,
      explicitRatings: ratings.length,
    },
    interests: scoreInterests(events),
    satisfaction: scoreSatisfaction(events),
    funnel: {
      chatSessions: chatSessions.size,
      sessionsReachingForm: reachingForm,
      conversionRate:
        chatSessions.size === 0
          ? null
          : Number((reachingForm / chatSessions.size).toFixed(3)),
    },
    formQuality: {
      medianCompletionSeconds: median(completionSeconds),
      abandonedValidationCount: events.filter(
        (e) => e.meta?.validationFailed === true,
      ).length,
    },
    topPaths: [...pathCounts.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topQuestions: chats
      .filter((e) => e.source === "visitor" && e.text)
      .slice(0, 25)
      .map((e) => e.text as string),
  };
}

/* ----------------------------------------------------------- AI narrative */

type Narrative = {
  summary: string;
  highlights: string[];
  recommendations: string[];
};

async function narrate(
  metrics: ReturnType<typeof computeMetrics>,
): Promise<{ narrative: Narrative | null; model?: string; reason?: string }> {
  if (!hasAiKey()) return { narrative: null, reason: "no-key" };

  const prompt = `أنت محلل سلوك مستخدمين في شركة التا للاستثمار (شركة سعودية للحلول المتكاملة).
حلّل بيانات يوم ${metrics.day} التالية واكتب تقريراً تنفيذياً موجزاً بالعربية.

الأرقام:
${JSON.stringify(metrics.totals)}

اهتمامات الزوار (مرتبة):
${JSON.stringify(metrics.interests.slice(0, 5))}

مؤشرات الرضا:
${JSON.stringify(metrics.satisfaction)}

مسار التحويل من المحادثة إلى النموذج:
${JSON.stringify(metrics.funnel)}

أكثر الصفحات تفاعلاً:
${JSON.stringify(metrics.topPaths)}

نماذج من أسئلة الزوار:
${JSON.stringify(metrics.topQuestions.slice(0, 15))}

أعد النتيجة بصيغة JSON فقط بهذا الشكل، دون أي نص إضافي:
{"summary":"فقرة واحدة لا تتجاوز 60 كلمة","highlights":["3 إلى 5 ملاحظات قصيرة"],"recommendations":["3 إلى 5 توصيات عملية قابلة للتنفيذ"]}

لا تخترع أرقاماً غير موجودة في البيانات. إذا كانت البيانات قليلة، قل ذلك صراحة.`;

  const res = await generateJson<Narrative>(prompt, { maxOutputTokens: 900 });
  if (!res.ok || !res.data) {
    return { narrative: null, model: res.model, reason: res.reason };
  }
  return { narrative: res.data, model: res.model };
}

/** Readable fallback so a report is never blank. */
function fallbackNarrative(m: ReturnType<typeof computeMetrics>): Narrative {
  const top = m.interests[0];
  const summary =
    m.totals.events === 0
      ? `لا توجد أحداث مسجلة ليوم ${m.day}.`
      : `سُجل ${m.totals.events} حدثاً: ${m.totals.formSubmissions} نموذجاً و${m.totals.chatMessages} رسالة محادثة عبر ${m.totals.chatSessions} جلسة.` +
        (top ? ` أعلى اهتمام: ${top.label}.` : "");

  const highlights: string[] = [];
  if (top) highlights.push(`أكثر مجال اهتمام: ${top.label} (${top.score} نقطة).`);
  if (m.totals.quoteRequests > 0)
    highlights.push(`${m.totals.quoteRequests} طلب عرض سعر.`);
  if (m.satisfaction.index !== null)
    highlights.push(`مؤشر الرضا: ${m.satisfaction.index}.`);
  if (m.funnel.conversionRate !== null)
    highlights.push(
      `نسبة تحول المحادثة إلى نموذج: ${(m.funnel.conversionRate * 100).toFixed(0)}%.`,
    );
  if (m.formQuality.medianCompletionSeconds !== null)
    highlights.push(
      `متوسط زمن تعبئة النموذج: ${m.formQuality.medianCompletionSeconds} ثانية.`,
    );

  return {
    summary,
    highlights: highlights.length ? highlights : ["لا توجد ملاحظات كافية لهذا اليوم."],
    recommendations: [
      "مراجعة الأسئلة المتكررة وإضافتها إلى صفحة الأسئلة الشائعة.",
      "متابعة طلبات عروض الأسعار خلال يوم عمل واحد.",
      "تعزيز محتوى الخدمة الأعلى اهتماماً في الصفحة الرئيسية.",
    ],
  };
}

/* ---------------------------------------------------------------- runner */

export async function runDailyAnalysis(day?: string): Promise<DailyReport> {
  const target = day ?? previousDay(riyadhDay());
  const events = await readEvents(target);
  const metrics = computeMetrics(target, events);

  const { narrative, model, reason } = await narrate(metrics);
  const used = narrative ?? fallbackNarrative(metrics);

  const report: DailyReport = {
    ...metrics,
    generatedAt: new Date().toISOString(),
    degraded: !narrative,
    degradedReason: narrative ? undefined : (reason ?? "unknown"),
    model,
    backend: backendName(),
    summary: used.summary,
    highlights: used.highlights,
    recommendations: used.recommendations,
  };

  await put(STORE, `reports/${target}`, report);
  return report;
}

export async function readReport(day: string) {
  return get<DailyReport>(STORE, `reports/${day}`);
}

export async function listReportDays(limit = 30) {
  const keys = await listKeys(STORE, "reports/");
  return keys
    .map((k) => k.replace("reports/", ""))
    .sort()
    .reverse()
    .slice(0, limit);
}
