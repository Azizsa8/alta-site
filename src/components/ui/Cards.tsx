import Link from "next/link";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

/**
 * Service card — top-aligned icon, title, body, "المزيد" affordance, and a
 * border that goes from hairline to gold on hover (DESIGN.md > Investment Cards).
 */
export function ServiceCard({
  href,
  icon,
  title,
  body,
  onDark = false,
}: {
  href: string;
  icon: IconName;
  title: string;
  body: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col rounded-lg border p-6 transition-all duration-200 hover:-translate-y-1 ${
        onDark
          ? "b-soft bg-surface-panel hover:border-[color:var(--color-primary-container)] hover:shadow-panel"
          : "b-ink bg-paper hover:border-[color:var(--color-primary-container)] hover:shadow-[0_18px_40px_-24px_rgba(11,22,34,0.35)]"
      }`}
    >
      <span
        className={`mb-5 grid size-12 place-items-center rounded-md border transition-colors ${
          onDark
            ? "b-gold bg-primary/10 text-primary"
            : "b-gold bg-primary/10 text-gold-ink"
        }`}
      >
        <Icon name={icon} className="size-6" />
      </span>
      <h3
        className={`mb-2.5 text-[16px] font-bold leading-snug ${
          onDark ? "text-text-primary" : "text-ink"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mb-5 flex-1 text-[13px] leading-[1.9] ${
          onDark ? "text-text-muted" : "text-ink-muted"
        }`}
      >
        {body}
      </p>
      <span
        className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${
          onDark ? "text-primary" : "text-gold-ink"
        }`}
      >
        المزيد
        <Icon
          name="arrow"
          className="size-3.5 transition-transform duration-200 group-hover:-translate-x-1"
          strokeWidth={2.2}
        />
      </span>
    </Link>
  );
}

/** Numbered step card used by every "منهجية التنفيذ" block. */
export function StepCard({
  step,
  title,
  body,
  onDark = false,
}: {
  step: string;
  title: string;
  body: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={`relative h-full rounded-lg border p-6 ${
        onDark ? "b-soft bg-surface-panel" : "b-ink bg-paper"
      }`}
    >
      <span className="tnum mb-4 block font-display text-[34px] font-bold leading-none text-primary-container">
        {step}
      </span>
      <h3
        className={`mb-2 text-[15px] font-bold ${
          onDark ? "text-text-primary" : "text-ink"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-[13px] leading-[1.9] ${
          onDark ? "text-text-muted" : "text-ink-muted"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

/** Plain title/body tile — offerings, values, sectors, risks. */
export function FeatureCard({
  title,
  body,
  onDark = false,
  icon,
}: {
  title: string;
  body: string;
  onDark?: boolean;
  icon?: IconName;
}) {
  return (
    <div
      className={`h-full rounded-lg border p-6 transition-colors ${
        onDark
          ? "b-soft bg-surface-panel hover:border-[color:var(--color-primary-container)]"
          : "b-ink bg-paper hover:border-[color:var(--color-primary-container)]"
      }`}
    >
      {icon && (
        <span
          className={`mb-4 grid size-10 place-items-center rounded-md border b-gold bg-primary/10 ${
            onDark ? "text-primary" : "text-gold-ink"
          }`}
        >
          <Icon name={icon} className="size-5" />
        </span>
      )}
      <h3
        className={`mb-2 text-[15px] font-bold ${
          onDark ? "text-text-primary" : "text-ink"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-[13px] leading-[1.9] ${
          onDark ? "text-text-muted" : "text-ink-muted"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

/** Gold-ticked list item, used for "القيمة التي نحققها" and goal lists. */
export function TickList({
  items,
  onDark = false,
  columns = 1,
}: {
  items: string[];
  onDark?: boolean;
  columns?: 1 | 2;
}) {
  return (
    <ul className={`grid gap-3.5 ${columns === 2 ? "md:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-container">
            <Icon name="check" className="size-3" strokeWidth={2.6} />
          </span>
          <span
            className={`text-[13.5px] leading-[1.85] ${
              onDark ? "text-text-muted" : "text-ink-muted"
            }`}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
