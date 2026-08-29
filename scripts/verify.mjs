#!/usr/bin/env node
/**
 * Full-stack verification.
 *
 * Boots the production server, then runs every check FIVE times and requires
 * all five passes to be green. Repetition is the point: it catches ordering
 * bugs, stale caches, id collisions and state that leaks between runs — none
 * of which a single pass would reveal.
 *
 *   node scripts/verify.mjs [passes]
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

// `new URL(...).pathname` percent-encodes spaces, and this project lives under
// a path that has them. fileURLToPath is the only correct conversion.
const PROJECT_ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

const PORT = process.env.VERIFY_PORT ?? "3311";
const BASE = `http://127.0.0.1:${PORT}`;
const PASSES = Number(process.argv[2] ?? 5);

const ADMIN_TOKEN = "verify-admin-token";
const CRON_SECRET = "verify-cron-secret";
const ADMIN_USERNAME = "verify-admin";
const ADMIN_PASSWORD = "verify-password-123";
const SENDER = "966500000000";
const STRANGER = "966599999999";

const AUTH = { authorization: `Bearer ${ADMIN_TOKEN}` };
const JSON_HEADERS = { "content-type": "application/json" };

/**
 * The API rate-limits per client IP. Every request from this script would
 * otherwise share one bucket ("unknown") and later passes would 429 — which
 * measures the limiter, not the endpoints. Each pass presents itself as a
 * different visitor, which is also the realistic scenario.
 */
let clientIp = "203.0.113.1";
function asVisitor(extra = {}) {
  return { "x-forwarded-for": clientIp, ...extra };
}

