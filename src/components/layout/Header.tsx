"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mainNav, cta } from "@/content/site";

/**
 * Scroll position is external browser state, so it is read with
 * `useSyncExternalStore` rather than mirrored into state from an effect.
 * That reads the correct value on the very first client render — a page opened
 * already scrolled (a refresh, or a #anchor link) gets the elevated header
 * immediately instead of flashing the flat one for a frame.
 */
function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function Header() {
  const pathname = usePathname();

  /**
   * Menu state is stored as "the route it was opened on", so navigating closes
   * it by derivation rather than by an effect that fires after the new page has
   * already painted with the sheet still over it.
   */
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [servicesOn, setServicesOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const servicesOpen = servicesOn === pathname;

  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const setServicesOpen = (next: boolean) => setServicesOn(next ? pathname : null);

  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 8,
    () => false, // server snapshot: the document always starts at the top
  );

  // Lock background scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 glass-nav transition-shadow ${
        scrolled ? "shadow-[0_1px_0_0_var(--stroke-ink),0_8px_24px_-16px_rgba(11,22,34,0.4)]" : "border-b b-ink"
      }`}
    >
      <div className="alta-container flex h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav aria-label="القائمة الرئيسية" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setServicesOpen(true)}
                onMouseLeave={() => item.children && setServicesOpen(false)}
              >
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-1 px-3 py-2 text-[14px] font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-gold-ink"
                      : "text-ink/80 hover:text-gold-ink"
                  }`}
                >
                  {item.label}
                  {item.children && (
                    <Icon name="arrow-down" className="size-3" strokeWidth={2} />
                  )}
                  {/* Gold underline expanding from the centre, per DESIGN.md. */}
                  <span
                    className={`pointer-events-none absolute inset-x-3 bottom-0 h-px origin-center bg-primary-container transition-transform duration-300 ${
                      isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>

                {item.children && servicesOpen && (
                  <div className="absolute start-0 top-full w-[320px] pt-2">
                    <ul className="overflow-hidden rounded-lg border b-ink bg-paper py-2 shadow-panel">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-4 py-2.5 text-[13.5px] text-ink/80 transition-colors hover:bg-paper-dim hover:text-gold-ink"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/request-quote" className="hidden md:inline-flex">
            {cta.requestQuote}
          </Button>
          <button
            type="button"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="grid size-11 place-items-center rounded-md border b-ink text-ink lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t b-ink bg-paper lg:hidden">
          <nav aria-label="قائمة الجوال" className="alta-container py-4">
            <ul className="flex flex-col">
              {mainNav.map((item) => (
                <li key={item.href} className="border-b b-ink last:border-0">
                  <Link
                    href={item.href}
                    className={`block py-3.5 text-[15px] font-medium ${
                      isActive(item.href) ? "text-gold-ink" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className="pb-3 ps-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block py-2 text-[13.5px] text-ink-muted"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <Button href="/request-quote" className="mt-5 w-full">
              {cta.requestQuote}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
