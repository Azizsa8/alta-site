import { NextResponse } from "next/server";
import { generate, hasAiKey } from "@/lib/ai";
import { recordEvent } from "@/lib/analytics";
import { rateLimit, clientKey } from "@/lib/submissions";
import { services } from "@/content/services";
import { about, faq, industries, projects, home } from "@/content/pages";
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
  `الفئات التي نخدمها: ${industries.items.map((s) => s.title).join("، ")}.`,
  `مشروع مميز: ${projects.featured.name} — ${projects.featured.summary}`,
  "الأسئلة الشائعة:",
  ...faq.items.map((f) => `س: ${f.q} ج: ${f.a}`),
].join("\n");

const SYSTEM = `أنت المساعد الرقمي لموقع ${company.nameAr}.
- أجب بالعربية الفصحى المبسطة، بنبرة مؤسسية ومختصرة (٢ إلى ٤ جمل).
- اعتمد حصراً على المعلومات المرفقة. إذا لم تكن المعلومة موجودة، قل بوضوح إنها تُستكمل عبر التواصل مع الفريق، ووجّه المستخدم إلى /contact أو /request-quote.
- لا تذكر أي أرقام هاتف أو بريد إلكتروني أو تراخيص أو شهادات أو إحصاءات غير واردة في المعلومات.
- عند السؤال عن خدمة، اذكر اسمها ورابط صفحتها بصيغة /services/<slug>.
- لا تَعِد بأسعار أو مدد تنفيذ؛ وجّه المستخدم إلى طلب عرض سعر.
- قد يكتب المستخدم بلهجة عامية أو بأخطاء إملائية أو دون تشكيل أو بحروف ناقصة. افهم المقصود ولا تصحح له ولا تعلّق على الأخطاء، وأجب مباشرة عن نيته.
- إذا كان السؤال غير واضح تماماً، اذكر أقرب احتمالين واطلب توضيحاً موجزاً بدلاً من الاعتذار العام.`;

/**
 * Deterministic answer used when the AI is unavailable.
 *
 * This is NOT a rare edge case. On a free-tier key the primary model's daily
 * allowance is exhausted quickly, so in practice this path answers the
 * majority of questions. It is therefore built as a small retrieval index over
 * the approved content — services, sectors, identity, projects and the FAQ —
 * scored by term overlap, rather than a chain of ifs that bottoms out in a
 * generic service list.
 */

/** Arabic orthographic variants that block naive matching. */
function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

/**
 * Strip the definite article.
 *
 * Without this, "التوريدات" and "توريدات" are different tokens, and "الشركة"
 * looks rare when it is actually the most common word in the corpus — which
 * distorts IDF and lets a generic entry outrank a specific one.
 */
function stripArticle(token: string) {
  return token.length > 5 && token.startsWith("ال") ? token.slice(2) : token;
}

/**
 * Stop words. Note the verbs: "تقدمون", "تخدمون", "تعملون" carry no topical
 * information but appear in question phrasing constantly, and each one was
 * observed hijacking a match to whichever short entry happened to contain it.
 */
const STOP = new Set([
  "من", "في", "على", "عن", "الى", "هل", "ما", "هي", "هو", "ماهي", "كيف",
  "وما", "لكم", "لديكم", "عندكم", "التي", "الذي", "مع", "او", "و", "ماذا",
  "تقدمون", "تعملون", "تخدمون", "تنفذون", "لديك", "حدثني", "اخبرني", "اريد",
  "يمكن", "ممكن", "بشان", "حول", "the", "a", "of", "is", "do", "you", "what",
  "how", "about", "tell", "your",
  // Colloquial question openers, and "خدماتكم" — it appears in almost every
  // question, so it points at whichever entry is shortest rather than at the
  // topic the visitor actually named.
  "وش", "ايش", "شو", "وشو", "كيفيه", "خدماتكم", "خدماتك", "عندكم", "لديكم",
  "عايز", "ابغى", "ودي", "بغيت",
]);