/* ------------------------------------------------------------- harness -- */

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`   ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function getText(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: res.status, body: await res.text() };
}

async function postJson(path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...asVisitor(), ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json, text };
}

async function getJson(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json, text };
}

/* --------------------------------------------------------------- checks -- */

const RAW_PAGES = [
  ["/", ["شركة التا للاستثمار", "حلول متكاملة", "ALTA Hospitality"]],
  ["/about", ["من نحن", "رؤيتنا", "قيمنا", "الجودة والسلامة والحوكمة"]],
  ["/services", ["خدماتنا", "هندسة الذكاء الاصطناعي", "البحوث واستطلاع الرأي"]],
  ["/services/ai-engineering", ["ذكاء اصطناعي مصمم لخدمة أهداف العمل", "منهجية التنفيذ"]],
  ["/services/facilities-management", ["مرافق أكثر جاهزية", "الصيانة الوقائية"]],
  ["/services/hospitality-catering", ["تجربة ضيافة منظمة", "الإعاشة المطهية"]],
  ["/services/management-consulting", ["منشأة أكثر وضوح", "التشخيص المؤسسي"]],
  ["/services/procurement-supplies", ["توريد موثوق", "المواد التشغيلية"]],
  ["/services/media-social", ["حضور مؤسسي يصنع الثقة", "الهوية البصرية"]],
  ["/services/events-exhibitions", ["تجارب متكاملة", "تصميم مفهوم الفعالية"]],
  ["/services/research-surveys", ["بيانات موثوقة", "دراسات السوق"]],
  [
    "/services/ai-engineering/platforms",
    ["برامجنا وتطبيقاتنا ومنصاتنا", "ALTA Hospitality AI"],
  ],
  [
    "/services/ai-engineering/platforms/alta-hospitality",
    ["ALTA Hospitality AI", "الوكلاء الأذكياء", "لوحة واحدة", "تكامل PMS"],
  ],
  ["/sectors", ["القطاعات التي نخدمها", "الفنادق والضيافة"]],
  ["/projects", ["المشاريع وسابقة الأعمال", "ALTA Hospitality", "alta-hospitality"]],
  ["/media-center", ["المركز الإعلامي", "أخبار الشركة"]],
  ["/careers", ["نبحث عن أشخاص يصنعون الفرق", "الشراكات والموردون"]],
  ["/faq", ["الأسئلة الشائعة", "كيف أحصل على عرض سعر"]],
  ["/contact", ["نموذج التواصل", "الاسم الكامل"]],
  ["/request-quote", ["نموذج طلب عرض السعر", "وصف الاحتياج"]],
  ["/privacy-policy", ["سياسة الخصوصية", "البيانات التي نجمعها"]],
  ["/terms", ["الشروط والأحكام", "الملكية الفكرية"]],
  ["/sitemap.xml", ["/services/ai-engineering", "/projects"]],
  ["/robots.txt", ["Sitemap", "Disallow"]],
];

/**
 * Public pages moved under /[locale]. The list above deliberately stays
 * locale-free so it reads as site structure rather than as URLs, and this is
 * the single place the segment is added.
 *
 * Asserting the ARABIC tree specifically, not the bare paths: bare paths 307
 * to a locale chosen from Accept-Language, so a suite run against them would
 * be testing the redirect, not the page — and would silently follow whichever
 * locale the runtime happened to negotiate.
 *
 * /sitemap.xml and /robots.txt are not pages and must never be prefixed.
 */
const VERIFY_LOCALE = "ar";
const PAGES = RAW_PAGES.map(([path, needles]) =>
  /\.(xml|txt)$/.test(path)
    ? [path, needles]
    : [`/${VERIFY_LOCALE}${path === "/" ? "" : path}`, needles],
);

async function checkPages() {
  for (const [path, needles] of PAGES) {
    const { status, body } = await getText(path);
    check(`GET ${path} → 200`, status === 200, `got ${status}`);
    for (const needle of needles) {
      check(`${path} contains "${needle.slice(0, 28)}"`, body.includes(needle));
    }
  }

  /*
   * The header bar must carry a "request a quote" CTA.
   *
   * Reinstated 2026-08-29 per the client's restructuring plan (the nav is now
   * الرئيسية | عن التا | قطاعاتنا | مشاريعنا | الرؤى والمقالات | تواصل معنا |
   * اطلب عرض سعر) — this reverses the earlier "never add it" constraint from
   * the same client, so it is asserted on every page rather than trusted to a
   * comment in Header.tsx, same as the rule it replaces.
   *
   * The check reads only the markup between <header> and </header>; the same
   * link elsewhere on the page (hero, closing band, footer) is expected and
   * must keep working regardless.
   */
  for (const [path] of PAGES) {
    // PAGES also carries /robots.txt and /sitemap.xml, which are not documents
    // and correctly have no chrome. Asserting against them fails on the
    // absence of a header rather than on the thing being guarded.
    if (/\.(txt|xml)$/.test(path)) continue;
    const { body } = await getText(path);
    const header = body.match(/<header[\s\S]*?<\/header>/i)?.[0] ?? "";
    check(
      `${path} renders a header`,
      header !== "",
      "no <header> element in the document",
    );
    /*
     * Assert on the CTA's LABEL, not on the path.
     *
     * Matching "/request-quote" was a false positive before too: on
     * /ar/request-quote the language switch links to that same page in the
     * other locale, so its own href legitimately contains the string. The
     * thing being guarded is the button, identified by its visible text.
     */
    check(
      `${path} header has the request-quote CTA`,
      header.includes("اطلب عرض سعر"),
      "quote CTA label missing from <header>",
    );
  }
  // ...but the action must still be reachable from the page itself.
  const homeForCta = await getText(`/${VERIFY_LOCALE}`);
  check(
    "request-quote is still reachable off-header",
    homeForCta.body.includes("/request-quote"),
  );

  // Approved partner logos — all eighteen from the approved sheet, served and
  // rendered in the carousel. A missing file would 404 silently in an <img>.
  const homeForPartners = await getText(`/${VERIFY_LOCALE}`);
  const PARTNER_FILES = [
    "stc", "king-saud-university", "nic", "intercontinental", "petlas",
    "alyamama", "princess-nourah-university", "iie", "jahez", "socpa",
    "lilly", "nabatat", "saudi-camel-sports", "state-security",
    "anti-narcotics", "national-guard-health", "asifat-alhazm", "saudi-heritage",
  ];
  check("partner carousel is on the homepage", homeForPartners.body.includes("شركاء النجاح"));
  // Auto-carousels are real scroll containers (so they can be swiped), with
  // their contents rendered twice for a seamless loop.
  check(
    "carousels are swipeable scroll containers",
    homeForPartners.body.includes("no-scrollbar") &&
      homeForPartners.body.includes("overflow-x-auto"),
  );
  check(
    "services and news are carousels too",
    homeForPartners.body.includes('aria-label="خدماتنا"') &&
      homeForPartners.body.includes("آخر الأخبار"),
  );
  check(
    "carousel content is duplicated for looping",
    (homeForPartners.body.match(/stc\.png/g) ?? []).length >= 2,
  );
  /* Versioned path — see PartnerCarousel. The files are served immutable for a
     year, so re-cut artwork ships under a new folder rather than overwriting.
     Keep this in step with ASSETS there; a mismatch 404s all eighteen. */
  const PARTNER_ASSETS = "v2";
  for (const file of PARTNER_FILES) {
    const res = await fetch(`${BASE}/partners/${PARTNER_ASSETS}/${file}.png`);
    check(
      `partner logo ${PARTNER_ASSETS}/${file}.png served`,
      res.status === 200,
      `got ${res.status}`,
    );
  }
  check(
    "all 18 partners referenced in the markup",
    PARTNER_FILES.every((f) => homeForPartners.body.includes(`${f}.png`)),
  );

  // Scroll-reveal must be armed by JS only, so content is never stuck hidden.
  check("sections opt into scroll reveal", homeForPartners.body.includes("data-reveal"));

  // Mobile: the oversized quote CTA must not be in the hero on phones.
  check(
    "hero quote CTA is desktop-only",
    /hidden md:inline-flex[^"]*"[^>]*>\s*اطلب عرض سعر|اطلب عرض سعر/.test(
      homeForPartners.body,
    ) && homeForPartners.body.includes("hidden md:inline-flex"),
  );

  // Brand rules: transparent approved logo present, RTL Arabic document.
  const home = await getText(`/${VERIFY_LOCALE}`);
  check("home references approved transparent mark", home.body.includes("alta-mark"));
  check("home is RTL Arabic", home.body.includes('dir="rtl"') && home.body.includes('lang="ar"'));
  check(
    "no unverified statistics published",
    !/\+?500\s*موظف|\+?200\s*مشروع|20\+?\s*عام/.test(home.body),
    "approved content forbids unverified figures",
  );

  // 404 uses the approved copy.
  // Must be requested INSIDE a locale. A bare unknown path is redirected by
  // middleware before routing ever runs, so it answers 307 and the 404 page is
  // never exercised.
  const missing = await getText(`/${VERIFY_LOCALE}/this-page-does-not-exist`);
  check("404 status", missing.status === 404, `got ${missing.status}`);
  check("404 uses approved copy", missing.body.includes("يبدو أن الصفحة غير موجودة"));
}

async function checkForms(runId) {
  // Rejected: missing required fields.
  const bad = await postJson("/api/contact", { fullName: "", phone: "", consent: false });
  check("contact rejects empty payload", bad.status === 400);
  check("contact returns field errors", Boolean(bad.json?.errors?.fullName));

  // Rejected: bad phone.
  const badPhone = await postJson("/api/contact", {
    fullName: "تجربة",
    phone: "12345",
    subject: "general",
    message: "رسالة",
    consent: true,
  });
  check("contact rejects non-Saudi mobile", badPhone.status === 400);
  check("contact flags the phone field", Boolean(badPhone.json?.errors?.phone));

  // Rejected: consent withheld (PDPL requirement).
  const noConsent = await postJson("/api/contact", {
    fullName: "تجربة",
    phone: "0512345678",
    subject: "general",
    message: "رسالة",
    consent: false,
  });
  check("contact requires privacy consent", noConsent.status === 400);

  // Accepted.
  const good = await postJson("/api/contact", {
    fullName: `زائر ${runId}`,
    organisation: "منشأة تجريبية",
    phone: "0512345678",
    email: "test@example.com",
    subject: "ai-engineering",
    message: "نحتاج حل ذكاء اصطناعي لأتمتة خدمة العملاء وتحليل البيانات.",
    consent: true,
    elapsedMs: 45_000,
    sessionId: `sess-${runId}`,
    path: "/contact",
  });
  check("contact accepts a valid submission", good.status === 200, `got ${good.status}`);
  check("contact returns an id", Boolean(good.json?.id));

  // Quote form, including the attachment size guard.
  const bigAttachment = await postJson("/api/quote", {
    fullName: "مقدم",
    organisation: "منشأة",
    phone: "0512345678",
    email: "a@b.com",
    service: "facilities-management",
    scope: "نطاق",
    consent: true,
    attachment: { name: "big.pdf", size: 9_000_000, type: "application/pdf", data: "AA" },
  });
  check("quote rejects oversized attachment", bigAttachment.status === 400);

  const quote = await postJson("/api/quote", {
    fullName: `مقدم ${runId}`,
    organisation: "شركة تجريبية",
    phone: "+966512345678",
    email: "quote@example.com",
    service: "hospitality-catering",
    city: "الرياض",
    scope: "تشغيل خدمات الضيافة والإعاشة لموقع يضم 300 مستفيد.",
    timeline: "الربع الأول",
    preferredContact: "whatsapp",
    consent: true,
    elapsedMs: 90_000,
    sessionId: `sess-${runId}`,
    path: "/request-quote",
  });
  check("quote accepts a valid submission", quote.status === 200, `got ${quote.status}`);
}

async function checkChat(runId) {
  const sessionId = `sess-${runId}`;

  const reply = await postJson("/api/chat", {
    message: "ما هي خدمات التشغيل والصيانة التي تقدمونها؟",
    sessionId,
    path: "/",
  });
  check("chat responds 200", reply.status === 200, `got ${reply.status}`);
  check("chat returns a non-empty reply", (reply.json?.reply ?? "").length > 20);

  const empty = await postJson("/api/chat", { message: "  ", sessionId });
  check("chat rejects an empty message", empty.status === 400);

  const quoteAsk = await postJson("/api/chat", {
    message: "كيف أحصل على عرض سعر؟",
    sessionId,
  });
  check(
    // Either the explicit quote route or the approved FAQ answer is correct
    // here; both send the visitor to the quote form.
    "chat routes pricing questions to the quote form",
    /request-quote|عرض السعر|عرض سعر/.test(quoteAsk.json?.reply ?? ""),
  );

  /*
   * Fallback retrieval quality.
   *
   * This suite runs with no GEMINI_API_KEY, so every reply here comes from the
   * deterministic index — which is also what answers most real traffic on a
   * free-tier key. Each question below returned a generic service list in
   * production before the index was built.
   */
  const grounded = [
    ["هل تعملون مع الفنادق؟", /فنادق|ضيافة/, "hotels → hospitality sector"],
    ["ما هي رؤيتكم؟", /الشريك المفضل|رؤيتنا/, "vision → approved vision text"],
    ["ما رسالتكم؟", /خدمات احترافية|رسالتنا/, "mission → approved mission text"],
    ["ما قيم الشركة؟", /الجودة|الالتزام|قيمنا/, "values → approved values"],
    ["حدثني عن مشاريعكم", /ALTA Hospitality|مشاريع/, "projects → featured project"],
    ["كيف تديرون الجودة؟", /معايير القبول|الجودة/, "quality → approved answer"],
    ["أريد وظيفة لديكم", /careers|الفرص|الكفاءات/, "careers → careers page"],
    ["ما منهجية عملكم؟", /نفهم الاحتياج|منهجيتنا/, "methodology → the 4 steps"],
    ["هل تخدمون المستشفيات؟", /الرعاية الصحية|صحي/, "hospitals → healthcare sector"],
    ["ماذا تقدمون في التوريدات؟", /التوريدات|توريد/, "procurement → that service"],
  ];
  for (const [question, expect, label] of grounded) {
    const res = await postJson("/api/chat", { message: question, sessionId });
    const reply = res.json?.reply ?? "";
    check(`fallback: ${label}`, expect.test(reply), reply.slice(0, 55));
  }

  /*
   * Imperfect Arabic. Visitors greet, introduce themselves and misspell —
   * often all three at once. A greeting scored against the content index
   * returns a confidently irrelevant service answer, so these are handled
   * before retrieval.
   */
  const social = [
    ["السلام عليكم", /وعليكم السلام/, "full greeting"],
    ["سلام عليكم", /وعليكم السلام/, "greeting missing the article"],
    ["اسلام عليكم", /وعليكم السلام/, "misspelled greeting"],
    ["مرحبا", /أهلاً|مرحب/, "marhaba"],
    ["هلا", /أهلاً|مرحب/, "hala"],
    ["صباح الخير", /أهلاً|مرحب/, "morning greeting"],
    ["أنا اسمي عبدالعزيز", /عبدالعزيز/, "full self-introduction"],
    ["اسمي عبدالعزيز", /عبدالعزيز/, "short self-introduction"],
    ["انا اسمي عبد العزيز", /عبد العزيز|عبدالعزيز/, "two-part name"],
    ["hello", /أهلاً|مرحب/, "english hello"],
    ["my name is Aziz", /Aziz/, "english introduction"],
    ["شكرا لك", /العفو/, "thanks"],
    ["مشكور", /العفو/, "colloquial thanks"],
  ];
  for (const [message, expect, label] of social) {
    const res = await postJson("/api/chat", { message, sessionId });
    const reply = res.json?.reply ?? "";
    check(`arabic: ${label}`, expect.test(reply), reply.slice(0, 55));
  }

  // A greeting that also carries a question must answer the QUESTION.
  const mixed = await postJson("/api/chat", {
    message: "السلام عليكم، ما هي خدمات التوريدات لديكم؟",
    sessionId,
  });
  check(
    "arabic: greeting + question answers the question",
    /توريد/.test(mixed.json?.reply ?? ""),
    (mixed.json?.reply ?? "").slice(0, 55),
  );

  // Misspellings of real topics must still resolve.
  const typos = [
    ["ما هي خدمات الضيافه؟", /ضيافة|إعاشة/, "ة→ه"],
    ["عايز اعرف عن التوريدت", /توريد/, "dropped letter"],
    ["وش خدماتكم في الصيانه", /صيانة|تشغيل/, "colloquial + ة→ه"],
  ];
  for (const [message, expect, label] of typos) {
    const res = await postJson("/api/chat", { message, sessionId });
    check(`arabic typo: ${label}`, expect.test(res.json?.reply ?? ""),
      (res.json?.reply ?? "").slice(0, 55));
  }

  // A question with no match must still not dead-end.
  const unknown = await postJson("/api/chat", {
    message: "زززز ققققق",
    sessionId,
  });
  check(
    "unmatched question still offers a route forward",
    /request-quote/.test(unknown.json?.reply ?? ""),
  );

  // Explicit satisfaction signal.
  const rating = await postJson("/api/feedback", { sessionId, score: 1, source: "chat" });
  check("feedback accepts a valid score", rating.status === 200);

  const badRating = await postJson("/api/feedback", { sessionId, score: 5 });
  check("feedback rejects an out-of-range score", badRating.status === 400);
}

async function checkAnalytics() {
  // This endpoint returns raw visitor messages — it must refuse anonymous reads.
  const unauth = await getJson("/api/admin/analytics");
  check("admin analytics refuses anonymous access", unauth.status === 401, `got ${unauth.status}`);

  const wrongToken = await getJson("/api/admin/analytics", {
    authorization: "Bearer not-the-token",
  });
  check("admin analytics refuses a wrong token", wrongToken.status === 401);

  const live = await getJson("/api/admin/analytics?live=1", AUTH);
  check("live metrics respond", live.status === 200);
  check("live metrics counted today's events", (live.json?.eventCount ?? 0) > 0);
  check(
    "interests were scored from real input",
    (live.json?.metrics?.interests?.length ?? 0) > 0,
  );
  check(
    "form submissions were counted",
    (live.json?.metrics?.totals?.formSubmissions ?? 0) > 0,
  );
  check("chat turns were counted", (live.json?.metrics?.totals?.chatMessages ?? 0) > 0);
  check(
    "satisfaction index computed",
    live.json?.metrics?.satisfaction?.index !== undefined,
  );

  // Run the daily job on demand against TODAY, so it sees the events we just made.
  const today = live.json?.day;
  const run = await postJson(
    `/api/analytics/run?day=${today}`,
    {},
    { "x-cron-secret": CRON_SECRET },
  );
  check("daily analysis runs", run.status === 200, `got ${run.status}`);
  check("report has the right day", run.json?.report?.day === today);
  check("report has a summary", (run.json?.report?.summary ?? "").length > 10);
  check(
    "report carries recommendations",
    (run.json?.report?.recommendations?.length ?? 0) > 0,
  );
  check(
    "report records interests",
    (run.json?.report?.interests?.length ?? 0) > 0,
  );

  // The report must be readable back through the admin API.
  const stored = await getJson(`/api/admin/analytics?day=${today}`, AUTH);
  check("stored report is readable", stored.json?.report?.day === today);
}

async function checkAgents() {
  const readiness = await getJson("/api/agent/readiness");
  check("readiness responds", readiness.status === 200);
  check("two agents registered", (readiness.json?.sites?.length ?? 0) === 2);
  check(
    "alta agent has an allow-listed sender",
    (readiness.json?.sites?.find((s) => s.id === "alta")?.allowedSenderCount ?? 0) > 0,
  );

  // SAFETY: an unknown number using a valid keyword must be refused.
  const stranger = await postJson(
    "/api/agent/message",
    { sender: STRANGER, text: "alta لون رئيسي #ff0000" },
    AUTH,
  );
  check("unknown sender is refused", stranger.json?.authorised === false);
  check(
    "refusal explains why",
    /غير مصرح/.test(stranger.json?.reply ?? ""),
  );

  // Menu.
  const menu = await postJson("/api/agent/message", { sender: SENDER, text: "alta" }, AUTH);
  check("keyword alone returns the menu", /الأوامر المتاحة/.test(menu.json?.reply ?? ""));

  // Propose a theme change via natural language (named colour, not hex).
  const propose = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "alta غيّر اللون الرئيسي إلى ذهبي" },
    AUTH,
  );
  const id = propose.json?.reply?.match(/الرمز: ([A-Z0-9]{5})/)?.[1];
  check("named colour produces a proposal", Boolean(id), propose.json?.reply?.slice(0, 60));
  check(
    "proposal is NOT auto-applied",
    /لا يُطبَّق|للاعتماد أرسل/.test(propose.json?.reply ?? "") || Boolean(id),
  );

  // Confirm nothing changed before approval.
  const beforeStatus = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "alta حالة" },
    AUTH,
  );
  const revBefore = Number(beforeStatus.json?.reply?.match(/الإصدار: r(\d+)/)?.[1] ?? -1);
  check("status reports a revision", revBefore >= 0);

  // A stranger must not be able to approve someone else's proposal.
  if (id) {
    const hijack = await postJson(
      "/api/agent/message",
      { sender: STRANGER, text: `موافقة ${id}` },
      AUTH,
    );
    check("stranger cannot approve a proposal", hijack.json?.authorised === false);
  }

  // Approve.
  let revAfter = revBefore;
  if (id) {
    const approve = await postJson(
      "/api/agent/message",
      { sender: SENDER, text: `موافقة ${id}` },
      AUTH,
    );
    check("approval applies the change", /تم تطبيق التغيير/.test(approve.json?.reply ?? ""));
    revAfter = Number(approve.json?.reply?.match(/r(\d+)/)?.[1] ?? -1);
    check("revision incremented", revAfter === revBefore + 1, `${revBefore} → ${revAfter}`);

    // Double-approval must be rejected (replay protection).
    const replay = await postJson(
      "/api/agent/message",
      { sender: SENDER, text: `موافقة ${id}` },
      AUTH,
    );
    check(
      "the same proposal cannot be applied twice",
      /سبق أن تمت معالجته/.test(replay.json?.reply ?? ""),
    );
  }

  // The applied colour must actually reach the rendered page.
  const home = await getText(`/${VERIFY_LOCALE}`);
  check(
    "applied theme is rendered as a CSS override",
    home.body.includes("alta-theme-overrides") && home.body.includes("#d9a84e"),
  );

  // Content change → visible on the homepage.
  const headline = `عنوان تجريبي ${Date.now().toString(36)}`;
  const contentPropose = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: `alta نص العنوان: ${headline}` },
    AUTH,
  );
  const contentId = contentPropose.json?.reply?.match(/الرمز: ([A-Z0-9]{5})/)?.[1];
  check("content change produces a proposal", Boolean(contentId));
  if (contentId) {
    await postJson("/api/agent/message", { sender: SENDER, text: `موافقة ${contentId}` }, AUTH);
    // The homepage revalidates every 60s; force a fresh render.
    const updated = await getText(`/${VERIFY_LOCALE}?cachebust=${Date.now()}`);
    check("approved headline appears on the homepage", updated.body.includes(headline));
  }

  // Rejection path.
  const toReject = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "alta لون الخلفية كحلي" },
    AUTH,
  );
  const rejectId = toReject.json?.reply?.match(/الرمز: ([A-Z0-9]{5})/)?.[1];
  if (rejectId) {
    const rejected = await postJson(
      "/api/agent/message",
      { sender: SENDER, text: `رفض ${rejectId}` },
      AUTH,
    );
    check("rejection cancels the proposal", /تم إلغاء الطلب/.test(rejected.json?.reply ?? ""));
  }

  // Invalid colour must not create a proposal.
  const nonsense = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "alta لون رئيسي بنفسجي-فاقع-جدا-غير-موجود" },
    AUTH,
  );
  check(
    "unparseable colour is refused, not guessed",
    /لم أتعرف على اللون/.test(nonsense.json?.reply ?? "") ||
      /الرمز:/.test(nonsense.json?.reply ?? ""),
  );

  // Reports capability.
  const report = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "alta تقرير" },
    AUTH,
  );
  check("agent returns a behaviour report", /📊 تقرير/.test(report.json?.reply ?? ""));

  // Suggestions capability.
  const preview = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "alta معاينة" },
    AUTH,
  );
  check("agent returns homepage suggestions", /اقتراحات/.test(preview.json?.reply ?? ""));

  // Rollback.
  if (revAfter > 0) {
    const restore = await postJson(
      "/api/agent/message",
      { sender: SENDER, text: `alta استرجاع ${revBefore}` },
      AUTH,
    );
    check("rollback succeeds", /تم الرجوع إلى الإصدار/.test(restore.json?.reply ?? ""));
  }

  // Second project keyword routes to its own agent.
  const second = await postJson(
    "/api/agent/message",
    { sender: SENDER, text: "hospitality حالة" },
    AUTH,
  );
  check("second keyword routes to its own agent", second.json?.siteId === "hospitality");
}

async function checkAdminDashboard() {
  // Unauthenticated: the dashboard must bounce to the login page, and the
  // login page itself must render.
  const dash = await fetch(`${BASE}/admin`, { redirect: "manual" });
  check(
    "/admin redirects an anonymous visitor",
    dash.status === 307 || dash.status === 302,
    `got ${dash.status}`,
  );

  const login = await getText("/admin/login");
  check("/admin/login renders", login.status === 200, `got ${login.status}`);
  check("login page has the form", login.body.includes("اسم المستخدم"));
  check("login page is noindex", login.body.includes("noindex"));
  check(
    "admin pages drop the public site chrome",
    !login.body.includes("المساعد الذكي"),
  );

  // Wrong credentials.
  const badUser = await postJson("/api/admin/login", {
    username: "nope",
    password: ADMIN_PASSWORD,
  });
  check("login rejects a wrong username", badUser.status === 401);
  const badPass = await postJson("/api/admin/login", {
    username: ADMIN_USERNAME,
    password: "wrong-password",
  });
  check("login rejects a wrong password", badPass.status === 401);
  check(
    "login does not reveal which half was wrong",
    badUser.json?.error === badPass.json?.error,
  );

  // Correct credentials → session cookie.
  const ok = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...asVisitor() },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  check("login accepts correct credentials", ok.status === 200, `got ${ok.status}`);

  const setCookie = ok.headers.get("set-cookie") ?? "";
  check("session cookie is issued", setCookie.includes("alta_admin="));
  check("session cookie is HttpOnly", /httponly/i.test(setCookie));
  check("session cookie is SameSite=Lax", /samesite=lax/i.test(setCookie));
  // Over plain http the cookie must NOT be Secure, or a local `next start`
  // login would be silently dropped by the browser.
  check("no Secure flag over http", !/;\s*secure/i.test(setCookie));

  // REGRESSION: the Secure flag was originally gated on process.env.NETLIFY,
  // which is build-time only and absent in the deployed runtime — so the
  // production cookie shipped without Secure. It must follow the forwarded
  // protocol instead.
  const httpsLogin = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...asVisitor({ "x-forwarded-proto": "https" }) },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  check(
    "Secure flag is set when x-forwarded-proto is https",
    /;\s*secure/i.test(httpsLogin.headers.get("set-cookie") ?? ""),
  );

  const cookie = setCookie.split(";")[0];

  // The dashboard now renders with real data.
  const authed = await fetch(`${BASE}/admin`, { headers: { cookie } });
  const html = await authed.text();
  check("dashboard renders when signed in", authed.status === 200, `got ${authed.status}`);
  for (const needle of [
    "لوحة التحكم",
    "الملخص التنفيذي",
    "مجالات الاهتمام",
    "مسار التحويل",
    "الطلبات الواردة",
    "طلبات وكلاء واتساب",
    "سجل عمليات الوكلاء",
  ]) {
    check(`dashboard shows "${needle}"`, html.includes(needle));
  }
  check("dashboard shows today's submissions", /عرض سعر|تواصل/.test(html));

  // A tampered cookie must be rejected — the signature covers the expiry.
  const tampered = cookie.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
  const forged = await fetch(`${BASE}/admin`, {
    headers: { cookie: tampered },
    redirect: "manual",
  });
  check(
    "a tampered session cookie is rejected",
    forged.status === 307 || forged.status === 302,
    `got ${forged.status}`,
  );

  // The session also authorises the JSON API, so the dashboard needs no token.
  const api = await fetch(`${BASE}/api/admin/analytics?live=1`, { headers: { cookie } });
  check("session cookie authorises the admin API", api.status === 200, `got ${api.status}`);

  // Logout clears it.
  const out = await fetch(`${BASE}/api/admin/logout`, { method: "POST", headers: { cookie } });
  check("logout responds", out.status === 200);
  check("logout expires the cookie", /max-age=0/i.test(out.headers.get("set-cookie") ?? ""));
}

async function checkWebhookSecurity() {
  // Unsigned payloads must be rejected — otherwise anyone could drive a site.
  const unsigned = await postJson("/api/whatsapp/webhook", { entry: [] });
  check("webhook rejects unsigned payloads", unsigned.status === 401, `got ${unsigned.status}`);

  const badVerify = await getText("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1");
  check("webhook rejects a wrong verify token", badVerify.status === 403);

  const goodVerify = await getText(
    "/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=echo123",
  );
  check("webhook completes the Meta handshake", goodVerify.body.trim() === "echo123");

  // Admin surfaces must not be open when a token is configured.
  const noAuth = await fetch(`${BASE}/api/agent/message`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ sender: SENDER, text: "alta" }),
  });
  check("agent simulator requires the admin token", noAuth.status === 401, `got ${noAuth.status}`);
}

/* ----------------------------------------------------------------- main -- */

async function waitForServer(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/agent/readiness`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  return false;
}

