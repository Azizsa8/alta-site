#!/usr/bin/env node
/**
 * Backend stress test.
 *
 *   node scripts/stress.mjs <base-url> [admin-token] [cron-secret]
 *
 * Measures behaviour under concurrency, which single-request verification
 * cannot: whether the one-key-per-event store loses writes when many visitors
 * submit at once, whether the rate limiter actually engages, whether latency
 * degrades, and whether anything 5xx's rather than degrading cleanly.
 */

const BASE = (process.argv[2] ?? "").replace(/\/$/, "");
const ADMIN = process.argv[3] ?? process.env.ADMIN_TOKEN ?? "";
const CRON = process.argv[4] ?? process.env.CRON_SECRET ?? "";
if (!BASE) {
  console.error("Usage: node scripts/stress.mjs <base-url> [admin-token] [cron-secret]");
  process.exit(1);
}

const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : 0;
};
async function timed(fn) {
  const t0 = Date.now();
  try {
    const status = await fn();
    return { ms: Date.now() - t0, status };
  } catch {
    return { ms: Date.now() - t0, status: 0 };
  }
}

/** Distinct forwarded IP per virtual user, so we measure the app not the limiter. */
function headers(user, extra = {}) {
  return {
    "content-type": "application/json",
    "x-forwarded-for": `198.51.100.${(user % 250) + 1}`,
    ...extra,
  };
}

function report(name, results, expectStatus) {
  const ms = results.map((r) => r.ms);
  const ok = results.filter((r) => expectStatus.includes(r.status)).length;
  const server5xx = results.filter((r) => r.status >= 500).length;
  const throttled = results.filter((r) => r.status === 429).length;
  console.log(
    `${name.padEnd(30)} n=${String(results.length).padStart(3)}  ok=${String(ok).padStart(3)}  ` +
      `429=${String(throttled).padStart(3)}  5xx=${String(server5xx).padStart(2)}  ` +
      `p50=${String(pct(ms, 50)).padStart(5)}ms  p95=${String(pct(ms, 95)).padStart(5)}ms  max=${String(Math.max(...ms)).padStart(5)}ms`,
  );
  return { ok, server5xx, throttled, n: results.length };
}

const failures = [];
const expect = (cond, msg) => {
  if (!cond) failures.push(msg);
};

