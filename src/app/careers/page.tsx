import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { TickList } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { careers } from "@/content/pages";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: careers.seo.title,
  description: careers.seo.description,
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "الوظائف", href: "/careers" }]} />
      <PageHero
        eyebrow={careers.titleEn}
        title={careers.headline}
        body={careers.intro}
        trail={[{ name: "الوظائف", href: "/careers" }]}
      />

      <Section tone="paper">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionTitle eyebrow="OPPORTUNITIES" title="مجالات الفرص" align="start" />
          <TickList items={careers.areas} columns={2} />
        </div>
      </Section>

      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionTitle
            eyebrow={careers.partners.titleEn}
            title={careers.partners.title}
            body={careers.partners.intro}
            align="start"
            onDark
          />
          <TickList items={careers.partners.areas} columns={2} onDark />
        </div>
      </Section>

      <Section tone="paper-dim">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-ink md:text-[32px]">
            انضم إلى فريقنا أو سجل كمورد
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-ink-muted">
            أرسل بياناتك عبر نموذج التواصل مع تحديد المجال المطلوب، وسيتم التواصل عند
            توفر فرصة تتناسب مع خبراتك واحتياجاتنا.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/contact?topic=careers" size="lg" withArrow>
              {cta.joinTeam}
            </Button>
            <Button href="/contact?topic=supplier" variant="onDark" size="lg">
              {cta.registerSupplier}
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
