"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-scrolling carousel that yields to the user.
 *
 * A pure-CSS marquee cannot be dragged or swiped, so this drives a real
 * scroll container with rAF instead. That means the visitor can flick it on a
 * phone, drag it with a mouse, or tab through it — and the auto-scroll simply
 * gets out of the way.
 *
 * It stops on hover, on touch/pointer down, on keyboard focus, and whenever
 * the visitor scrolls it themselves; it resumes a moment after they stop.
 *
 * Looping works by rendering `children` TWICE and wrapping the scroll position
 * at the half-way point, so there is no visible jump at the seam.
 */
export function AutoCarousel({
  children,
  speed = 0.4,
  reverse = false,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  /** Pixels per frame at 60fps. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeAt = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // In RTL the scroll axis runs negative, so the direction must flip too.
    const rtl = getComputedStyle(el).direction === "rtl";
    const dir = (reverse ? -1 : 1) * (rtl ? -1 : 1);

    let frame = 0;
    const step = () => {
      frame = requestAnimationFrame(step);
      if (paused.current || Date.now() < resumeAt.current) return;

      const half = el.scrollWidth / 2;
      if (half < 1) return;
      el.scrollLeft += speed * dir;

      // Wrap at the seam. Using the absolute value keeps this correct in RTL,
      // where scrollLeft counts downward from zero.
      if (Math.abs(el.scrollLeft) >= half) el.scrollLeft -= half * dir;
      else if (Math.abs(el.scrollLeft) < 1 && dir < 0) el.scrollLeft -= half * dir;
    };
    frame = requestAnimationFrame(step);

    const hold = () => {
      paused.current = true;
    };
    const release = () => {
      paused.current = false;
      // Brief grace period so it does not lurch the instant a finger lifts.
      resumeAt.current = Date.now() + 1200;
    };
    // A manual scroll (swipe, trackpad, scrollbar) also counts as interaction.
    const nudge = () => {
      resumeAt.current = Date.now() + 1600;
    };

    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("pointerdown", hold);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("touchstart", hold, { passive: true });
    el.addEventListener("touchend", release, { passive: true });
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", release);
    el.addEventListener("wheel", nudge, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("pointerdown", hold);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      el.removeEventListener("touchstart", hold);
      el.removeEventListener("touchend", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("wheel", nudge);
    };
  }, [speed, reverse]);

  return (
    <div
      ref={ref}
      aria-label={ariaLabel}
      className={`no-scrollbar flex gap-5 overflow-x-auto overscroll-x-contain scroll-smooth [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] ${className}`}
    >
      {/* Rendered twice for the loop. The duplicate is hidden from assistive
          tech so each item is announced once. */}
      <div className="flex shrink-0 gap-5">{children}</div>
      <div className="flex shrink-0 gap-5" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
