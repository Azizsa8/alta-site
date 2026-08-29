import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { services, serviceBySlug } from "@/content/services";
import { serviceSectors } from "@/content/serviceSectors";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: "خدمات شركة التا للاستثمار",
  description:
    "استكشف خدمات التا في الذكاء الاصطناعي والتشغيل والصيانة والضيافة والاستشارات والتوريدات والإعلام والفعاليات والبحوث.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "خدماتنا", href: "/services" }]} />
      <PageHero
        eyebrow="OUR SERVICES"
        title="خدماتنا"
        body="صُممت خدمات التا للاستثمار لتلبية احتياجات المنشآت عبر مراحل مختلفة؛ من دراسة السوق ووضع الاستراتيجية، إلى التأهيل والتنفيذ والتشغيل والتوريد والتواصل مع الجمهور. ويمكن تقديم كل خدمة بصورة مستقلة أو ضمن حل متكامل متعدد المسارات."
        trail={[{ name: "خدماتنا", href: "/services" }]}
      />

      {/* Grouped by the five sectors from /sectors, so a visitor who lands
          here directly still sees the same structure as the sector menu —
          the flat numbered index further down stays as the exhaustive list. */}
      {serviceSectors.map((sector) => {
        const sectorServices = sector.serviceSlugs
          .map((slug) => serviceBySlug(slug))
          .filter((s) => s !== undefined);

        return (
          <Section key={sector.id} id={sector.id} tone="paper" rule>
            <SectionTitle eyebrow={sector.titleEn} title={sector.title} body={sector.blurb} />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Numbered index, mirroring the 01–08 list in the approved document. */}
      <Section tone="paper-dim" rule>
        <SectionTitle eyebrow="SERVICE INDEX" title="فهرس الخدمات" />
        <ol className="mt-12 grid gap-4 md:grid-cols-2">
          {services.map((s, i) => (
            <li key={s.slug}>
              <a
                href={`/services/${s.slug}`}
                className="flex h-full items-start gap-4 rounded-lg border b-ink bg-paper p-5 transition-colors hover:border-[color:var(--color-primary-container)]"
              >
                <span className="tnum font-display text-[22px] font-bold leading-none text-primary-container">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[14.5px] font-bold text-ink">
                    {s.title}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-[1.85] text-ink-muted">
                    {s.short}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-text-primary md:text-[34px]">
            حل واحد أم منظومة متكاملة؟
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            نحدد معك الخدمات المناسبة ونربطها ضمن نطاق موحد يضمن وضوح المسؤوليات
            وتكامل النتائج.
          </p>
          <Button href="/contact" size="lg" withArrow>
            {cta.talkToTeam}
          </Button>
        </div>
      </Section>
    </>
  );
}
