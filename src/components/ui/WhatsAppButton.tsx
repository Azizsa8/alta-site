import { Icon } from "./Icon";
import { whatsapp, whatsappHref, socialLinks } from "@/content/site";

/**
 * Floating WhatsApp affordance.
 *
 * The client's instruction is that customer enquiries go to WhatsApp, so this
 * is present on every page rather than only on /contact.
 *
 * `rel="noopener"` matters here beyond the usual hygiene: `target="_blank"`
 * without it hands the opened tab a live `window.opener` reference back to
 * this document, which it can navigate elsewhere.
 */
export function WhatsAppButton({ context }: { context?: string }) {
  return (
    <a
      href={whatsappHref(context)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`تواصل معنا عبر واتساب ${whatsapp.display}`}
      // start-6 rather than left-6: the site is RTL, so the logical property
      // puts this on the reading-start side and it follows the direction if a
      // latin locale is ever added.
      className="group fixed bottom-5 start-5 z-40 flex items-center gap-2.5 rounded-full border border-[#25d366]/40 bg-[#0e2a1c] py-3 ps-3 pe-4 text-[#7ff0a8] shadow-panel transition-all duration-300 hover:border-[#25d366] hover:bg-[#123d27] hover:text-white md:bottom-7 md:start-7"
    >
      <span className="grid size-7 place-items-center rounded-full bg-[#25d366] text-[#06240f] transition-transform duration-300 group-hover:scale-110">
        <Icon name="whatsapp" className="size-4" strokeWidth={1.8} />
      </span>
      {/* Label is hidden on the smallest screens so the control stays a
          thumb-sized target and does not sit across the content. */}
      <span className="hidden text-[13px] font-semibold sm:inline">
        تواصل عبر واتساب
      </span>
    </a>
  );
}

/**
 * Inline WhatsApp row for contact surfaces, where a floating pill would be
 * redundant but the number should still be one tap away.
 */
export function WhatsAppInline({ context }: { context?: string }) {
  return (
    <a
      href={whatsappHref(context)}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-lg border border-[#25d366]/35 bg-[#25d366]/10 px-5 py-3.5 transition-colors hover:border-[#25d366]/70 hover:bg-[#25d366]/15"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25d366] text-[#06240f]">
        <Icon name="whatsapp" className="size-5" strokeWidth={1.8} />
      </span>
      <span className="text-start">
        <span className="block text-[13.5px] font-bold text-text-primary">
          تواصل عبر واتساب
        </span>
        {/* dir=ltr so the + and the digit groups are not reordered by the
            surrounding RTL paragraph direction. */}
        <span dir="ltr" className="tnum block text-[12.5px] text-text-muted">
          {whatsapp.display}
        </span>
      </span>
    </a>
  );
}

/**
 * Social profile row.
 *
 * Renders nothing while `socialLinks` is empty. Icons that go nowhere are
 * worse than no icons, so the guard stays even though the array is populated
 * again as of 2026-08-16 — see `socialLinks` in `content/site.ts`.
 */
export function SocialBar({ className = "" }: { className?: string }) {
  if (socialLinks.length === 0) return null;

  return (
    <ul className={`flex items-center gap-2.5 ${className}`}>
      {socialLinks.map((s) => (
        <li key={s.href}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="grid size-9 place-items-center rounded-full border b-soft text-text-muted transition-colors hover:border-[color:var(--stroke-gold)] hover:text-primary"
          >
            <Icon name={s.icon} className="size-4" strokeWidth={1.8} />
          </a>
        </li>
      ))}
    </ul>
  );
}
