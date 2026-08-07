import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Shared inner-page banner.
 *
 * Every non-home page opens with the same midnight band so the site reads as
 * one structure: English section label (as printed in the approved document),
 * Arabic H1, lead paragraph, and a breadcrumb.
 */
export function PageHero({
  eyebrow,
  title,
  body,
  trail = [],
}: {
  eyebrow: string;
  title: string;
  body?: string;
  trail?: { name: string; href: string }[];
}) {
  return (
    // `isolate` is deliberately dropped: it creates a stacking context, which
    // would trap this section above the document's aurora layer and paint a
    // solid slab over it. The band tint replaces the opaque fill.
    <section className="band-midnight relative overflow-hidden">
      <div className="blueprint absolute inset-0" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 90% at 85% 0%, rgba(217,168,78,0.12), transparent 70%)",
        }}
      />
      <div className="alta-container relative py-14 md:py-20">
        {trail.length > 0 && (
          <nav aria-label="مسار التنقل" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
              <li>
                <Link href="/" className="hover:text-primary">
                  الرئيسية
                </Link>
              </li>
              {trail.map((t) => (
                <li key={t.href} className="flex items-center gap-2">
                  <Icon name="chevron" className="size-3 opacity-50" />
                  <Link href={t.href} className="hover:text-primary">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl font-display text-[30px] font-extrabold leading-tight text-text-primary md:text-[46px]">
          {title}
        </h1>
        {body && (
          <p className="mt-6 max-w-3xl text-[15px] leading-[1.9] text-text-muted">
            {body}
          </p>
        )}
      </div>
    </section>
  );
}
