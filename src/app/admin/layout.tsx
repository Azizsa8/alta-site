import type { Metadata } from "next";
import "../globals.css";

/**
 * Second root layout, for /admin only.
 *
 * The public site moved under app/[locale]/, taking the old root layout — and
 * its <html>/<body> — with it. /admin sits outside that tree, so without its
 * own root it would render with no document shell at all.
 *
 * It is deliberately NOT localised. The dashboard is an internal tool used by
 * the operator, its labels are Arabic, and putting it behind a locale segment
 * would mean maintaining an English translation of screens no client sees.
 *
 * `robots: noindex` because an admin surface should never be in an index; the
 * public sitemap does not list it, but a stray link would otherwise be enough.
 */
export const metadata: Metadata = {
  title: "لوحة التحكم | شركة التا للاستثمار",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
