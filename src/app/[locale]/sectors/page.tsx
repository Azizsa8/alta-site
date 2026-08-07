import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { sectors } from "@/content/pages";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: sectors.seo.title,
  description: sectors.seo.description,
  alternates: { canonical: "/sectors" },
};

export default function SectorsPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "القطاعات", href: "/sectors" }]} />
      <PageHero
        eyebrow={sectors.titleEn}
        title={sectors.title}
        body={sectors.intro}
        trail={[{ name: "القطاعات", href: "/sectors" }]}
      />

      <Section tone="paper">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.items.map((s) => (
            <FeatureCard key={s.title} title={s.title} body={s.body} />
          ))}
        </div>
      </Section>

      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-text-primary md:text-[32px]">
            {sectors.closing.title}
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            {sectors.closing.body}
          </p>
          <Button href="/contact" size="lg" withArrow>
            {cta.discussNeed}
          </Button>
        </div>
      </Section>
    </>
  );
}
