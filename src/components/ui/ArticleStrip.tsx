import Image from "next/image";
import { Icon } from "./Icon";
import { LocaleLink } from "./LocaleLink";
import type { Article } from "@/content/articles";

/**
 * "مقالات مقترحة" strip, shared by the sector and service pages.
 *
 * The plan requires the link to run both ways — every article points at its
 * service and sector, and every service/sector page lists its articles — so
 * this lives in one component rather than being pasted into each template.
 * Renders nothing when a sector has no published article yet, which is the
 * normal state for the ten articles still switched off.
 */
export function ArticleStrip({ items }: { items: Article[] }) {
  if (items.length === 0) return null;
  return (
    <div className="card-row">
      {items.map((a) => (
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
            <h3 className="text-[14.5px] font-bold leading-[1.7] text-ink">{a.title}</h3>
            <p className="mt-2.5 text-[12.5px] leading-[1.85] text-ink-muted">
              {a.excerpt}
            </p>
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
  );
}
