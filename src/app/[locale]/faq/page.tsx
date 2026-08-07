import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { faq } from "@/content/pages";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: faq.seo.title,
  description: faq.seo.description,
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <FaqJsonLd />
      <BreadcrumbJsonLd trail={[{ name: "الأسئلة الشائعة", href: "/faq" }]} />
      <PageHero
        eyebrow={faq.titleEn}
        title={faq.title}
        trail={[{ name: "الأسئلة الشائعة", href: "/faq" }]}
      />

      <Section tone="paper">
        <div className="mx-auto max-w-3xl space-y-3">
          {faq.items.map((item, i) => (
            /* <details> gives keyboard and screen-reader accordion behaviour
               with no JS and no hydration cost. */
            <details
              key={item.q}
              className="group rounded-lg border b-ink bg-paper-dim p-5 open:border-[color:var(--color-primary-container)] open:bg-paper"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3.5 text-[15px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                <span className="tnum shrink-0 font-display text-[15px] text-primary-container">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{item.q}</span>
                <Icon
                  name="arrow-down"
                  className="mt-1 size-4 shrink-0 text-gold-ink transition-transform group-open:rotate-180"
                  strokeWidth={2}
                />
              </summary>
              <p className="mt-4 ps-9 text-[13.5px] leading-[1.9] text-ink-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <Section tone="paper-dim" rule>
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-ink md:text-[30px]">
            لم تجد إجابتك؟
          </h2>
          <Button href="/contact" size="lg" withArrow>
            {cta.talkToTeam}
          </Button>
        </div>
      </Section>
    </>
  );
}
