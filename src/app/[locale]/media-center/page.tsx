import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ProjectGallery } from "@/components/ui/ProjectGallery";
import { Icon } from "@/components/ui/Icon";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { mediaCenter, projects } from "@/content/pages";
import { publishedArticles } from "@/content/articles";
import { serviceSectorById } from "@/content/serviceSectors";
import { cta } from "@/content/site";

export const metadata: Metadata = {
  title: mediaCenter.seo.title,
  description: mediaCenter.seo.description,
  alternates: { canonical: "/media-center" },
};

/**
 * Event material, drawn from the same documented-work set as /projects rather
 * than duplicated — one asset list, filtered two ways, so a correction to a
 * caption cannot land on one page and miss the other.
 */
const eventHighlights = projects.gallery.filter((g) =>
  g.activity.startsWith("الفعاليات"),
);

export default function MediaCenterPage() {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: "الرؤى والمقالات", href: "/media-center" }]} />
      <PageHero
        eyebrow={mediaCenter.titleEn}
        title={mediaCenter.title}
        body={mediaCenter.intro}
        trail={[{ name: "الرؤى والمقالات", href: "/media-center" }]}
      />

      <Section tone="paper">
        <SectionTitle eyebrow="SECTIONS" title="الأقسام" />
        <div className="mt-12 card-row">
          {mediaCenter.sections.map((s) => (
            <FeatureCard key={s.title} title={s.title} body={s.body} />
          ))}
        </div>
      </Section>

      {/* Real footage from company events, carrying "أخبار الشركة". */}
      {/* tone="paper" here and "paper-dim" below, not the other way round:
          the gallery cards are bg-paper-dim and the article cards are
          bg-paper, so each set needs the opposite band to stay visible. */}
      <Section tone="paper" rule>
        <SectionTitle
          eyebrow="HIGHLIGHTS"
          title="لقطات من مشاركاتنا"
          body="مشاركات الشركة في المعارض والفعاليات وحفلات التوقيع."
        />
        <div className="mt-12">
          <ProjectGallery items={eventHighlights} />
        </div>
      </Section>

      <Section tone="paper-dim" rule>
        <SectionTitle
          eyebrow="INSIGHTS"
          title="أحدث المقالات"
          body="مقالات عملية في مجالات عمل التا، كل مقال مرتبط بالخدمة والقطاع الذي يخدمه."
        />
        <div className="mt-12 card-row">
          {publishedArticles.map((a) => {
            const sector = serviceSectorById(a.sectorId);
            return (
              <LocaleLink
                key={a.slug}
                href={`/media-center/${a.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border b-ink bg-paper transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--color-primary-container)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-2.5 text-[11px] font-semibold text-gold-ink">
                    {sector?.title ?? a.serviceLabel}
                  </span>
                  <h3 className="text-[14.5px] font-bold leading-[1.7] text-ink">
                    {a.title}
                  </h3>
                  <p className="mt-2.5 text-[12.5px] leading-[1.85] text-ink-muted">
                    {a.excerpt}
                  </p>
                  <span className="mt-auto flex items-center gap-1.5 pt-4 text-[12.5px] font-semibold text-gold-ink">
                    {cta.readArticle}
                    <Icon
                      name="arrow"
                      className="size-3.5 transition-transform group-hover:-translate-x-1"
                      strokeWidth={2.2}
                    />
                  </span>
                </div>
              </LocaleLink>
            );
          })}
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
