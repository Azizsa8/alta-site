import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle, Pill } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { platforms, platformBySlug } from "@/content/platforms";
import { cta } from "@/content/site";

type Params = { params: Promise<{ platform: string }> };

export function generateStaticParams() {
  return platforms.map((p) => ({ platform: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { platform } = await params;
  const p = platformBySlug(platform);
  if (!p) return {};
  return {
    title: p.seo.title,
    description: p.seo.description,
    alternates: {
      canonical: `/services/ai-engineering/platforms/${p.slug}`,
    },
    openGraph: { title: p.seo.title, description: p.seo.description },
  };
}

export default async function PlatformPage({ params }: Params) {
  const { platform } = await params;
  const p = platformBySlug(platform);
  if (!p) notFound();

  const trail = [
    { name: "خدماتنا", href: "/services" },
    { name: "الذكاء الاصطناعي وتقنية المعلومات", href: "/services/ai-engineering" },
    { name: "برامجنا ومنصاتنا", href: "/services/ai-engineering/platforms" },
    { name: p.name, href: `/services/ai-engineering/platforms/${p.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd trail={trail} />

      <PageHero
        eyebrow={p.eyebrow}
        title={`${p.headline} ${p.headlineAccent}`}
        body={p.summary}
        trail={trail}
      />

      {/* ----------------------------------------------------- identity bar */}
      <Section tone="paper">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl border b-gold bg-surface-panel p-7">
          <div>
            <p className="font-display text-[20px] font-bold tracking-[0.22em] text-primary">
              {p.name}
            </p>
            <p className="mt-1.5 text-[13px] text-text-muted">{p.nameAr}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border b-soft px-4 py-2 text-[12px] text-text-muted">
              القطاع: {p.sector}
            </span>
            <span className="rounded-full border b-gold bg-primary/10 px-4 py-2 text-[12px] text-primary">
              {p.status}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {p.metrics.map((m) => (
            <div key={m.label} className="rounded-lg border b-soft bg-surface-panel p-5">
              <p className="tnum font-display text-[28px] font-bold leading-none text-primary">
                {m.value}
              </p>
              <p className="mt-2.5 text-[12px] leading-snug text-text-muted">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- agents */}
      <Section tone="paper-dim" rule>
        <SectionTitle
          eyebrow="AI AGENTS"
          title="الوكلاء الأذكياء"
          body="مجموعة من وكلاء الذكاء الاصطناعي يعملون من أجلك على مدار الساعة."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {p.agents.map((a) => (
            <FeatureCard key={a.title} title={a.title} body={a.body} />
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- dashboard */}
      <Section tone="midnight-deep" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Pill onDark>لوحة تحكم ذكية</Pill>
            <h2 className="mt-5 font-display text-[26px] font-bold leading-tight text-text-primary md:text-[34px]">
              كل ما تحتاجه في <span className="text-primary">لوحة واحدة</span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.9] text-text-muted">
              راقب الأداء، الإشغال، الإيرادات، الشكاوى، رضا النزلاء، والكثير من
              البيانات لحظياً مع توصيات ذكية لتحسين التشغيل وزيادة الأرباح.
            </p>
            <div className="mt-7 rounded-lg border b-gold bg-primary/5 p-5">
              <p className="mb-2 text-[12px] font-bold text-primary">
                توصيات الذكاء الاصطناعي
              </p>
              <p className="text-[13px] leading-[1.85] text-text-muted">
                زيادة طاقم الاستقبال وقت الذروة وتحسين عرض الغرف الأعلى طلباً.
              </p>
            </div>
          </div>

          {/* Illustrative dashboard, clearly labelled as sample data. */}
          <div className="rounded-xl border b-soft bg-surface-panel p-6 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-text-primary">
                لوحة التشغيل
              </span>
              <span className="rounded-full border b-soft px-2.5 py-1 text-[10.5px] text-text-muted">
                بيانات توضيحية
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {p.dashboard.map((d) => (
                <div key={d.label} className="rounded-lg border b-soft bg-surface p-4">
                  <p className="text-[11px] text-text-muted">{d.label}</p>
                  <p className="tnum mt-1.5 font-display text-[20px] font-bold text-text-primary">
                    {d.value}
                  </p>
                  {d.delta && (
                    <p
                      className={`tnum mt-1 text-[11px] ${
                        d.delta.startsWith("-") ? "text-success" : "text-primary"
                      }`}
                    >
                      {d.delta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------------- why */}
      <Section tone="paper">
        <SectionTitle eyebrow="WHY" title={`لماذا ${p.name}؟`} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {p.why.map((w) => (
            <FeatureCard key={w.title} title={w.title} body={w.body} />
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------- integrations */}
      <Section tone="paper-dim" rule>
        <SectionTitle
          eyebrow="INTEGRATIONS"
          title="تكاملات ومميزات متكاملة"
          body="بنية تقنية مرنة وآمنة تتكامل مع أنظمة الفندق الحالية."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.integrations.map((i) => (
            <div
              key={i.title}
              className="rounded-lg border b-soft bg-surface-panel p-5 transition-colors hover:border-[color:var(--color-primary-container)]"
            >
              <span className="mb-3 grid size-9 place-items-center rounded-md border b-gold bg-primary/10 text-primary">
                <Icon name="spark" className="size-4" />
              </span>
              <p className="text-[13.5px] font-bold text-text-primary">{i.title}</p>
              <p className="mt-1.5 text-[12px] text-text-muted">{i.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------------- CTA */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-3xl font-display text-[26px] font-bold leading-tight text-text-primary md:text-[34px]">
            {p.cta.title}
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            {p.cta.body}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={`/request-quote?service=ai-engineering`} size="lg" withArrow>
              {p.cta.button}
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              {cta.talkToTeam}
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
