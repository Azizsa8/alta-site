import Image from "next/image";
import Link from "next/link";
import { Section, SectionTitle, Pill } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ServiceCard, StepCard, TickList } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { PartnerCarousel } from "@/components/ui/PartnerCarousel";
import { AutoCarousel } from "@/components/ui/AutoCarousel";
import { services } from "@/content/services";
import { serviceSectors } from "@/content/serviceSectors";
import { home, about, projects, mediaCenter } from "@/content/pages";
import { cta, company } from "@/content/site";
import { readSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = projects.featured;
  // Live overrides written by the WhatsApp agents; approved content is the
  // default, so an empty settings store renders exactly the approved site.
  const { content, images } = await readSettings();

  const heroTitle = content.heroTitle ?? home.hero.title;
  const heroAccent = content.heroTitleAccent ?? home.hero.titleAccent;
  const heroEyebrow = content.heroEyebrow ?? home.hero.eyebrow;
  const heroBody = content.heroBody ?? home.hero.body;
  const heroImage = images.hero ?? "/hero_cityscape.png";
  const aboutImage = images.about ?? "/about_office.webp";

  return (
    <>
      {content.announcement && (
        <div className="bg-primary-container text-on-primary">
          <p className="alta-container py-2.5 text-center text-[13px] font-semibold">
            {content.announcement}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------ HERO */}
      <section className="relative isolate overflow-hidden bg-surface">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          // Remote images supplied by an agent are not in next.config's
          // allow-list, so skip the optimiser for anything off-origin.
          unoptimized={heroImage.startsWith("http")}
          className="object-cover opacity-45"
        />
        {/* Directional scrim: keeps the copy legible at the start edge while
            leaving the skyline visible at the end edge. */}
        <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/85 to-surface/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/70" />
        <div className="blueprint absolute inset-0" />

        <div className="alta-container relative flex min-h-[560px] flex-col justify-center py-20 md:min-h-[640px] md:py-28">
          <div className="reveal max-w-2xl">
            <Pill onDark>{heroEyebrow}</Pill>
            <h1 className="mt-6 font-display text-[38px] font-extrabold leading-[1.15] tracking-tight text-text-primary sm:text-[52px] md:text-[64px] md:leading-[1.12]">
              {heroTitle}
              <span className="mt-2 block text-primary">{heroAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.9] text-text-muted md:text-[16px]">
              {heroBody}
            </p>
            {/* The quote CTA is desktop-only. On a phone the two large
                buttons stacked full-width dominated the hero; the same action
                is one tap away in the menu and at the foot of every page. */}
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/sectors" withArrow className="w-auto">
                {cta.exploreSectors}
              </Button>
              <Button
                href="/request-quote"
                variant="secondary"
                className="hidden md:inline-flex"
              >
                {cta.requestQuote}
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 hidden justify-center md:flex">
          <a
            href="#sectors"
            aria-label="انتقل إلى قطاعاتنا"
            className="grid size-10 place-items-center rounded-full border b-gold text-primary/70 transition-colors hover:text-primary"
          >
            <Icon name="arrow-down" className="size-4" />
          </a>
        </div>
      </section>

      {/* --------------------------------------------------------- SECTORS */}
      {/* Five cards, one per line of business — the entry point the header's
          "قطاعاتنا" dropdown and the footer both point back into. Each card
          jumps straight to its group on /sectors rather than duplicating
          that page's copy here. */}
      <Section id="sectors" tone="paper-dim" rule>
        <SectionTitle eyebrow="OUR SECTORS" title="قطاعات التا" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceSectors.map((sector) => (
            <ServiceCard
              key={sector.id}
              href={`/sectors#${sector.id}`}
              icon={sector.icon}
              title={sector.title}
              body={sector.blurb}
            />
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- SERVICES */}
      {/* The heading keeps the reading measure; the track runs edge to edge so
          the row reads as continuous motion across the viewport rather than a
          strip parked inside a 1180px column. */}
      <Section id="services" tone="paper" bleed>
        <div className="alta-container">
          <SectionTitle
            eyebrow="OUR SERVICES"
            title={home.servicesTitle}
            body={home.intro.body}
          />
        </div>
        <div className="mt-12">
          <AutoCarousel speed={0.3} ariaLabel="خدماتنا">
            {services.map((s, i) => (
              <div
                key={s.slug}
                className="w-[300px] shrink-0 sm:w-[340px]"
                // Spreads the icon drift across the row. 0.9s steps over a
                // 4.5s cycle means five distinct phases before it repeats.
                style={{ "--float-delay": `${-(i % 5) * 0.9}s` } as React.CSSProperties}
              >
                <ServiceCard
                  href={`/services/${s.slug}`}
                  icon={s.icon}
                  title={s.title}
                  body={s.short}
                />
              </div>
            ))}
          </AutoCarousel>
        </div>
      </Section>

      {/* ----------------------------------------------------- METHODOLOGY */}
      {/* The approved content document forbids publishing unverified figures,
          so this midnight band carries the approved four-step methodology
          rather than headline statistics. */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-50" />
        <div className="relative">
          <SectionTitle eyebrow="HOW WE WORK" title={home.methodologyTitle} onDark />
          {/* `step-track` draws the gold connector between the four steps as
              the band scrolls in; `stagger` brings the cards up along it, so
              the eye is led left-to-right through the sequence instead of
              being handed four tiles at once. */}
          <div className="step-track stagger relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {home.methodology.map((m) => (
              <StepCard key={m.step} {...m} onDark />
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------- WHY ALTA */}
      <Section tone="paper-dim">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionTitle eyebrow="WHY ALTA" title={home.whyTitle} align="start" />
            <p className="mt-6 text-[15px] leading-[1.9] text-ink-muted">
              {company.promise} — {home.closing.body}
            </p>
            <Button href="/about" variant="onDark" className="mt-8" withArrow>
              {cta.moreAbout}
            </Button>
          </div>
          <TickList items={home.why} columns={2} />
        </div>
      </Section>

      {/* ---------------------------------------------------- CLIENT STRIP */}
      {/* Midnight band, full bleed. A light band was tried here to hide the
          logos' baked-in white backgrounds and was wrong: it put a white slab
          through the middle of a dark site. The plates go back on the tiles,
          where they belong, and the band returns to the page's own palette. */}
      <Section
        tone="midnight-deep"
        bleed
        rule
        className="relative overflow-hidden !py-[48px] md:!py-[64px]"
      >
        <div className="blueprint absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="alta-container">
            <SectionTitle eyebrow="CLIENTS & PARTNERS" title="شركاء النجاح" onDark />
          </div>
          <div className="mt-10">
            <PartnerCarousel />
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ ABOUT */}
      <Section tone="paper-dim" rule>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-last aspect-[4/3] overflow-hidden rounded-xl border b-ink lg:order-first">
            <Image
              src={aboutImage}
              alt="مقر شركة التا للاستثمار"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized={aboutImage.startsWith("http")}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
            {/* The wordmark that used to sit here has gone: the mark is now
                lit on the wall inside the photograph itself, so repeating it
                as a caption put "ALTA" on the image twice. */}
            <div className="absolute bottom-5 start-5">
              <p className="text-[12.5px] font-semibold text-text-primary/90">
                {company.nameAr}
              </p>
            </div>
          </div>

          <div>
            <SectionTitle
              eyebrow="ABOUT ALTA"
              title="عن شركة التا للاستثمار"
              align="start"
            />
            <p className="mt-6 text-[15px] leading-[1.9] text-ink-muted">
              {about.lead[0]}
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-lg border b-ink bg-paper p-5">
                <h3 className="mb-2 text-[14px] font-bold text-gold-ink">
                  {about.vision.title}
                </h3>
                <p className="text-[13px] leading-[1.85] text-ink-muted">
                  {about.vision.headline}
                </p>
              </div>
              <div className="rounded-lg border b-ink bg-paper p-5">
                <h3 className="mb-2 text-[14px] font-bold text-gold-ink">
                  {about.mission.title}
                </h3>
                <p className="text-[13px] leading-[1.85] text-ink-muted">
                  تقديم خدمات احترافية تحقق قيمة مستدامة وجودة عالية لعملائنا.
                </p>
              </div>
            </div>
            <Button href="/about" variant="onDark" className="mt-8" withArrow>
              {cta.moreAbout}
            </Button>
          </div>
        </div>
      </Section>

      {/* ------------------------------------- FEATURED: ALTA HOSPITALITY AI */}
      <Section tone="midnight-deep" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0 opacity-40" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Pill onDark>{featured.eyebrow}</Pill>
            <p className="mt-5 font-display text-[15px] font-bold tracking-[0.24em] text-primary">
              {featured.name}
            </p>
            <p className="mt-1.5 text-[12.5px] text-text-muted">
              {featured.nameAr} — من مشاريعنا
            </p>
            <h2 className="mt-4 font-display text-[28px] font-bold leading-tight text-text-primary md:text-[40px]">
              {featured.headline}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.9] text-text-muted">
              {featured.summary}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {featured.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border b-soft bg-surface-panel p-4"
                >
                  <p className="tnum font-display text-[26px] font-bold leading-none text-primary">
                    {m.value}
                  </p>
                  <p className="mt-2 text-[11.5px] leading-snug text-text-muted">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/projects#alta-hospitality" withArrow>
                {cta.discoverMore}
              </Button>
              <Button href="/services/ai-engineering" variant="secondary">
                هندسة الذكاء الاصطناعي
              </Button>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {featured.agents.map((a) => (
              <li
                key={a.title}
                className="rounded-lg border b-soft bg-surface-panel p-4 transition-colors hover:border-[color:var(--color-primary-container)]"
              >
                <p className="text-[13.5px] font-bold text-text-primary">{a.title}</p>
                <p className="mt-1.5 text-[12px] leading-[1.8] text-text-muted">
                  {a.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ------------------------------------------------------------ NEWS */}
      <Section tone="paper">
        <SectionTitle eyebrow="MEDIA CENTER" title="آخر الأخبار والرؤى" />
        <div className="mt-12">
        <AutoCarousel speed={0.25} reverse ariaLabel="آخر الأخبار والرؤى">
          {mediaCenter.articles.map((a) => (
            <Link
              key={a.title}
              href="/media-center"
              className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-lg border b-ink bg-paper transition-all hover:-translate-y-1 hover:border-[color:var(--color-primary-container)] sm:w-[290px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="290px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2.5 text-[11px] font-semibold text-gold-ink">
                  {a.topic}
                </span>
                <h3 className="flex-1 text-[14px] font-bold leading-[1.7] text-ink">
                  {a.title}
                </h3>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gold-ink">
                  {cta.readArticle}
                  <Icon
                    name="arrow"
                    className="size-3.5 transition-transform group-hover:-translate-x-1"
                    strokeWidth={2.2}
                  />
                </span>
              </div>
            </Link>
          ))}
        </AutoCarousel>
        </div>
      </Section>

      {/* ------------------------------------------------------------- CTA */}
      <Section tone="midnight" className="relative overflow-hidden">
        <div className="blueprint absolute inset-0" />
        <div className="relative flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-start">
          <div className="max-w-2xl">
            <h2 className="font-display text-[26px] font-bold leading-tight text-text-primary md:text-[36px]">
              {home.closing.title}
            </h2>
            <p className="mt-4 text-[15px] leading-[1.9] text-text-muted">
              {home.closing.body}
            </p>
          </div>
          <Button href="/request-quote" size="lg" withArrow>
            {cta.requestQuote}
          </Button>
        </div>
      </Section>
    </>
  );
}
