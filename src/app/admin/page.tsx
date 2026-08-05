import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  readSession,
  isLoginConfigured,
  isProductionRuntime,
} from "@/lib/adminAuth";
import {
  readReport,
  listReportDays,
  readEvents,
  computeMetrics,
  riyadhDay,
  previousDay,
} from "@/lib/analytics";
import { listSubmissions } from "@/lib/submissions";
import { listProposals, readAudit } from "@/lib/agents/proposals";
import { readSettings } from "@/lib/settings";
import { backendName } from "@/lib/store";
import { LogoutButton } from "./LogoutButton";
import { company } from "@/content/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة التحكم | شركة التا للاستثمار",
  robots: { index: false, follow: false },
};

/* ------------------------------------------------------------ fragments -- */

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border b-soft bg-surface-panel p-5">
      <p className="tnum font-display text-[30px] font-bold leading-none text-primary">
        {value}
      </p>
      <p className="mt-2.5 text-[12.5px] font-semibold text-text-primary">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="rounded-xl border b-soft bg-surface-panel p-6">
      <h2 className="mb-5 text-[15px] font-bold text-text-primary">{title}</h2>
      {empty ? (
        <p className="text-[13px] text-text-muted">لا توجد بيانات لهذا اليوم.</p>
      ) : (
        children
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- page -- */

type Props = { searchParams: Promise<{ day?: string }> };

export default async function AdminDashboard({ searchParams }: Props) {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);

  // Fail closed: if login is configured, a valid session is mandatory. If it
  // is NOT configured, only local development may pass (never Netlify).
  if (isLoginConfigured()) {
    if (!session) redirect("/admin/login");
  } else if (isProductionRuntime()) {
    redirect("/admin/login");
  }

  const { day: dayParam } = await searchParams;
  const today = riyadhDay();
  const day = dayParam ?? previousDay(today);
  const isToday = day === today;

  // Read straight from the store — this is a server component, so going out
  // through the HTTP API would only add a round-trip and an auth dance.
  const [report, days, settings, proposals] = await Promise.all([
    readReport(day),
    listReportDays(),
    readSettings(),
    listProposals(),
  ]);

  // For today there is no report yet (the job runs at 08:00 for the previous
  // day), so compute the numbers live instead of showing an empty page.
  const liveEvents = isToday || !report ? await readEvents(day) : [];
  const metrics = report ?? computeMetrics(day, liveEvents);

  const [contactSubs, quoteSubs, audit] = await Promise.all([
    listSubmissions("contact", day),
    listSubmissions("quote", day),
    readAudit(day),
  ]);

  const maxInterest = Math.max(1, ...metrics.interests.map((i) => i.score));
  const pending = proposals.filter((p) => p.status === "pending");

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <div className="alta-container py-10">
        {/* ------------------------------------------------------- header */}
        <header className="flex flex-wrap items-start justify-between gap-4 rule-soft pb-6">
          <div>
            <p className="font-display text-[13px] font-bold tracking-[0.28em] text-primary">
              {company.mark}
            </p>
            <h1 className="mt-2 font-display text-[26px] font-bold">لوحة التحكم</h1>
            <p className="mt-1.5 text-[12.5px] text-text-muted">
              تحليل سلوك الزوار · التخزين: {backendName()} · إعدادات الموقع: r
              {settings.revision}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md border b-soft px-4 py-2.5 text-[13px] text-text-muted hover:text-primary"
            >
              عرض الموقع
            </Link>
            {session && <LogoutButton />}
          </div>
        </header>

        {/* --------------------------------------------------- day picker */}
        <nav aria-label="اختيار اليوم" className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-text-muted">اليوم:</span>
          {[today, ...days.filter((d) => d !== today)].slice(0, 8).map((d) => (
            <Link
              key={d}
              href={`/admin?day=${d}`}
              className={`tnum rounded-full border px-3.5 py-1.5 text-[12px] ${
                d === day
                  ? "border-[color:var(--color-primary-container)] bg-primary/15 text-primary"
                  : "b-soft text-text-muted hover:text-primary"
              }`}
              dir="ltr"
            >
              {d}
              {d === today ? " (اليوم)" : ""}
            </Link>
          ))}
        </nav>

        {/* ------------------------------------------------------ summary */}
        <section className="mt-6 rounded-xl border b-gold bg-surface-panel p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-[15px] font-bold">الملخص التنفيذي</h2>
            {!report && (
              <span className="rounded-full border b-soft px-3 py-1 text-[11px] text-text-muted">
                محسوب لحظياً — لم يصدر تقرير 08:00 لهذا اليوم بعد
              </span>
            )}
            {report?.degraded && (
              <span className="rounded-full border border-[color:var(--color-info)] px-3 py-1 text-[11px] text-info">
                تحليل رقمي فقط ({report.degradedReason})
              </span>
            )}
            {report?.model && (
              <span className="rounded-full border b-soft px-3 py-1 text-[11px] text-text-muted">
                {report.model}
              </span>
            )}
          </div>
          <p className="text-[14px] leading-[1.9] text-text-muted">
            {report?.summary ??
              `أحداث اليوم حتى الآن: ${metrics.totals.events}. يصدر التقرير التحليلي الكامل الساعة 08:00 بتوقيت الرياض.`}
          </p>

          {report && report.recommendations.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-[13px] font-bold text-primary">أبرز الملاحظات</h3>
                <ul className="space-y-2">
                  {report.highlights.map((h) => (
                    <li key={h} className="text-[13px] leading-[1.8] text-text-muted">
                      • {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-[13px] font-bold text-primary">التوصيات</h3>
                <ul className="space-y-2">
                  {report.recommendations.map((r) => (
                    <li key={r} className="text-[13px] leading-[1.8] text-text-muted">
                      – {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- totals */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="طلبات عروض الأسعار" value={String(metrics.totals.quoteRequests)} />
          <Stat label="رسائل التواصل" value={String(metrics.totals.contactMessages)} />
          <Stat
            label="رسائل المساعد الذكي"
            value={String(metrics.totals.chatMessages)}
            hint={`${metrics.totals.chatSessions} جلسة`}
          />
          <Stat
            label="مؤشر الرضا"
            value={
              metrics.satisfaction.index === null
                ? "—"
                : metrics.satisfaction.index.toFixed(2)
            }
            hint={`${metrics.satisfaction.explicitPositive} إيجابي / ${metrics.satisfaction.explicitNegative} سلبي`}
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* --------------------------------------------------- interests */}
          <Panel title="مجالات الاهتمام" empty={metrics.interests.length === 0}>
            <ul className="space-y-3.5">
              {metrics.interests.map((i) => (
                <li key={i.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-text-primary">{i.label}</span>
                    <span className="tnum text-[12px] text-text-muted">{i.score}</span>
                  </div>
                  {/* Bar width is a share of the top score, not a percentage of
                      anything — the scale is ordinal, so it is labelled by rank. */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-lowest">
                    <div
                      className="h-full rounded-full bg-primary-container"
                      style={{ width: `${Math.round((i.score / maxInterest) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {/* ------------------------------------------------------ funnel */}
          <Panel title="مسار التحويل وجودة النماذج">
            <dl className="space-y-4 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">جلسات المحادثة</dt>
                <dd className="tnum font-bold">{metrics.funnel.chatSessions}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">جلسات وصلت إلى نموذج</dt>
                <dd className="tnum font-bold">{metrics.funnel.sessionsReachingForm}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">نسبة التحول</dt>
                <dd className="tnum font-bold text-primary">
                  {metrics.funnel.conversionRate === null
                    ? "—"
                    : `${(metrics.funnel.conversionRate * 100).toFixed(0)}%`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 rule-soft pt-4">
                <dt className="text-text-muted">وسيط زمن تعبئة النموذج</dt>
                <dd className="tnum font-bold">
                  {metrics.formQuality.medianCompletionSeconds === null
                    ? "—"
                    : `${metrics.formQuality.medianCompletionSeconds}ث`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">محاولات إرسال فاشلة (تحقق)</dt>
                <dd className="tnum font-bold">
                  {metrics.formQuality.abandonedValidationCount}
                </dd>
              </div>
            </dl>
          </Panel>

          {/* ------------------------------------------------- top queries */}
          <Panel title="أسئلة الزوار" empty={metrics.topQuestions.length === 0}>
            <ul className="space-y-2.5">
              {metrics.topQuestions.slice(0, 12).map((q, i) => (
                <li
                  key={`${q}-${i}`}
                  className="rounded-md border b-soft bg-surface px-3.5 py-2.5 text-[12.5px] leading-[1.7] text-text-muted"
                >
                  {q}
                </li>
              ))}
            </ul>
          </Panel>

          {/* ---------------------------------------------------- top paths */}
          <Panel title="أكثر الصفحات تفاعلاً" empty={metrics.topPaths.length === 0}>
            <ul className="space-y-2.5">
              {metrics.topPaths.map((p) => (
                <li
                  key={p.path}
                  className="flex items-center justify-between gap-3 text-[13px]"
                >
                  <span dir="ltr" className="truncate text-text-muted">
                    {p.path || "/"}
                  </span>
                  <span className="tnum font-bold">{p.count}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* -------------------------------------------------- submissions */}
        <section className="mt-6 rounded-xl border b-soft bg-surface-panel p-6">
          <h2 className="mb-5 text-[15px] font-bold">
            الطلبات الواردة ({contactSubs.length + quoteSubs.length})
          </h2>
          {contactSubs.length + quoteSubs.length === 0 ? (
            <p className="text-[13px] text-text-muted">لا توجد طلبات لهذا اليوم.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-start text-[12.5px]">
                <thead>
                  <tr className="text-text-muted">
                    <th className="pb-3 text-start font-semibold">النوع</th>
                    <th className="pb-3 text-start font-semibold">الاسم</th>
                    <th className="pb-3 text-start font-semibold">المنشأة</th>
                    <th className="pb-3 text-start font-semibold">الجوال</th>
                    <th className="pb-3 text-start font-semibold">الموضوع / الخدمة</th>
                    <th className="pb-3 text-start font-semibold">الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {[...quoteSubs, ...contactSubs].map((s) => (
                    <tr key={s.id} className="rule-soft">
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] ${
                            s.kind === "quote"
                              ? "bg-primary/15 text-primary"
                              : "bg-white/5 text-text-muted"
                          }`}
                        >
                          {s.kind === "quote" ? "عرض سعر" : "تواصل"}
                        </span>
                      </td>
                      <td className="py-3">{String(s.data.fullName ?? "—")}</td>
                      <td className="py-3 text-text-muted">
                        {String(s.data.organisation || "—")}
                      </td>
                      <td className="py-3 text-text-muted" dir="ltr">
                        {String(s.data.phone ?? "—")}
                      </td>
                      <td className="py-3 text-text-muted">
                        {String(s.data.service || s.data.subject || "—")}
                      </td>
                      <td className="tnum py-3 text-text-muted" dir="ltr">
                        {s.at.slice(11, 16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- agents */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Panel title={`طلبات وكلاء واتساب المعلّقة (${pending.length})`} empty={pending.length === 0}>
            <ul className="space-y-3">
              {pending.map((p) => (
                <li key={p.id} className="rounded-md border b-gold bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-display text-[13px] font-bold text-primary" dir="ltr">
                      {p.id}
                    </span>
                    <span className="text-[11px] text-text-muted">{p.siteId}</span>
                  </div>
                  <p className="whitespace-pre-line text-[12.5px] leading-[1.8] text-text-muted">
                    {p.summary}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="سجل عمليات الوكلاء" empty={audit.length === 0}>
            <ul className="space-y-2.5">
              {audit.slice(-14).reverse().map((a, i) => (
                <li
                  key={String(a.id ?? i)}
                  className="flex items-center justify-between gap-3 text-[12.5px]"
                >
                  <span className="text-text-muted">
                    <span className="text-text-primary">{String(a.action)}</span>
                    {a.detail ? ` — ${String(a.detail)}` : ""}
                  </span>
                  <span className="tnum shrink-0 text-[11px] text-text-muted" dir="ltr">
                    {String(a.at).slice(11, 16)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <p className="mt-8 text-center text-[11.5px] text-text-muted">
          يصدر التقرير التحليلي تلقائياً كل يوم الساعة 08:00 بتوقيت الرياض.
        </p>
      </div>
    </div>
  );
}
