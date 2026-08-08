import { notFound } from "next/navigation";

/**
 * Catch-all inside a locale, so unmatched paths render OUR 404.
 *
 * With every page under [locale] and no root app/not-found.tsx, an unknown
 * path like /ar/nope matched the locale segment, found no child route, and
 * fell through to Next's built-in 404 — correct status, but a bare framework
 * page with none of the approved Arabic copy, no header and no footer.
 *
 * Calling notFound() from here hands rendering to [locale]/not-found.tsx,
 * which is the designed page. `dynamic = "force-static"` keeps it out of the
 * server-rendered set; it has no request-dependent behaviour.
 */
export const dynamic = "force-static";

export default function CatchAll() {
  notFound();
}
