import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { serviceSectors } from "@/content/serviceSectors";
import { serviceBySlug } from "@/content/services";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: "قطاعاتنا | شركة التا للاستثمار",
  description:
    "خمسة قطاعات تجمع خدمات التا للاستثمار: التقنية والذكاء الاصطناعي، التشغيل وإدارة المرافق، الضيافة والإعاشة، حلول الأعمال، والإعلام والفعاليات.",
  alternates: { canonical: "/sectors" },
};

export default function SectorsPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "قطاعاتنا", href: "/sectors" }]} />
      <PageHero
        eyebrow="OUR SECTORS"
        title="قطاعاتنا"
        body="نجمع خدمات التا للاستثمار في خمسة قطاعات واضحة، كل قطاع يضم مجموعة من الخدمات المترابطة التي تخدم هدفاً واحداً لدى المنشأة."
        trail={[{ name: "قطاعاتنا", href: "/sectors" }]}
      />

      {serviceSectors.map((sector, i) => {
        const sectorServices = sector.serviceSlugs
          .map((slug) => serviceBySlug(slug))
          .filter((s) => s !== undefined);

        return (
          <Section key={sector.id} id={sector.id} tone={i % 2 === 0 ? "paper" : "paper-dim"} rule>
            <SectionTitle eyebrow={sector.titleEn} title={sector.title} body={sector.blurb} />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sectorServices.map((s) => (
                <ServiceCard
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  icon={s.icon}
                  title={s.title}
                  body={s.short}
                />
              ))}
            </div>
          </Section>
        );
      })}

      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-text-primary md:text-[32px]">
            هل تبحث عن حل ضمن أحد قطاعاتنا؟
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            شاركنا احتياجك، وسيقوم فريقنا بدراسة نطاق العمل وتقديم الحل الأنسب.
          </p>
          <Button href="/request-quote" size="lg" withArrow>
            {cta.requestQuote}
          </Button>
        </div>
      </Section>
    </>
  );
}
