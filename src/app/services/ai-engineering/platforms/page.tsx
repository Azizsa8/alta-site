import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle, Pill } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { platformsIndex, platforms } from "@/content/platforms";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: platformsIndex.seo.title,
  description: platformsIndex.seo.description,
  alternates: { canonical: "/services/ai-engineering/platforms" },
};

const TRAIL = [
  { name: "خدماتنا", href: "/services" },
  { name: "الذكاء الاصطناعي وتقنية المعلومات", href: "/services/ai-engineering" },
  { name: "برامجنا ومنصاتنا", href: "/services/ai-engineering/platforms" },
];

export default function PlatformsPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={TRAIL} />
      <PageHero
        eyebrow={platformsIndex.titleEn}
        title={platformsIndex.headline}
        body={platformsIndex.intro}
        trail={TRAIL}
      />

      <Section tone="paper">
        <SectionTitle eyebrow="HOW THEY WORK" title="ما يميز منصاتنا" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {platformsIndex.pillars.map((p) => (
            <FeatureCard key={p.title} title={p.title} body={p.body} />
          ))}
        </div>
      </Section>

      <Section tone="paper-dim" rule>
        <SectionTitle eyebrow="OUR PLATFORMS" title="المنصات المتاحة" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {platforms.map((p) => (
            <Link
              key={p.slug}
              href={`/services/ai-engineering/platforms/${p.slug}`}
              className="group relative overflow-hidden rounded-xl border b-gold bg-surface-panel p-8 transition-all hover:-translate-y-1 hover:shadow-panel"
            >
              <div className="blueprint absolute inset-0 opacity-50" />
              <div className="relative">
                <Pill onDark>{p.eyebrow}</Pill>
                <p className="mt-5 font-display text-[18px] font-bold tracking-[0.2em] text-primary">
                  {p.name}
                </p>
                <p className="mt-1.5 text-[12.5px] text-text-muted">{p.nameAr}</p>
                <h3 className="mt-4 font-display text-[22px] font-bold leading-snug text-text-primary">
                  {p.headline}{" "}
                  <span className="text-primary">{p.headlineAccent}</span>
                </h3>
                <p className="mt-4 text-[13.5px] leading-[1.9] text-text-muted">
                  {p.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {p.metrics.map((m) => (
                    <span
                      key={m.label}
                      className="rounded-full border b-soft px-3 py-1.5 text-[11.5px] text-text-muted"
                    >
                      <span className="tnum font-bold text-primary">{m.value}</span>{" "}
                      {m.label}
                    </span>
                  ))}
                </div>

                <span className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
                  استعرض المنصة
                  <Icon
                    name="arrow"
                    className="size-4 transition-transform group-hover:-translate-x-1"
                    strokeWidth={2.2}
                  />
                </span>
              </div>
            </Link>
          ))}

          {/* Honest placeholder rather than inventing a roadmap. */}
          <div className="rounded-xl border b-soft bg-surface-panel/60 p-8">
            <Pill onDark>قيد التطوير</Pill>
            <h3 className="mt-5 font-display text-[20px] font-bold text-text-primary">
              منصات أخرى قيد التطوير
            </h3>
            <p className="mt-4 text-[13.5px] leading-[1.9] text-text-muted">
              نعمل على منصات إضافية تخدم قطاعات التشغيل والصيانة والإعاشة. إذا كان
              لديك احتياج متكرر يمكن أتمتته، ناقشه معنا وقد يكون المنتج القادم.
            </p>
            <Button href="/contact" variant="secondary" className="mt-7">
              {cta.discussNeed}
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="midnight-deep" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-text-primary md:text-[32px]">
            تبحث عن حل رقمي مخصص؟
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            نبدأ بتحديد حالات الاستخدام الأعلى أثراً، ثم نصمم الحل ونربطه بأنظمتك ضمن
            نطاق تقني واضح.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/request-quote" size="lg" withArrow>
              {cta.requestQuote}
            </Button>
            <Button href="/services/ai-engineering" variant="secondary" size="lg">
              عن الخدمة
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