function terms(text: string) {
  return normalise(text)
    .split(/\s+/)
    .map(stripArticle)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

type Entry = { keys: string; answer: string };

/** Everyday words for each approved sector name. */
const SECTOR_SYNONYMS: Record<string, string> = {
  "الرعاية الصحية": "مستشفيات مستشفى مراكز صحية عيادات طبي",
  "الفنادق والضيافة": "فندق فنادق منتجع منتجعات نزلاء ضيافة",
  التعليم: "مدارس مدرسة جامعات جامعة معاهد طلاب تعليمي",
  "المصانع والمستودعات": "مصنع مصانع مستودع مستودعات لوجستي",
  "الجهات الحكومية وشبه الحكومية": "حكومة حكومي وزارة وزارات هيئة أمانة بلدية",
  "الشركات والمنشآت التجارية": "شركات شركة تجاري منشآت أعمال",
  "القطاع غير الربحي": "جمعية جمعيات خيري وقف مؤسسات",
  "المجمعات الإدارية والسكنية": "مجمع مجمعات سكني أبراج مباني عقار",
  "الفعاليات والمؤتمرات": "فعالية مؤتمر معرض معارض مناسبات",
  "المقاولون ومتعهدو الخدمات": "مقاول مقاولات متعهد تعهدات",
};

/** Built once at module load from the approved content. */
const INDEX: Entry[] = [
  ...services.map((s) => ({
    // Deliberately NOT including s.sectors: it lists "الفنادق، المستشفيات…",
    // which made every sector question match a service instead of the sector.
    keys: `${s.title} ${s.short} ${s.offerings.map((o) => o.title).join(" ")}`,
    answer: `${s.title}: ${s.short} تفاصيل الخدمة في /services/${s.slug}، ويمكنك طلب عرض سعر عبر /request-quote.`,
  })),
  ...industries.items.map((s) => ({
    // Synonyms matter: visitors ask about "المستشفيات", but the approved text
    // for that sector says "الرعاية الصحية" and never uses the word.
    keys: `${s.title} ${s.body} قطاع قطاعات ${SECTOR_SYNONYMS[s.title] ?? ""}`,
    answer: `${s.title} — ${s.body} اطلع على جميع الفئات التي نخدمها في /industries، أو ناقش احتياجك عبر /contact.`,
  })),
  ...faq.items.map((f) => ({ keys: f.q, answer: f.a })),
  {
    keys: "رؤيه رؤيتكم رؤيتنا",
    answer: `${about.vision.title}: ${about.vision.headline} ${about.vision.body} المزيد في /about.`,
  },
  {
    keys: "رساله رسالتكم رسالتنا",
    answer: `${about.mission.title}: ${about.mission.body} المزيد في /about.`,
  },
  {
    // Curated entries stay TIGHT. Length normalisation divides by sqrt(tokens),
    // so padding an entry with near-synonyms actively lowers its score against
    // a short FAQ question.
    keys: "قيم قيمكم قيمنا مبادئ",
    answer: `قيمنا: ${about.values
      .map((v) => v.title)
      .join("، ")}. تفاصيلها في /about.`,
  },
  {
    keys: "من نحن نبذه تعريف الشركه about تاسيس مقر الرياض",
    answer: `${about.lead[0]} المزيد في /about.`,
  },
  {
    keys: "منهجيه منهجيتكم خطوات مراحل methodology",
    answer: `منهجيتنا: ${home.methodology
      .map((m) => `${m.step} ${m.title}`)
      .join(" — ")}. التفاصيل في /about#methodology.`,
  },
  {
    keys: "مشاريع مشاريعكم اعمالكم سابقه",
    answer: `من مشاريعنا ${projects.featured.name} (${projects.featured.nameAr}): ${projects.featured.summary} التفاصيل في /projects.`,
  },
  {
    keys: "وظائف وظيفه توظيف تقديم انضمام careers شركاء موردين تسجيل مورد كفاءات",
    answer:
      "نرحب بالكفاءات وبالشركاء والموردين. استعرض مجالات الفرص في /careers، وأرسل بياناتك عبر /contact مع تحديد المجال.",
  },
  {
    keys: "سعر عرض تكلفه ميزانيه quote price عروض اسعار",
    answer:
      "للحصول على عرض سعر، عبّئ نموذج طلب عرض السعر في /request-quote مع وصف نطاق العمل، وسيتواصل معك الفريق المختص لاستكمال المعلومات.",
  },
  {
    keys: "تواصل اتصال هاتف بريد عنوان موقع contact",
    answer: `يمكنك التواصل معنا عبر نموذج التواصل في /contact. مقرنا في ${company.cityAr}.`,
  },
  {
    keys: "خصوصيه بيانات حمايه سريه privacy",
    answer:
      "تُدار البيانات ضمن نطاق المشروع والصلاحيات المعتمدة، مع مراعاة الخصوصية والسرية. سياستنا الكاملة في /privacy-policy.",
  },
];

/**
 * Do two Arabic tokens refer to the same thing?
 *
 * Plain `includes` fails on the possessive and plural suffixes that dominate
 * real questions — "مشاريعكم" never contains-matches "مشاريع". Comparing on a
 * shared prefix of at least four characters handles those without pulling in a
 * stemming dependency.
 */
function tokensMatch(a: string, b: string) {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = shorter === a ? b : a;
  if (shorter.length >= 4 && longer.startsWith(shorter)) return true;
  // Tolerate one typo on reasonably long words: visitors type quickly on
  // phone keyboards and "الضيافه" / "الضيافة" / "الضياقة" all mean the same
  // question. Restricted to length >= 5 so short words cannot fuzzily collide.
  if (shorter.length >= 5 && Math.abs(a.length - b.length) <= 1) {
    return withinOneEdit(a, b);
  }
  return false;
}

/** True when `a` and `b` differ by at most one insertion, deletion or substitution. */
function withinOneEdit(a: string, b: string) {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.length - short.length > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (short.length === long.length) i++;
    j++;
  }
  return true;
}

