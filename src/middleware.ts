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
 * Locale is chosen from the visitor's Accept-Language ONLY as a tiebreaker.
 * Arabic stays the default for anything ambiguous: this is a Saudi company
 * whose approved content is Arabic, and an English-preferring browser in
 * Riyadh should not silently get the unapproved translation.
 */
const PASSTHROUGH = [
  "/api",
  "/admin",
  "/_next",
  "/partners",
  "/projects/", // static media, not the page — the page is /:locale/projects
  "/video",
  "/brand",
];

function preferred(request: NextRequest) {
  const header = request.headers.get("accept-language");
  if (!header) return defaultLocale;
  // "en-GB,en;q=0.9,ar;q=0.8" -> first tag we actually publish
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) return tag;
  }
  return defaultLocale;
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

  const locale = preferred(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  // 307, not 308: the choice depends on a request header, so it must not be
  // cached as a permanent mapping by intermediaries.
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    // Everything except Next internals and files with an extension.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

export { locales };
