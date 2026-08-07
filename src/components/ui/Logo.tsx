import Image from "next/image";
import { LocaleLink } from "./LocaleLink";
import { company } from "@/content/site";

/**
 * The approved logo lock-up.
 *
 * Both source files are transparent PNGs, so no background plate is drawn
 * behind them under any circumstance — the mark sits directly on whatever
 * surface it lands on. The Arabic wordmark artwork is dark-on-transparent, so
 * on midnight surfaces we render the ALTA/Arabic name as live text in brand
 * colours instead of inverting the artwork (inverting would misrepresent the
 * approved asset).
 */
export function Logo({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <LocaleLink
      href="/"
      aria-label={company.nameAr}
      className={`inline-flex items-center gap-3 ${className}`}
    >
      <Image
        src="/brand/alta-mark.png"
        alt=""
        width={200}
        height={176}
        priority
        className="h-11 w-auto shrink-0 sm:h-12"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-xl font-extrabold tracking-[0.22em] sm:text-2xl ${
            onDark ? "text-primary" : "text-gold-ink"
          }`}
        >
          {company.mark}
        </span>
        <span
          className={`mt-1.5 text-[10px] font-medium tracking-wide sm:text-[11px] ${
            onDark ? "text-text-muted" : "text-ink-muted"
          }`}
        >
          {company.nameAr}
        </span>
      </span>
    </LocaleLink>
  );
}

/**
 * Full artwork wordmark — used where the surface is light and the approved
 * Arabic lettering artwork can be shown exactly as supplied.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/alta-wordmark-ar.png"
      alt={company.nameAr}
      width={733}
      height={95}
      className={`h-auto w-full max-w-[280px] ${className}`}
    />
  );
}
