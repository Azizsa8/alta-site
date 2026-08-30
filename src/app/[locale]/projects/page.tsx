import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle, Pill } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { ProjectGallery } from "@/components/ui/ProjectGallery";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { projects } from "@/content/pages";
import { serviceSectors } from "@/content/serviceSectors";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: projects.seo.title,
  description: projects.seo.description,
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const p = projects.featured;

  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "مشاريعنا", href: "/projects" }]} />
      <PageHero
        eyebrow={projects.titleEn}
        title={projects.title}
        body={projects.intro}
        trail={[{ name: "مشاريعنا", href: "/projects" }]}
      />

      {/* ------------------------------------- FEATURED: ALTA HOSPITALITY AI */}
      <Section id="alta-hospitality" tone="paper" className="scroll-mt-24">
        <div className="overflow-hidden rounded-xl border b-gold">
          <div className="relative overflow-hidden bg-surface p-8 md:p-12">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="relative">
              <Pill onDark>{p.eyebrow}</Pill>
              <p className="mt-5 font-display text-[15px] font-bold tracking-[0.24em] text-primary">
                {p.name}
              </p>
              <p className="mt-1.5 text-[12.5px] text-text-muted">{p.nameAr}</p>
              <h2 className="mt-3 max-w-3xl font-display text-[26px] font-extrabold leading-tight text-text-primary md:text-[38px]">
                {p.headline}
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-[1.9] text-text-muted">
                {p.summary}
              </p>

              <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {p.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg border b-soft bg-surface-panel p-4"
                  >
                    <p className="tnum font-display text-[26px] font-bold leading-none text-primary">
                      {m.value}
                    </p>
                    <p className="mt-2 text-[11.5px] leading-snug text-text-muted">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project card fields, in the order the approved document specifies. */}
          <div className="grid gap-px bg-[color:var(--stroke-ink)] md:grid-cols-2">
            {[
              { label: "التصنيف", body: p.category },
              { label: "التحدي", body: p.challenge },
              { label: "نطاق العمل", body: p.scope },
              { label: "منهج التنفيذ", body: p.approach },
              { label: "النتيجة", body: p.result },
              {
                label: "المدة والموقع",
                body: "المملكة العربية السعودية — تفاصيل المدة تُضاف بعد اعتماد بيانات النشر.",
              },
            ].map((row) => (
              <div key={row.label} className="bg-paper p-6 md:p-8">
                <h3 className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-gold-ink">
                  {row.label}
                </h3>
                <p className="text-[13.5px] leading-[1.9] text-ink-muted">{row.body}</p>
              </div>
            ))}
          </div>
        </div>

        <h3 className="mb-6 mt-12 font-display text-[20px] font-bold text-ink">
          الوكلاء الأذكياء داخل المنصة
        </h3>
        <div className="card-row">
          {p.agents.map((a) => (
            <FeatureCard key={a.title} title={a.title} body={a.body} />
          ))}
        </div>

        <h3 className="mb-6 mt-12 font-display text-[20px] font-bold text-ink">
          التكاملات والمميزات
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.integrations.map((i) => (
            <div key={i.title} className="rounded-lg border b-ink bg-paper-dim p-5">
              <p className="text-[13.5px] font-bold text-ink">{i.title}</p>
              <p className="mt-1.5 text-[12px] text-ink-muted">{i.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- CATEGORIES */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative">
          <SectionTitle eyebrow="CATEGORIES" title="تصنيفات المشاريع" onDark />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.categories.map((c, i) => (
              <li
                key={c}
                className="flex items-start gap-3.5 rounded-lg border b-soft bg-surface-panel p-5"
              >
                <span className="tnum font-display text-[16px] font-bold leading-tight text-primary-container">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13.5px] leading-[1.8] text-text-muted">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ------------------------------------------------------- PORTFOLIO */}
      {/* Reinstated 2026-08-29, restructured by sector instead of raw
          activity — see the long comment on `projects.portfolio` in
          pages.ts for why this was removed in 2026-08-10 and what changed.
          Names only, same as before: no invented challenge/scope/result copy
          per project without the client supplying it. */}
      <Section tone="paper">
        <SectionTitle
          eyebrow="TRACK RECORD"
          title="سابقة الأعمال حسب القطاعات"
          body="مشاريع منفذة، مصنفة ضمن قطاعاتنا الخمسة."
        />
        <div className="mt-12 space-y-12">
          {serviceSectors.map((sector) => {
            const activities = projects.portfolio.filter(
              (p) => p.sectorId === sector.id,
            );
            if (activities.length === 0) return null;

            return (
              <div key={sector.id} id={sector.id} className="scroll-mt-24">
                <h3 className="font-display text-[18px] font-bold text-ink md:text-[22px]">
                  {sector.title}
                </h3>
                <div className="mt-6 card-row">
                  {activities.flatMap((activity) =>
                    activity.groups.map((group, i) => (
                      <div
                        key={`${activity.title}-${group.title || i}`}
                        className="rounded-lg border b-ink bg-paper p-5"
                      >
                        <h4 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-gold-ink">
                          {group.title || activity.title}
                        </h4>
                        <ul className="space-y-2">
                          {group.items.map((item) => (
                            <li
                              key={item}
                              className="text-[13px] leading-[1.8] text-ink-muted"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------ DOCUMENTED WORK */}
      <Section tone="paper-dim" rule>
        <SectionTitle
          eyebrow="FROM THE FIELD"
          title="من أرض الواقع"
          body="لقطات من مواقع التنفيذ والفعاليات، مصوّرة أثناء العمل."
        />
        <div className="mt-12">
          <ProjectGallery items={projects.gallery} />
        </div>
      </Section>

      <Section tone="paper-dim" rule>
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-ink md:text-[32px]">
            هل لديك مشروع مشابه؟
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-ink-muted">
            نبدأ بفهم احتياجك وتحديد نطاق واضح، ثم نقدم تصوراً فنياً ومالياً مناسباً.
          </p>
          <Button href="/request-quote" size="lg" withArrow>
            {cta.requestQuote}
          </Button>
        </div>
      </Section>
    </>
  );
}