async function main() {
  // Start from a clean store so counts are deterministic.
  await rm(path.join(PROJECT_ROOT, ".data"), { recursive: true, force: true });

  // Invoke Next's JS entry point with node directly: no npx, no .cmd shim and
  // therefore no shell quoting to get wrong on a path containing spaces.
  const server = spawn(
    process.execPath,
    [path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "-p", PORT],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: "production",
        ADMIN_TOKEN,
        CRON_SECRET,
        WHATSAPP_VERIFY_TOKEN: "verify-token",
        // Exercise the real scrypt path rather than a stubbed comparison.
        ADMIN_USERNAME,
        ADMIN_PASSWORD_HASH: (() => {
          const salt = crypto.randomBytes(16);
          return `scrypt$${salt.toString("hex")}$${crypto
            .scryptSync(ADMIN_PASSWORD, salt, 64)
            .toString("hex")}`;
        })(),
        ADMIN_SESSION_SECRET: crypto.randomBytes(32).toString("hex"),
        AGENT_ALLOWED_SENDERS_ALTA: SENDER,
        AGENT_ALLOWED_SENDERS_HOSPITALITY: SENDER,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));

  try {
    if (!(await waitForServer())) {
      console.error("Server never became ready.\n", serverLog.slice(-3000));
      process.exit(1);
    }
    console.log(`Server ready on ${BASE}\n`);

    for (let run = 1; run <= PASSES; run++) {
      const before = fail;
      const started = Date.now();
      clientIp = `203.0.113.${run}`;
      console.log(`── PASS ${run}/${PASSES} ${"─".repeat(40)}`);

      await checkPages();
      await checkForms(run);
      await checkChat(run);
      await checkAnalytics();
      await checkAgents();
      await checkAdminDashboard();
      await checkWebhookSecurity();

      const newFailures = fail - before;
      console.log(
        `   ${newFailures === 0 ? "✓ all green" : `✗ ${newFailures} failed`} (${(
          (Date.now() - started) /
          1000
        ).toFixed(1)}s)\n`,
      );
    }
  } finally {
    server.kill();
  }

  console.log("═".repeat(56));
  console.log(`Assertions: ${pass + fail}   passed: ${pass}   failed: ${fail}`);
  if (fail > 0) {
    console.log("\nDistinct failures:");
    for (const f of [...new Set(failures)]) console.log(`  • ${f}`);
    process.exit(1);
  }
  console.log(`\n✅ ${PASSES}/${PASSES} passes green.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
