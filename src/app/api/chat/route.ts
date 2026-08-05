import { NextResponse } from "next/server";
import { generate, hasAiKey } from "@/lib/ai";
import { recordEvent } from "@/lib/analytics";
import { rateLimit, clientKey } from "@/lib/submissions";
import { services } from "@/content/services";
import { about, faq, sectors, projects } from "@/content/pages";
import { company } from "@/content/site";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Grounding context, built from the approved content at module load.
 *
 * The assistant is explicitly constrained to this text. That is what stops it
 * inventing phone numbers, licences or figures — exactly the claims the
 * approved content document forbids publishing.
 */
const KNOWLEDGE = [
  `اسم الشركة: ${company.nameAr} (${company.nameEn}). المقر: ${company.cityAr}. الموقع: ${company.website}.`,
  `الرسالة الرئيسية: ${company.promise}`,
  `نبذة: ${about.lead[0]}`,
  `الرؤية: ${about.vision.headline} ${about.vision.body}`,
  `الرسالة: ${about.mission.body}`,
  "الخدمات:",
  ...services.map(
    (s) =>
      `- ${s.title} (${s.slug}): ${s.short} أبرز ما نقدمه: ${s.offerings
        .slice(0, 4)
        .map((o) => o.title)
        .join("، ")}.`,
  ),
  `القطاعات: ${sectors.items.map((s) => s.title).join("، ")}.`,
  `مشروع مميز: ${projects.featured.name} — ${projects.featured.summary}`,
  "الأسئلة الشائعة:",
  ...faq.items.map((f) => `س: ${f.q} ج: ${f.a}`),
].join("\n");

const SYSTEM = `أنت المساعد الرقمي لموقع ${company.nameAr}.
- أجب بالعربية الفصحى المبسطة، بنبرة مؤسسية ومختصرة (٢ إلى ٤ جمل).
- اعتمد حصراً على المعلومات المرفقة. إذا لم تكن المعلومة موجودة، قل بوضوح إنها تُستكمل عبر التواصل مع الفريق، ووجّه المستخدم إلى /contact أو /request-quote.
- لا تذكر أي أرقام هاتف أو بريد إلكتروني أو تراخيص أو شهادات أو إحصاءات غير واردة في المعلومات.
- عند السؤال عن خدمة، اذكر اسمها ورابط صفحتها بصيغة /services/<slug>.
- لا تَعِد بأسعار أو مدد تنفيذ؛ وجّه المستخدم إلى طلب عرض سعر.`;

/** Deterministic answer used when the AI is unavailable — never a dead end. */
function fallbackReply(message: string): string {
  const text = message.toLowerCase();

  const matched = services.find((s) =>
    [s.title, ...s.offerings.map((o) => o.title)].some((t) =>
      text.includes(t.slice(0, 6).toLowerCase()),
    ),
  );
  if (matched) {
    return `${matched.title}: ${matched.short} يمكنك الاطلاع على التفاصيل في /services/${matched.slug}، أو طلب عرض سعر عبر /request-quote.`;
  }

  const faqHit = faq.items.find((f) =>
    f.q
      .split(" ")
      .filter((w) => w.length > 4)
      .some((w) => text.includes(w.toLowerCase())),
  );
  if (faqHit) return faqHit.a;

  if (/سعر|عرض|تكلفة|quote|price/.test(text)) {
    return "للحصول على عرض سعر، عبّئ نموذج طلب عرض السعر في /request-quote مع وصف نطاق العمل، وسيتواصل معك الفريق المختص لاستكمال المعلومات.";
  }
  if (/تواصل|اتصال|هاتف|contact/.test(text)) {
    return `يمكنك التواصل معنا عبر نموذج التواصل في /contact. مقرنا في ${company.cityAr}.`;
  }

  return `نقدم في ${company.nameAr} حلولاً متكاملة تشمل: ${services
    .map((s) => s.title)
    .join("، ")}. أخبرني بالمجال الذي يهمك، أو اطلب عرض سعر عبر /request-quote.`;
}

export async function POST(req: Request) {
  const limit = rateLimit(`chat:${clientKey(req)}`, 25);
  if (!limit.allowed) {
    return NextResponse.json(
      { reply: "تم تجاوز الحد المسموح من الرسائل. يرجى المحاولة بعد قليل." },
      { status: 429 },
    );
  }

  let body: {
    message?: string;
    sessionId?: string;
    path?: string;
    history?: { role: string; text: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: "طلب غير صالح." }, { status: 400 });
  }

  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (!message) {
    return NextResponse.json({ reply: "يرجى كتابة سؤالك." }, { status: 400 });
  }

  // Capture the visitor turn before answering, so an AI failure never costs
  // us the behavioural signal.
  await recordEvent({
    type: "chat_turn",
    source: "visitor",
    sessionId: body.sessionId,
    path: body.path,
    text: message,
  });

  let reply: string;
  let degraded = false;

  if (hasAiKey()) {
    const history = (body.history ?? [])
      .slice(-6)
      .map((h) => `${h.role === "user" ? "المستخدم" : "المساعد"}: ${h.text}`)
      .join("\n");

    const res = await generate(
      `المعلومات المعتمدة:\n${KNOWLEDGE}\n\nسياق المحادثة:\n${history}\n\nسؤال المستخدم: ${message}`,
      { system: SYSTEM, maxOutputTokens: 400, temperature: 0.3 },
    );
    if (res.ok) {
      reply = res.text;
    } else {
      reply = fallbackReply(message);
      degraded = true;
    }
  } else {
    reply = fallbackReply(message);
    degraded = true;
  }

  await recordEvent({
    type: "chat_turn",
    source: "assistant",
    sessionId: body.sessionId,
    path: body.path,
    text: reply,
    meta: { degraded },
  });

  return NextResponse.json({ reply, degraded });
}
