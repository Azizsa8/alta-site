"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public site chrome (header, footer, chat widget) on `/admin`.
 *
 * The alternative — a second root layout via route groups — would mean moving
 * every public page into an `(site)` group for one boolean. The server-rendered
 * chrome is passed in as props, so it is still rendered on the server; this
 * component only decides whether to mount it.
 */
export function SiteChrome({
  children,
  isAdminArea,
}: {
  children: React.ReactNode;
  isAdminArea?: boolean;
}) {
  const pathname = usePathname();
  const hide = isAdminArea ?? pathname.startsWith("/admin");
  if (hide) return null;
  return <>{children}</>;
}