/* ------------------------------------------------- conversational intents */

/**
 * Greetings, thanks and self-introductions.
 *
 * Real Arabic input is rarely clean: "السلام عليكم" arrives as "سلام عليكم",
 * "اسلام عليكم" or "السلام عليكم ورحمة الله", and people introduce themselves
 * as "أنا اسمي عبدالعزيز", "اسمي عبدالعزيز" or just "عبدالعزيز معك". These are
 * matched before the retrieval index, because a greeting scored against the
 * content index produces a confidently wrong service answer.
 */
/*
 * NOTE: no `\b` anywhere below. JavaScript defines the word-boundary assertion
 * over ASCII word characters, so `/\bسلام/` never matches Arabic text — it
 * fails silently, which is exactly how the first version of this passed review
 * and then matched nothing at runtime.
 */
const GREETING_PATTERNS = [
  /سلام\s*عليكم/,
  /السلام/,
  /مرحب/,
  /اهلا|اهلين|هلا/,
  /صباح\s*(الخير|النور)/,
  /مساء\s*(الخير|النور)/,
  /تحيه|تحياتي/,
  /^\s*(hi|hello|hey|salam|assalam|greetings)\b/i,
];

const THANKS_PATTERNS = [
  /شكر/,
  /مشكور/,
  /يعطيك\s*العافيه/,
  /تسلم/,
  /\bthanks?\b/i,
  /\bthank you\b/i,
];

