import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FeatureCard, StepCard, TickList } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { services, serviceBySlug, serviceClosing } from "@/content/services";
import { serviceSectors } from "@/content/serviceSectors";
import { publishedArticles } from "@/content/articles";
import { ArticleStrip } from "@/components/ui/ArticleStrip";
import { cta } from "@/content/site";

type Params = { params: Promise<{ slug: string }> };

/** Pre-render all eight sub-pages at build time. */
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return {};
  return {
    title: service.seo.title,
    description: service.seo.description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: service.seo.title, description: service.seo.description },
  };
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);
  // Every service belongs to exactly one of the five sectors (serviceSectors.ts
  // is exhaustive over `services`), so this is never undefined in practice —
  // the fallback just keeps the breadcrumb from throwing if that ever changes.
  const sector = serviceSectors.find((s) => s.serviceSlugs.includes(service.slug));
  const serviceArticles = publishedArticles
    .filter((a) => a.serviceSlug === service.slug)
    .slice(0, 3);

  const trail = [
    { name: "قطاعاتنا", href: "/sectors" },
    ...(sector ? [{ name: sector.title, href: `/sectors/${sector.id}` }] : []),
    { name: service.title, href: `/services/${service.slug}` },
  ];

  return (
    <>
      <ServiceJsonLd
        name={service.title}
        description={service.seo.description}
        slug={service.slug}
      />
      <BreadcrumbJsonLd trail={trail} />

      <PageHero
        eyebrow={service.titleEn}
        title={service.headline}
        body={service.intro}
        trail={trail}
      />

      {/* ---------------------------- SUB-PAGES (AI & IT only, for now) ---- */}
      {service.slug === "ai-engineering" && (
        <Section tone="paper" className="!pb-0">
          <Link
            href="/services/ai-engineering/platforms"
            className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border b-gold bg-surface-panel p-8 transition-all hover:-translate-y-1 hover:shadow-panel md:flex-row md:items-center md:justify-between"
          >
            <div className="blueprint absolute inset-0 opacity-40" />
            <div className="relative">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                PROGRAMS, APPS &amp; PLATFORMS
              </p>
              <h2 className="font-display text-[22px] font-bold text-text-primary md:text-[26px]">
                برامجنا وتطبيقاتنا ومنصاتنا
              </h2>
              <p className="mt-3 max-w-2xl text-[13.5px] leading-[1.9] text-text-muted">
                منتجات رقمية جاهزة للتشغيل مبنية على وكلاء الذكاء الاصطناعي — من بينها{" "}
                <span className="font-bold text-primary">ALTA Hospitality AI</span> لتشغيل
                الفنادق والمنتجعات.
              </p>
            </div>
            <span className="relative inline-flex shrink-0 items-center gap-2 rounded-[10px] border b-gold px-5 py-3 text-[13px] font-semibold text-primary">
              استعرض المنصات
              <Icon
                name="arrow"
                className="size-4 transition-transform group-hover:-translate-x-1"
                strokeWidth={2.2}
              />
            </span>
          </Link>
        </Section>
      )}

      {/* --------------------------------------------------------- OFFERINGS */}
      <Section tone="paper">
        <SectionTitle eyebrow="WHAT WE OFFER" title="ماذا نقدم؟" />
        <div className="mt-12 card-row">
          {service.offerings.map((o) => (
            <FeatureCard key={o.title} title={o.title} body={o.body} />
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- METHODOLOGY */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative">
          <SectionTitle eyebrow="DELIVERY" title="منهجية التنفيذ" onDark />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {service.method.map((m) => (
              <StepCard key={m.step} {...m} onDark />
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------- VALUE + REFERENCES */}
      <Section tone="paper-dim">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="OUTCOMES"
              title="القيمة التي نحققها"
              align="start"
            />
            <div className="mt-8">
              <TickList items={service.value} />
            </div>
          </div>

          {service.clients && (
            <div className="rounded-xl border b-gold bg-paper p-8">
              <h3 className="mb-5 text-[16px] font-bold text-ink">
                {service.clients.label}
              </h3>
              <ul className="space-y-3">
                {service.clients.items.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <Icon
                      name="check"
                      className="mt-1 size-4 shrink-0 text-primary-container"
                      strokeWidth={2.5}
                    />
                    <span className="text-[13.5px] leading-[1.85] text-ink-muted">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* ------------------------------------------------------------ SECTORS */}
      <Section tone="paper" rule>
        <div className="rounded-xl border b-ink bg-paper-dim p-8 md:p-10">
          <h2 className="mb-4 font-display text-[20px] font-bold text-ink md:text-[24px]">
            القطاعات المستفيدة
          </h2>
          <p className="text-[14.5px] leading-[2] text-ink-muted">{service.sectors}</p>
        </div>
      </Section>

      {/* ----------------------------------------------- مقالات مقترحة */}
      {serviceArticles.length > 0 && (
        <Section tone="paper" rule>
          <SectionTitle eyebrow="INSIGHTS" title="مقالات مقترحة" />
          <div className="mt-12">
            <ArticleStrip items={serviceArticles} />
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------- OTHER SVC */}
      <Section tone="paper-dim">
        <SectionTitle eyebrow="MORE SERVICES" title="خدمات أخرى قد تهمك" />
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group flex items-start gap-4 rounded-lg border b-ink bg-paper p-5 transition-colors hover:border-[color:var(--color-primary-container)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md border b-gold bg-primary/10 text-gold-ink">
                <Icon name={s.icon} className="size-5" />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-ink">{s.title}</span>
                <span className="mt-1.5 block text-[12.5px] leading-[1.8] text-ink-muted">
                  {s.short}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- CTA */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-3xl font-display text-[24px] font-bold leading-tight text-text-primary md:text-[32px]">
            {serviceClosing.title(service.title)}
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.9] text-text-muted">
            {serviceClosing.body}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/request-quote" size="lg" withArrow>
              {cta.initialConsultation}
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              {cta.talkToTeam}
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
