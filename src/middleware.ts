import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";

/**
 * Locale routing.
 *
 * Every public path carries its locale as the first segment (/ar/about,
 * /en/about). This redirects the bare paths onto one, so /about does not 404
 * for anyone holding an old link — which matters because the client has been
 * sharing URLs from the pre-migration site.
 *
 * Arabic ALWAYS wins the bare URL. Accept-Language is deliberately ignored:
 * phones and laptops across the Gulf are routinely configured in English, so
 * sniffing that header sent most visitors of a Saudi company's Arabic-first
 * site to the derived English tree — and made the site look like it rendered
 * left-to-right. English is reached only by asking for it.
 *
 * "Asking for it" means one of two things:
 *   1. requesting an /en URL directly, or
 *   2. having clicked the language switch before, which leaves LOCALE_COOKIE.
 *
 * Only an explicit click writes that cookie (see LocaleSwitch), so it can never
 * be set by a browser default — which is exactly the failure being fixed here.
 */
export const LOCALE_COOKIE = "alta_locale";
const PASSTHROUGH = [
  "/api",
  "/admin",
  "/_next",
  "/partners",
  "/projects/", // static media, not the page — the page is /:locale/projects
  "/video",
  "/brand",
];

/** The visitor's remembered choice, or Arabic. Never reads Accept-Language. */
function chosen(request: NextRequest) {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  return saved && isLocale(saved) ? saved : defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PASSTHROUGH.some((p) => pathname.startsWith(p)) ||
    // Anything with a file extension is an asset: favicon.ico, robots.txt,
    // sitemap.xml, /about_office.webp. Prefixing those would 404 them.
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();

  const locale = chosen(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  // 307, not 308: the target depends on a cookie, so it must not be cached as
  // a permanent mapping by intermediaries or by the visitor's own browser.
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    // Everything except Next internals and files with an extension.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

export { locales };
