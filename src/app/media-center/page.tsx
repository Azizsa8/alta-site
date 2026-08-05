import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { mediaCenter } from "@/content/pages";
import { cta, microcopy } from "@/content/site";

export const metadata: Metadata = {
  title: mediaCenter.seo.title,
  description: mediaCenter.seo.description,
  alternates: { canonical: "/media-center" },
};

export default function MediaCenterPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "المركز الإعلامي", href: "/media-center" }]} />
      <PageHero
        eyebrow={mediaCenter.titleEn}
        title={mediaCenter.title}
        body={mediaCenter.intro}
        trail={[{ name: "المركز الإعلامي", href: "/media-center" }]}
      />

      <Section tone="paper">
        <SectionTitle eyebrow="SECTIONS" title="الأقسام" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mediaCenter.sections.map((s) => (
            <FeatureCard key={s.title} title={s.title} body={s.body} />
          ))}
        </div>
      </Section>

      <Section tone="paper-dim" rule>
        <SectionTitle eyebrow="INSIGHTS" title="أحدث المقالات" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mediaCenter.articles.map((a) => (
            <article
              key={a.title}
              className="flex h-full flex-col overflow-hidden rounded-lg border b-ink bg-paper"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2.5 text-[11px] font-semibold text-gold-ink">
                  {a.topic}
                </span>
                <h3 className="flex-1 text-[14px] font-bold leading-[1.7] text-ink">
                  {a.title}
                </h3>
                {/* Article bodies are not part of the approved content set yet,
                    so the approved "قيد التحديث" state is shown instead of a
                    dead link. */}
                <p className="mt-4 text-[12px] text-ink-muted">{microcopy.updating}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[24px] font-bold text-text-primary md:text-[32px]">
            تبحث عن رؤى تخص منشأتك؟
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            شاركنا التحدي الذي تعمل عليه، وسنرشح لك المسار الأنسب من خبراتنا.
          </p>
          <Button href="/contact" size="lg" withArrow>
            {cta.talkToTeam}
          </Button>
        </div>
      </Section>
    </>
  );
}
