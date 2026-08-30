import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Section, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import {
  publishedArticles,
  articleBySlug,
  relatedArticles,
} from "@/content/articles";
import { serviceSectorById } from "@/content/serviceSectors";
import { serviceBySlug } from "@/content/services";
import { company } from "@/content/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | شركة التا للاستثمار`,
    description: article.excerpt,
    alternates: { canonical: `/media-center/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const sector = serviceSectorById(article.sectorId);
  const service = serviceBySlug(article.serviceSlug);
  const related = relatedArticles(article);

  // "خدمات ذات علاقة": the rest of the article's sector, with the article's
  // own linked service pulled to the front.
  const sectorServices = (sector?.serviceSlugs ?? [])
    .map((s) => serviceBySlug(s))
    .filter((s) => s !== undefined)
    .sort((a, b) =>
      a.slug === article.serviceSlug ? -1 : b.slug === article.serviceSlug ? 1 : 0,
    );

  // The client's "الخدمة المرتبطة" wording sometimes matches the sector name
  // exactly (article 5 labels both "التشغيل وإدارة المرافق"), which rendered
  // the two chips as visible duplicates. Fall back to the service page's own
  // title in that case so the pair always says two different things.
  const serviceChip =
    service && article.serviceLabel === sector?.title
      ? service.title
      : article.serviceLabel;

  const trail = [
    { name: "الرؤى والمقالات", href: "/media-center" },
    { name: article.title, href: `/media-center/${article.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd trail={trail} />
      {/* Article schema — the plan's SEO section asks for it explicitly. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            image: `${company.origin}${article.image}`,
            inLanguage: "ar",
            mainEntityOfPage: `${company.origin}/media-center/${article.slug}`,
            publisher: {
              "@type": "Organization",
              name: company.nameAr,
              url: company.origin,
            },
          }),
        }}
      />

      <PageHero
        eyebrow={sector?.titleEn ?? "INSIGHTS"}
        title={article.title}
        body={article.excerpt}
        trail={trail}
      />

      <Section tone="paper">
        <article className="mx-auto max-w-3xl">
          <div className="relative mb-9 aspect-[16/8] overflow-hidden rounded-xl border b-ink">
            <Image
              src={article.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>

          {/* Sector + service tags, so the article never sits orphaned from
              the structure the rest of the site is organised by. */}
          <div className="mb-8 flex flex-wrap items-center gap-2.5 text-[12.5px]">
            {sector && (
              <LocaleLink
                href={`/sectors/${sector.id}`}
                className="rounded-full border b-gold bg-primary/10 px-3.5 py-1.5 font-semibold text-gold-ink transition-colors hover:bg-primary/20"
              >
                {sector.title}
              </LocaleLink>
            )}
            {service && (
              <LocaleLink
                href={`/services/${service.slug}`}
                className="rounded-full border b-ink px-3.5 py-1.5 text-ink-muted transition-colors hover:border-[color:var(--color-primary-container)] hover:text-gold-ink"
              >
                {serviceChip}
              </LocaleLink>
            )}
          </div>

          {article.body.map((para) => (
            <p key={para} className="mb-5 text-[15.5px] leading-[2.1] text-ink-muted">
              {para}
            </p>
          ))}

          {/* ------------------------------------------- كيف تساعدك التا؟ */}
          <div className="mt-10 rounded-xl border b-gold bg-paper-dim p-7 md:p-9">
            <h2 className="mb-3.5 font-display text-[19px] font-bold text-gold-ink md:text-[22px]">
              كيف تساعدك التا؟
            </h2>
            <p className="text-[15px] leading-[2] text-ink-muted">{article.help}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href={article.cta.href} size="lg" withArrow>
                {article.cta.label}
              </Button>
              {service && (
                <Button href={`/services/${service.slug}`} variant="secondary" size="lg">
                  تفاصيل الخدمة
                </Button>
              )}
            </div>
          </div>
        </article>
      </Section>

      {/* -------------------------------------------------- خدمات ذات علاقة */}
      {sectorServices.length > 0 && (
        <Section tone="paper-dim" rule>
          <SectionTitle eyebrow="RELATED SERVICES" title="خدمات ذات علاقة" />
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
          {sector && (
            <div className="mt-10 flex justify-center">
              <Button href={`/projects#${sector.id}`} variant="onDark" withArrow>
                مشاريعنا في {sector.title}
              </Button>
            </div>
          )}
        </Section>
      )}

      {/* -------------------------------------------------- مقالات قد تهمك */}
      {related.length > 0 && (
        <Section tone="paper" rule>
          <SectionTitle eyebrow="MORE INSIGHTS" title="مقالات قد تهمك" />
          <div className="mt-12 card-row">
            {related.map((a) => (
              <LocaleLink
                key={a.slug}
                href={`/media-center/${a.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border b-ink bg-paper transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--color-primary-container)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-[14.5px] font-bold leading-[1.7] text-ink">
                    {a.title}
                  </h3>
                  <span className="mt-auto flex items-center gap-1.5 pt-4 text-[12.5px] font-semibold text-gold-ink">
                    اقرأ المقال
                    <Icon
                      name="arrow"
                      className="size-3.5 transition-transform group-hover:-translate-x-1"
                      strokeWidth={2.2}
                    />
                  </span>
                </div>
              </LocaleLink>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
