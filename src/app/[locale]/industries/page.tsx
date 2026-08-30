import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { industries } from "@/content/pages";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: industries.seo.title,
  description: industries.seo.description,
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "الفئات التي نخدمها", href: "/industries" }]} />
      <PageHero
        eyebrow={industries.titleEn}
        title={industries.title}
        body={industries.intro}
        trail={[{ name: "الفئات التي نخدمها", href: "/industries" }]}
      />

      <Section tone="paper">
        <div className="card-row">
          {industries.items.map((s) => (
            <FeatureCard key={s.title} title={s.title} body={s.body} />
          ))}
        </div>
      </Section>

      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-text-primary md:text-[32px]">
            {industries.closing.title}
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            {industries.closing.body}
          </p>
          <Button href="/contact" size="lg" withArrow>
            {cta.discussNeed}
          </Button>
        </div>
      </Section>
    </>
  );
}
