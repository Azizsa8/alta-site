import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

/**
 * Privacy and Terms share an identical shape — numbered clauses under a lead
 * paragraph — so they share one renderer rather than two near-duplicate pages.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  clauses,
  href,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  clauses: { title: string; body: string }[];
  href: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd trail={[{ name: title, href }]} />
      <PageHero
        eyebrow={eyebrow}
        title={title}
        body={intro}
        trail={[{ name: title, href }]}
      />

      <Section tone="paper">
        <ol className="mx-auto max-w-3xl space-y-8">
          {clauses.map((c, i) => (
            <li key={c.title} className="rule-ink pt-8 first:border-0 first:pt-0">
              <h2 className="mb-3 flex items-baseline gap-3 text-[16px] font-bold text-ink">
                <span className="tnum font-display text-[15px] text-primary-container">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {c.title}
              </h2>
              <p className="ps-9 text-[13.5px] leading-[2] text-ink-muted">{c.body}</p>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