/** Matched against the RAW message so the captured name keeps its casing. */
const NAME_PATTERNS = [
  /(?:انا|أنا)\s+اسمي\s+([\p{L}\s]{2,30})/u,
  /اسمي\s+([\p{L}\s]{2,30})/u,
  /(?:انا|أنا)\s+([\p{L}]{3,20})\s*$/u,
  /معك\s+([\p{L}]{3,20})/u,
  /my name is\s+([\p{L}\s]{2,30})/iu,
  /(?:^|\s)i(?:'m| am)\s+([\p{L}\s]{2,30})/iu,
];

/** Words that follow "أنا" but are not names. */
const NOT_A_NAME = /(ابحث|أبحث|اريد|أريد|احتاج|أحتاج|عندي|اسال|أسأل|مهتم|جديد)/;

function extractName(raw: string): string | null {
  for (const re of NAME_PATTERNS) {
    const m = raw.match(re);
    if (!m?.[1]) continue;
    const name = m[1].trim().split(/\s+/).slice(0, 2).join(" ");
    if (name.length >= 3 && !NOT_A_NAME.test(name)) return name;
  }
  return null;
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((re) => re.test(text));
}

/**
 * Handle conversational openers deterministically.
 *
 * Returns null when the message is a real question, so it falls through to
 * retrieval (or the AI).
 */
function socialReply(raw: string): string | null {
  const t = normalise(raw);
  // Name comes from the raw text so "Aziz" is not returned as "aziz".
  const name = extractName(raw);
  const isGreeting = matchesAny(t, GREETING_PATTERNS);
  const stripped = t
    .replace(/سلام\s*عليكم|السلام|عليكم|ورحمه|الله|وبركاته|مرحبا|اهلا|اهلين|هلا/g, "")
    .replace(/صباح\s*(الخير|النور)|مساء\s*(الخير|النور)/g, "")
    .replace(/انا\s+اسمي|اسمي|معك/g, "")
    .replace(/\b(hi|hello|hey|my name is|i am|thanks?|thank you)\b/gi, "")
    .replace(
      name ? new RegExp(normalise(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : /$^/,
      "",
    )
    .trim();

  // A greeting or introduction carrying a real question: answer the question.
  const hasQuestion = terms(stripped).length >= 2;

  if (name && !hasQuestion) {
    return `أهلاً ${name}، سعدنا بتواصلك مع ${company.nameAr}. كيف يمكنني مساعدتك؟ يمكنك سؤالي عن خدماتنا أو القطاعات التي نخدمها، أو طلب عرض سعر عبر /request-quote.`;
  }
  if (isGreeting && !hasQuestion) {
    return `وعليكم السلام ورحمة الله وبركاته، أهلاً بك في ${company.nameAr}. كيف يمكنني مساعدتك؟ يمكنك سؤالي عن خدماتنا أو طلب عرض سعر عبر /request-quote.`;
  }
  if (matchesAny(t, THANKS_PATTERNS) && !hasQuestion) {
    return "العفو، سعدنا بخدمتك. إن احتجت أي معلومة أخرى عن خدماتنا أو أردت عرض سعر فأنا هنا.";
  }
  return null;
}

/** Pre-tokenised index, so scoring does no string splitting per request. */
const INDEX_TOKENS = INDEX.map((entry) => ({
  answer: entry.answer,
  tokens: terms(entry.keys),
}));

/**
 * Inverse document frequency over the index.
 *
 * Term length alone is a poor proxy for informativeness: "الشركة" is long but
 * appears nearly everywhere, while "قيم" is short and appears in one entry.
 * Weighting by rarity is what makes "هل تعملون مع الفنادق؟" resolve to the
 * hotels sector rather than to whichever entry happens to share a common verb.
 */
const DOC_FREQ = (() => {
  const freq = new Map<string, number>();
  for (const entry of INDEX_TOKENS) {
    for (const token of new Set(entry.tokens)) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return freq;
})();

function idf(token: string) {
  // Count prefix-compatible documents, mirroring how matching works.
  let df = 0;
  for (const [indexed, count] of DOC_FREQ) {
    if (tokensMatch(token, indexed)) df += count;
  }
  return Math.log((INDEX_TOKENS.length + 1) / (df + 1)) + 0.2;
}

function fallbackReply(message: string): string {
  const social = socialReply(message);
  if (social) return social;

  const asked = terms(message);
  if (asked.length === 0) return genericReply();

  const weights = asked.map((t) => Math.max(idf(t), 0));
  let best: { score: number; answer: string } | null = null;

  for (const entry of INDEX_TOKENS) {
    let raw = 0;
    asked.forEach((q, i) => {
      if (entry.tokens.includes(q)) {
        raw += weights[i];
      } else if (entry.tokens.some((t) => tokensMatch(q, t))) {
        // A prefix hit is weaker evidence than the exact word. Without this
        // discount, "مشاريعكم" scores the same against an entry that literally
        // lists it and one that merely contains "مشاريع", and insertion order
        // silently decides the winner.
        raw += weights[i] * 0.75;
      }
    });
    if (raw === 0) continue;

    // Normalise by document length so verbose entries cannot win purely by
    // having more words to collide with.
    const score = raw / Math.sqrt(entry.tokens.length);
    if (!best || score > best.score) best = { score, answer: entry.answer };
  }

  // Require real evidence before claiming a match.
  return best && best.score >= 0.35 ? best.answer : genericReply();
}

function genericReply(): string {
  return `نقدم في ${company.nameAr} حلولاً متكاملة تشمل: ${services
    .map((s) => s.title)
    .join("، ")}. أخبرني بالمجال الذي يهمك، أو اطلب عرض سعر عبر /request-quote.`;
}

export async function POST(req: Request) {
  // A real visitor conversation runs well past 25 turns/minute once greetings,
  // follow-ups and suggestion chips are counted; 25 was throttling legitimate use.
  const limit = rateLimit(`chat:${clientKey(req)}`, 80);
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

  // Greetings, thanks and self-introductions are answered deterministically,
  // before the model. They need no reasoning, they must never burn free-tier
  // quota, and a greeting scored against the content index would otherwise
  // produce a confidently irrelevant service answer.
  const social = socialReply(message);
  if (social) {
    await recordEvent({
      type: "chat_turn",
      source: "assistant",
      sessionId: body.sessionId,
      path: body.path,
      text: social,
      meta: { intent: "social" },
    });
    return NextResponse.json({ reply: social, degraded: false });
  }

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
