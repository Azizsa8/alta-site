import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard, StepCard, TickList } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { about } from "@/content/pages";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: about.seo.title,
  description: about.seo.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "من نحن", href: "/about" }]} />
      <PageHero
        eyebrow={about.titleEn}
        title={about.title}
        body={about.lead[0]}
        trail={[{ name: "من نحن", href: "/about" }]}
      />

      {/* ----------------------------------------------- INTRO + IDENTITY */}
      <Section tone="paper">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border b-ink">
            <Image
              src="/about_office.webp"
              alt="بيئة عمل شركة التا للاستثمار"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <SectionTitle eyebrow="WHO WE ARE" title="نبذة عن الشركة" align="start" />
            <p className="mt-6 text-[15px] leading-[1.9] text-ink-muted">
              {about.lead[1]}
            </p>
            <div className="mt-8 rounded-lg border b-gold bg-primary/5 p-6">
              <Icon name="quote" className="mb-3 size-6 text-gold-ink" strokeWidth={0} />
              <h2 className="mb-3 text-[15px] font-bold text-ink">
                {about.leadership.title}
              </h2>
              <p className="text-[13.5px] leading-[1.9] text-ink-muted">
                {about.leadership.body}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ VISION + MISSION */}
      <Section id="vision" tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border b-gold bg-surface-panel p-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              VISION
            </p>
            <h2 className="mb-4 font-display text-[22px] font-bold leading-snug text-text-primary md:text-[26px]">
              {about.vision.headline}
            </h2>
            <p className="text-[14px] leading-[1.9] text-text-muted">
              {about.vision.body}
            </p>
          </div>
          <div className="rounded-xl border b-soft bg-surface-panel p-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              MISSION
            </p>
            <h2 className="mb-4 font-display text-[22px] font-bold leading-snug text-text-primary md:text-[26px]">
              {about.mission.title}
            </h2>
            <p className="text-[14px] leading-[1.9] text-text-muted">
              {about.mission.body}
            </p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ VALUES */}
      <Section id="values" tone="paper">
        <SectionTitle eyebrow="OUR VALUES" title="قيمنا" />
        <div className="mt-12 card-row">
          {about.values.map((v) => (
            <FeatureCard key={v.title} title={v.title} body={v.body} />
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------- GOALS */}
      <Section tone="paper-dim" rule>
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionTitle eyebrow="OUR GOALS" title="أهدافنا" align="start" />
          <TickList items={about.goals} columns={2} />
        </div>
      </Section>

      {/* ------------------------------------------------------- METHODOLOGY */}
      <Section id="methodology" tone="paper">
        <SectionTitle
          eyebrow={about.delivery.titleEn}
          title={about.delivery.title}
          body={about.delivery.intro}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.delivery.steps.map((s) => (
            <StepCard key={s.step} {...s} />
          ))}
        </div>

        <div className="mt-12 grid gap-8 rounded-xl border b-ink bg-paper-dim p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <h3 className="font-display text-[20px] font-bold text-ink">
            مؤشرات الأداء المقترحة
          </h3>
          <TickList items={about.delivery.kpis} columns={2} />
        </div>
      </Section>

      {/* -------------------------------------------------------- GOVERNANCE */}
      <Section id="governance" tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-40" />
        <div className="relative">
          <SectionTitle
            eyebrow={about.governance.titleEn}
            title={about.governance.title}
            onDark
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border b-soft bg-surface-panel p-8">
              <h3 className="mb-4 text-[16px] font-bold text-text-primary">
                {about.governance.quality.title}
              </h3>
              <p className="mb-6 text-[13.5px] leading-[1.9] text-text-muted">
                {about.governance.quality.body}
              </p>
              <TickList items={about.governance.quality.points} onDark />
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-xl border b-soft bg-surface-panel p-8">
                <h3 className="mb-3 text-[16px] font-bold text-text-primary">
                  {about.governance.hse.title}
                </h3>
                <p className="text-[13.5px] leading-[1.9] text-text-muted">
                  {about.governance.hse.body}
                </p>
              </div>
              <div className="rounded-xl border b-gold bg-surface-panel p-8">
                <h3 className="mb-3 text-[16px] font-bold text-text-primary">
                  {about.governance.data.title}
                </h3>
                <p className="text-[13.5px] leading-[1.9] text-text-muted">
                  {about.governance.data.body}
                </p>
              </div>
            </div>
          </div>

          <h3 className="mb-6 mt-12 font-display text-[20px] font-bold text-text-primary">
            إدارة المخاطر
          </h3>
          <div className="card-row">
            {about.governance.risks.map((r) => (
              <FeatureCard key={r.title} title={r.title} body={r.body} onDark />
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- CTA */}
      <Section tone="paper-dim">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-ink md:text-[32px]">
            ابدأ مشروعك معنا
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-ink-muted">
            شاركنا احتياجك، وسيقوم فريقنا بدراسة نطاق العمل وتقديم الحل الأنسب لمشروعك.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/request-quote" size="lg" withArrow>
              {cta.requestQuote}
            </Button>
            <Button href="/services" variant="onDark" size="lg">
              {cta.exploreServices}
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
