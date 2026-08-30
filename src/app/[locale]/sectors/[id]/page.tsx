import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ServiceCard, StepCard, TickList } from "@/components/ui/Cards";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { serviceSectors, serviceSectorById } from "@/content/serviceSectors";
import { publishedArticles } from "@/content/articles";
import { ArticleStrip } from "@/components/ui/ArticleStrip";
import { serviceBySlug } from "@/content/services";
import { home, faq } from "@/content/pages";
import { cta } from "@/content/site";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return serviceSectors.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const sector = serviceSectorById(id);
  if (!sector) return {};
  return {
    title: `${sector.title} | شركة التا للاستثمار`,
    description: sector.intro,
    alternates: { canonical: `/sectors/${sector.id}` },
    openGraph: { title: sector.title, description: sector.intro },
  };
}

export default async function SectorPage({ params }: Params) {
  const { id } = await params;
  const sector = serviceSectorById(id);
  if (!sector) notFound();

  const sectorServices = sector.serviceSlugs
    .map((slug) => serviceBySlug(slug))
    .filter((s) => s !== undefined);

  // A short, broadly-applicable excerpt of the approved FAQ — the full list
  // lives at /faq; repeating all ten questions per sector would drown the
  // sector-specific content instead of supporting it.
  const faqExcerpt = faq.items.slice(0, 3);

  const others = serviceSectors.filter((s) => s.id !== sector.id).slice(0, 3);
  const sectorArticles = publishedArticles
    .filter((a) => a.sectorId === sector.id)
    .slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        trail={[
          { name: "قطاعاتنا", href: "/sectors" },
          { name: sector.title, href: `/sectors/${sector.id}` },
        ]}
      />

      <PageHero
        eyebrow={sector.titleEn}
        title={sector.title}
        body={sector.intro}
        trail={[
          { name: "قطاعاتنا", href: "/sectors" },
          { name: sector.title, href: `/sectors/${sector.id}` },
        ]}
      />

      {/* ------------------------------------------------------- CHALLENGES */}
      <Section tone="paper">
        <SectionTitle eyebrow="THE CHALLENGE" title="التحديات التي نحلها" align="start" />
        <div className="mt-8 max-w-2xl">
          <TickList items={sector.challenges} />
        </div>
      </Section>

      {/* --------------------------------------------------------- SERVICES */}
      <Section tone="paper-dim" rule>
        <SectionTitle eyebrow="WHAT'S INCLUDED" title="الخدمات" />
        <div className="mt-12 card-row">
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

      {/* ------------------------------------------------------- HOW WE WORK */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative">
          <SectionTitle eyebrow="HOW WE WORK" title={home.methodologyTitle} onDark />
          <div className="step-track stagger relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {home.methodology.map((m) => (
              <StepCard key={m.step} {...m} onDark />
            ))}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------- WHO IT'S FOR + FAQ */}
      <Section tone="paper-dim">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="WHO IT'S FOR" title="القطاعات المستفيدة" align="start" />
            <div className="mt-8">
              <TickList items={sector.audienceIndustries} />
            </div>
          </div>
          <div>
            <SectionTitle eyebrow="FAQ" title="أسئلة شائعة" align="start" />
            <div className="mt-8 space-y-5">
              {faqExcerpt.map((f) => (
                <div key={f.q}>
                  <h3 className="text-[14px] font-bold text-ink">{f.q}</h3>
                  <p className="mt-1.5 text-[13px] leading-[1.85] text-ink-muted">{f.a}</p>
                </div>
              ))}
              <Button href="/faq" variant="onDark">
                {cta.more}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------- مقالات مقترحة */}
      {sectorArticles.length > 0 && (
        <Section tone="paper" rule>
          <SectionTitle eyebrow="INSIGHTS" title="مقالات مقترحة" />
          <div className="mt-12">
            <ArticleStrip items={sectorArticles} />
          </div>
        </Section>
      )}

      {/* --------------------------------------------------------- OTHER SECTORS */}
      <Section tone="paper" rule>
        <SectionTitle eyebrow="MORE SECTORS" title="قطاعات أخرى" />
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {others.map((s) => (
            <ServiceCard
              key={s.id}
              href={`/sectors/${s.id}`}
              icon={s.icon}
              title={s.title}
              body={s.blurb}
            />
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- CTA */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-3xl font-display text-[24px] font-bold leading-tight text-text-primary md:text-[32px]">
            هل تبحث عن شريك لإدارة {sector.title}؟
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            نبدأ بفهم احتياجك وتحديد نطاق واضح، ثم نقدم تصوراً فنياً ومالياً مناسباً.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/request-quote" size="lg" withArrow>
              {cta.requestQuote}
            </Button>
            <Button href={`/projects#${sector.id}`} variant="secondary" size="lg">
              مشاريعنا في هذا القطاع
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
