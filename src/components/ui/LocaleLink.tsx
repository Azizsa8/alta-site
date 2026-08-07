"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { defaultLocale, isLocale, withLocale, type Locale } from "@/i18n/config";

/**
 * `next/link` that keeps the visitor in the locale they are already reading.
 *
 * Without this, links still resolve — middleware redirects /about to a locale
 * — but it picks that locale from Accept-Language, not from the page the click
 * came from. An English reader on /en/about clicking "Services" would be sent
 * to /ar/services if their browser happened to prefer Arabic. The locale has
 * to come from the URL, not the headers.
 *
 * A client component so it can read the route param from anywhere, including
 * inside server components, with no prop drilling through every page.
 *
 * It also removes the redirect hop on ordinary navigation, which is worth
 * having on its own.
 */
export function useLocale(): Locale {
  const params = useParams();
  const raw = params?.locale;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && isLocale(value) ? value : defaultLocale;
}

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & { href: string };

export function LocaleLink({ href, ...rest }: Props) {
  const locale = useLocale();
  return <Link href={withLocale(href, locale)} {...rest} />;
}
