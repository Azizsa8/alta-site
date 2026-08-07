import Link from "next/link";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "onDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-200 " +
  // 48px minimum touch target, per DESIGN.md > Components > Buttons.
  "min-h-12 px-6 text-[15px] disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Gold fill, dark text, 2px lift on hover.
  primary:
    "bg-primary text-on-primary hover:bg-primary/90 hover:-translate-y-0.5 shadow-gold",
  // Transparent with a gold hairline — used on midnight surfaces.
  secondary:
    "border border-[color:var(--stroke-gold)] text-primary hover:bg-primary/10 hover:-translate-y-0.5",
  // Raised panel button — the "المزيد عن الشركة" affordance in the approved
  // design. On the midnight base this is a lifted surface with a gold hairline,
  // not the dark-on-light pill it was when the site had white sections.
  onDark:
    "bg-surface-elevated text-text-primary border border-[color:var(--stroke-gold)] hover:bg-surface-high hover:-translate-y-0.5",
  ghost:
    "text-gold-ink hover:text-gold-deep underline-offset-4 hover:underline px-0 min-h-0",
};

const sizes: Record<Size, string> = {
  // Nav-scale. Overrides the 48px base target because it sits inside a 72px
  // bar beside 40px controls; a full-height button there reads as a banner.
  sm: "min-h-10 px-4 text-[13.5px]",
  md: "",
  lg: "min-h-14 px-8 text-base",
};

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  withArrow?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  withArrow = false,
  type = "button",
  disabled,
  onClick,
}: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {withArrow && <Icon name="arrow" className="size-4" strokeWidth={2} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {inner}
    </button>
  );
}
