/**
 * Inline stroke icons.
 *
 * Deliberately hand-rolled rather than pulled from an icon package: the set is
 * small, it keeps the bundle free of a runtime dependency, and inline SVG
 * inherits `currentColor` so a single icon works on both the midnight and the
 * paper surfaces without a second asset.
 */

export type IconName =
  | "ai"
  | "facilities"
  | "hospitality"
  | "consulting"
  | "procurement"
  | "media"
  | "events"
  | "research"
  | "arrow"
  | "arrow-down"
  | "menu"
  | "close"
  | "chevron"
  | "phone"
  | "mail"
  | "pin"
  | "check"
  | "quote"
  | "shield"
  | "spark"
  | "chart"
  | "whatsapp"
  | "linkedin"
  | "instagram"
  | "x"
  | "youtube"
  | "facebook"
  | "play";

const paths: Record<IconName, React.ReactNode> = {
  ai: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2.5" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.2 6.2l2.4 2.4M15.4 15.4l2.4 2.4M17.8 6.2l-2.4 2.4M8.6 15.4l-2.4 2.4" />
    </>
  ),
  facilities: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8.5L12 4l7 4.5V21" />
      <path d="M9.5 21v-5h5v5" />
      <path d="M9.5 11.5h1.5M13 11.5h1.5" />
    </>
  ),
  hospitality: (
    <>
      <path d="M4 15h16a8 8 0 0 0-16 0Z" />
      <path d="M3 18.5h18" />
      <path d="M12 7V5" />
      <circle cx="12" cy="4" r="1" />
    </>
  ),
  consulting: (
    <>
      <path d="M4 20V9M10 20V4M16 20v-7M22 20H2" />
      <path d="M4 9l6-5 6 9 4-4" />
    </>
  ),
  procurement: (
    <>
      <path d="M3 6h2l2.2 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.55L20.5 9H6.2" />
      <circle cx="10" cy="20.5" r="1.2" />
      <circle cx="17" cy="20.5" r="1.2" />
    </>
  ),
  media: (
    <>
      <path d="M4 9v6h3.5L14 19V5L7.5 9H4Z" />
      <path d="M17.5 8.5a5 5 0 0 1 0 7M20 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  events: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14.5h3M8 17.5h6" />
    </>
  ),
  research: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
      <path d="M8 11.5l2 2 3.5-4" />
    </>
  ),
  arrow: <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-down": <path d="M12 5v14M6 13l6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M15 6l-6 6 6 6" />,
  phone: (
    <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  quote: (
    <path d="M9 6c-3 1.5-4.5 4-4.5 7.5V18h5.5v-5.5H7c0-2 .7-3.4 2.6-4.4Zm10 0c-3 1.5-4.5 4-4.5 7.5V18H20v-5.5h-3c0-2 .7-3.4 2.6-4.4Z" />
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  spark: <path d="M12 3l2.2 5.9L20 11l-5.8 2.1L12 19l-2.2-5.9L4 11l5.8-2.1Z" />,
  chart: (
    <>
      <path d="M4 20h16" />
      <rect x="5" y="12" width="3.5" height="6" rx="1" />
      <rect x="10.2" y="8" width="3.5" height="10" rx="1" />
      <rect x="15.5" y="4.5" width="3.5" height="13.5" rx="1" />
    </>
  ),

  /* --- Channel marks ---------------------------------------------------
     Drawn as strokes rather than the official filled glyphs so they sit in
     the same visual language as the set above and inherit currentColor on
     both surfaces. They read as the platform without being a pixel copy of
     a trademarked lockup. */
  whatsapp: (
    <>
      <path d="M12 3.4a8.6 8.6 0 0 0-7.4 12.9L3.4 20.6l4.4-1.1A8.6 8.6 0 1 0 12 3.4Z" />
      <path d="M9.4 8.6h.8l.9 2-.7.9a5.6 5.6 0 0 0 2.6 2.3l.8-.7 2 .9v.9a1.3 1.3 0 0 1-1.4 1.2 7.5 7.5 0 0 1-6.3-6.3 1.3 1.3 0 0 1 1.3-1.2Z" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M7.4 10.4V17" />
      <path d="M7.4 7.3v.02" strokeWidth={2.4} />
      <path d="M11.4 17v-3.6a2.6 2.6 0 0 1 5.2 0V17" />
      <path d="M11.4 17v-6.6" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M16.9 7.1v.02" strokeWidth={2.4} />
    </>
  ),
  x: (
    <>
      <path d="M4.2 4.2 19.8 19.8" />
      <path d="M19.8 4.2 4.2 19.8" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.4" y="5.8" width="19.2" height="12.4" rx="3.6" />
      <path d="M10.4 9.6 15.6 12l-5.2 2.4Z" />
    </>
  ),
  facebook: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 8.2h-1.4c-.9 0-1.4.5-1.4 1.4v1.7h2.6l-.4 2.5h-2.2V21" />
      <path d="M10 11.3h2" />
    </>
  ),
  play: <path d="M8 5.4 19 12 8 18.6Z" />,
};

export function Icon({
  name,
  className = "size-6",
  strokeWidth = 1.5,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
