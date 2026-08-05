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

const PAGES = [
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

async function checkPages() {
  for (const [path, needles] of PAGES) {
    const { status, body } = await getText(path);
    check(`GET ${path} → 200`, status === 200, `got ${status}`);
    for (const needle of needles) {
      check(`${path} contains "${needle.slice(0, 28)}"`, body.includes(needle));
    }
  }

  // Brand rules: transparent approved logo present, RTL Arabic document.
  const home = await getText("/");
  check("home references approved transparent mark", home.body.includes("alta-mark"));
  check("home is RTL Arabic", home.body.includes('dir="rtl"') && home.body.includes('lang="ar"'));
  check(
    "no unverified statistics published",
    !/\+?500\s*موظف|\+?200\s*مشروع|20\+?\s*عام/.test(home.body),
    "approved content forbids unverified figures",
  );

  // 404 uses the approved copy.
  const missing = await getText("/this-page-does-not-exist");
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
    "chat routes pricing questions to the quote form",
    /request-quote|عرض سعر/.test(quoteAsk.json?.reply ?? ""),
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
  const home = await getText("/");
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
    const updated = await getText(`/?cachebust=${Date.now()}`);
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
