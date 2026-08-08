"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeNames, swapLocale } from "@/i18n/config";
import { useLocale } from "./LocaleLink";

/**
 * Language switch.
 *
 * Renders real <a> links, not a button that pushes a route. That matters for
 * three reasons: the alternate language is crawlable, it can be opened in a
 * new tab, and — because `hrefLang` is set — search engines can read the pair
 * as translations of one page rather than as duplicates.
 *
 * `swapLocale` replaces the segment IN PLACE rather than sending the visitor
 * home, so switching language on /ar/services/ai-engineering lands on the same
 * page in English instead of dumping them on the homepage. That is the single
 * most common complaint about language switches and it costs one function.
 *
 * `prefetch={false}`: the other locale is a whole second page tree, and
 * prefetching it on every header render would pull down documents almost
 * nobody navigates to.
 */
export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const current = useLocale();
  const pathname = usePathname();

  return (
    <div
      className={`flex items-center rounded-md border b-gold ${compact ? "text-[11px]" : "text-[12px]"}`}
      role="group"
      aria-label={current === "ar" ? "تغيير اللغة" : "Change language"}
    >
      {locales.map((locale, i) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={swapLocale(pathname, locale)}
            hrefLang={locale}
            prefetch={false}
            // lang on the link itself so a screen reader pronounces
            // "العربية" in Arabic and "English" in English, rather than
            // reading both in the page language.
            lang={locale}
            aria-current={active ? "true" : undefined}
            className={`px-2.5 py-1.5 font-semibold transition-colors ${
              i === 0 ? "rounded-s-md" : "rounded-e-md"
            } ${
              active
                ? "bg-primary/15 text-primary"
                : "text-text-muted hover:text-primary"
            }`}
          >
            {compact ? locale.toUpperCase() : localeNames[locale]}
          </Link>
        );
      })}
    </div>
  );
}
