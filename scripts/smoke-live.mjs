#!/usr/bin/env node
/**
 * Post-deploy smoke test against the live site.
 *
 *   node scripts/smoke-live.mjs https://iridescent-nougat-9d80f9.netlify.app
 *
 * Deliberately separate from verify.mjs: this one must NOT write anything to
 * production. It only reads, plus one deliberately-invalid form POST to prove
 * the API route is actually running rather than 404ing as a static file.
 *
 * That last check matters more than it looks. A Netlify Next deploy can go
 * green while publishing .next as raw static files — every page 200s and every
 * API route silently 404s. A page-only smoke test would call that a success.
 */

const BASE = (process.argv[2] ?? "").replace(/\/$/, "");
if (!BASE) {
  console.error("Usage: node scripts/smoke-live.mjs <https://site-url>");
  process.exit(1);
}

let pass = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const PAGES = [
  ["/", "حلول متكاملة"],
  ["/about", "من نحن"],
  ["/services", "خدماتنا"],
  ["/services/ai-engineering", "ذكاء اصطناعي مصمم"],
  ["/services/facilities-management", "مرافق أكثر جاهزية"],
  ["/services/hospitality-catering", "تجربة ضيافة منظمة"],
  ["/services/management-consulting", "منشأة أكثر وضوح"],
  ["/services/procurement-supplies", "توريد موثوق"],
  ["/services/media-social", "حضور مؤسسي"],
  ["/services/events-exhibitions", "تجارب متكاملة"],
  ["/services/research-surveys", "بيانات موثوقة"],
  ["/sectors", "القطاعات التي نخدمها"],
  ["/projects", "ALTA Hospitality"],
  ["/media-center", "المركز الإعلامي"],
  ["/careers", "نبحث عن أشخاص"],
  ["/faq", "الأسئلة الشائعة"],
  ["/contact", "نموذج التواصل"],
  ["/request-quote", "نموذج طلب عرض السعر"],
  ["/privacy-policy", "سياسة الخصوصية"],
  ["/terms", "الشروط والأحكام"],
  ["/sitemap.xml", "/services/ai-engineering"],
  ["/robots.txt", "Sitemap"],
];

const run = async () => {
  console.log(`\nSmoke testing ${BASE}\n`);

  console.log("Pages");
  for (const [path, needle] of PAGES) {
    try {
      const res = await fetch(BASE + path);
      const body = await res.text();
      check(`${path} → 200 and renders`, res.status === 200 && body.includes(needle), `status ${res.status}`);
    } catch (e) {
      check(`${path} reachable`, false, String(e.message ?? e));
    }
  }

  console.log("\nBrand + document");
  const home = await (await fetch(BASE + "/")).text();
  check("RTL Arabic document", home.includes('dir="rtl"') && home.includes('lang="ar"'));
  check("approved transparent mark served", home.includes("alta-mark"));
  check("ALTA Hospitality featured", home.includes("ALTA Hospitality AI"));
  check(
    "no unverified statistics",
    !/\+?500\s*موظف|\+?200\s*مشروع|20\+?\s*عام/.test(home),
  );

  console.log("\nServerless functions are actually running");
  // A green deploy that published .next statically would 404 here.
  const readiness = await fetch(BASE + "/api/agent/readiness");
  const readyJson = await readiness.json().catch(() => null);
  check("/api/agent/readiness responds", readiness.status === 200, `status ${readiness.status}`);
  check("readiness reports registered agents", (readyJson?.sites?.length ?? 0) === 2);
  check("storage backend is Netlify Blobs", readyJson?.checks?.storage?.backend === "blobs");

  const badForm = await fetch(BASE + "/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  check("contact API validates (400, not 404)", badForm.status === 400, `status ${badForm.status}`);

  console.log("\nSecurity");
  const admin = await fetch(BASE + "/admin", { redirect: "manual" });
  check("/admin requires login", [301, 302, 307, 308].includes(admin.status), `status ${admin.status}`);

  const adminApi = await fetch(BASE + "/api/admin/analytics");
  check("admin API refuses anonymous", adminApi.status === 401, `status ${adminApi.status}`);

  const login = await fetch(BASE + "/admin/login");
  check("/admin/login renders", login.status === 200, `status ${login.status}`);

  const hook = await fetch(BASE + "/api/whatsapp/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entry: [] }),
  });
  check("WhatsApp webhook rejects unsigned", hook.status === 401, `status ${hook.status}`);

  const cron = await fetch(BASE + "/api/analytics/run", { method: "POST" });
  check("analytics job refuses without secret", cron.status === 401, `status ${cron.status}`);

  console.log("\n" + "=".repeat(52));
  console.log(`passed: ${pass}   failed: ${failures.length}`);
  if (failures.length) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log("  • " + f));
    process.exit(1);
  }
  console.log("\nLive site healthy.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
