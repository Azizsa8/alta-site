/**
 * Section primitives.
 *
 * The approved layout alternates paper and midnight bands down the page, so
 * "tone" is the one knob every section takes. Keeping the vertical rhythm
 * (72px desktop / 52px mobile, per DESIGN.md) in one place is what stops the
 * page from drifting as sections are added.
 */

type Tone = "paper" | "paper-dim" | "midnight" | "midnight-deep";

const tones: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  "paper-dim": "bg-paper-dim text-ink",
  midnight: "bg-surface text-text-primary",
  "midnight-deep": "bg-surface-lowest text-text-primary",
};

export function Section({
  children,
  tone = "paper",
  className = "",
  id,
  rule = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  id?: string;
  /** Draws the 1px structural hairline above the section. */
  rule?: boolean;
}) {
  const isDark = tone === "midnight" || tone === "midnight-deep";
  return (
    <section
      id={id}
      className={`${tones[tone]} py-[52px] md:py-[72px] ${
        rule ? (isDark ? "rule-soft" : "rule-ink") : ""
      } ${className}`}
    >
      <div className="alta-container">{children}</div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  body,
  align = "center",
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "center" | "start";
  onDark?: boolean;
}) {
  const centered = align === "center";
  return (
    <header className={`${centered ? "text-center" : "text-start"} max-w-3xl ${centered ? "mx-auto" : ""}`}>
      {eyebrow && (
        <p
          className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            onDark ? "text-primary/80" : "text-gold-ink"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`title-rule ${centered ? "" : "title-rule-start"} font-display text-[28px] font-bold leading-tight md:text-[42px] ${
          onDark ? "text-text-primary" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {body && (
        <p
          className={`mt-6 text-[15px] leading-[1.9] ${
            onDark ? "text-text-muted" : "text-ink-muted"
          }`}
        >
          {body}
        </p>
      )}
    </header>
  );
}

/** Small gold pill used for eyebrow tags and status chips. */
export function Pill({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-wide ${
        onDark
          ? "border-[color:var(--stroke-gold)] bg-primary/10 text-primary"
          : "border-[color:var(--stroke-gold)] bg-primary/10 text-gold-ink"
      }`}
    >
      {children}
    </span>
  );
}