async function run() {
  console.log(`\nStress testing ${BASE}\n${"=".repeat(96)}`);

  /* 1. Static + SSR pages under concurrent load. */
  const pages = ["/", "/services", "/services/ai-engineering", "/projects", "/contact"];
  const pageRuns = await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      timed(async () => (await fetch(`${BASE}${pages[i % pages.length]}`)).status),
    ),
  );
  const p = report("pages x60 concurrent", pageRuns, [200]);
  expect(p.server5xx === 0, "pages returned 5xx under load");
  expect(p.ok === p.n, "not all page requests returned 200");

  /* 2. Contact form: 40 concurrent DISTINCT submissions.
        This is the write-integrity test — one blob key per event means none
        of these may overwrite each other. */
  const stamp = Date.now().toString(36);
  const formRuns = await Promise.all(
    Array.from({ length: 40 }, (_, i) =>
      timed(async () =>
        (
          await fetch(`${BASE}/api/contact`, {
            method: "POST",
            headers: headers(i),
            body: JSON.stringify({
              fullName: `ضغط ${stamp}-${i}`,
              organisation: "stress",
              phone: "0512345678",
              email: `s${i}@example.com`,
              subject: "ai-engineering",
              message: `اختبار ضغط رقم ${i} لخدمات الذكاء الاصطناعي والتوريدات.`,
              consent: true,
              elapsedMs: 30000 + i,
              path: "/contact",
            }),
          })
        ).status,
      ),
    ),
  );
  const f = report("contact x40 concurrent", formRuns, [200]);
  expect(f.server5xx === 0, "contact form returned 5xx under load");

  /* 3. Chat under concurrency, mixed clean and messy Arabic. */
  const msgs = [
    "ما خدماتكم في الذكاء الاصطناعي؟",
    "السلام عليكم",
    "انا اسمي عبدالعزيز",
    "وش خدماتكم في الصيانه",
    "هل تخدمون المستشفيات؟",
    "كيف اطلب عرض سعر",
  ];
  const chatRuns = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      timed(async () =>
        (
          await fetch(`${BASE}/api/chat`, {
            method: "POST",
            headers: headers(i),
            body: JSON.stringify({ message: msgs[i % msgs.length], sessionId: `stress-${stamp}-${i}` }),
          })
        ).status,
      ),
    ),
  );
  const c = report("chat x30 concurrent", chatRuns, [200]);
  expect(c.server5xx === 0, "chat returned 5xx under load");
  expect(c.ok >= 25, "chat failed too many requests under load");

  /* 4. Rate limiter must actually engage for a SINGLE abusive client. */
  const abusive = await Promise.all(
    Array.from({ length: 30 }, () =>
      timed(async () =>
        (
          await fetch(`${BASE}/api/quote`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.99" },
            body: JSON.stringify({}),
          })
        ).status,
      ),
    ),
  );
  const a = report("quote x30 one abusive IP", abusive, [400, 429]);
  expect(a.throttled > 0, "rate limiter never engaged for a single abusive client");
  expect(a.server5xx === 0, "abusive traffic caused 5xx");

  /* 5. Admin surfaces stay closed under load. */
  const authz = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      timed(async () =>
        (
          await fetch(`${BASE}${i % 2 ? "/api/admin/analytics" : "/api/agent/message"}`, {
            method: i % 2 ? "GET" : "POST",
            headers: headers(i),
            body: i % 2 ? undefined : JSON.stringify({ sender: "966500000000", text: "alta" }),
          })
        ).status,
      ),
    ),
  );
  const z = report("admin x20 unauthenticated", authz, [401]);
  expect(z.ok === z.n, "an admin endpoint answered without credentials under load");

  /* 6. Write integrity: did every concurrent submission survive? */
  if (ADMIN) {
    await new Promise((r) => setTimeout(r, 3000));
    const live = await (
      await fetch(`${BASE}/api/admin/analytics?live=1`, {
        headers: { authorization: `Bearer ${ADMIN}` },
      })
    ).json();
    const forms = live?.metrics?.totals?.formSubmissions ?? 0;
    console.log(`\nform submissions recorded today: ${forms} (this run wrote 40)`);
    expect(forms >= 40, `expected >=40 recorded submissions, saw ${forms} — concurrent writes were lost`);

    const events = live?.eventCount ?? 0;
    console.log(`total events recorded today:      ${events}`);
    expect(events >= 70, `expected >=70 events, saw ${events} — events were dropped`);
  } else {
    console.log("\n(skipped write-integrity check — no admin token supplied)");
  }

  /* 7. The daily analysis job under real data volume. */
  if (CRON) {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/analytics/run`, {
      method: "POST",
      headers: { "x-cron-secret": CRON },
    });
    const body = await res.json();
    console.log(
      `\ndaily analysis: HTTP ${res.status} in ${Date.now() - t0}ms | degraded=${body?.report?.degraded} ${body?.report?.degradedReason ?? ""}`,
    );
    expect(res.status === 200, "daily analysis job failed under load");
    expect(Date.now() - t0 < 60000, "daily analysis exceeded the 60s function budget");
  }

  console.log("\n" + "=".repeat(96));
  if (failures.length) {
    console.log(`STRESS TEST FAILED (${failures.length})`);
    failures.forEach((x) => console.log("  • " + x));
    process.exit(1);
  }
  console.log("STRESS TEST PASSED — no 5xx, no lost writes, limiter engaged, admin stayed closed.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
