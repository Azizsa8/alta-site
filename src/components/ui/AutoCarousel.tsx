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
  mask = "[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]",
}: {
  children: React.ReactNode;
  /** Pixels per frame at 60fps. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  ariaLabel?: string;
  /**
   * Edge-fade mask, as a single Tailwind class.
   *
   * A prop rather than something callers append via `className`: two arbitrary
   * `[mask-image:…]` utilities set the same property at the same specificity,
   * so which one wins depends on their order in the generated stylesheet, not
   * on the order they appear in the class attribute. Exactly one is emitted
   * this way. Pass "" to disable.
   */
  mask?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeAt = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
     * Position is tracked here, in a always-positive 0..half space, and only
     * mapped onto scrollLeft at the end. It is NOT accumulated by reading
     * scrollLeft back.
     *
     * The previous version did `el.scrollLeft += speed * dir` and then wrapped
     * by writing `el.scrollLeft -= half * dir`. Under RTL, dir is -1, so that
     * wrap assigns a POSITIVE scrollLeft — and RTL's scroll range is
     * [-(scrollWidth - clientWidth), 0]. Measured on the services row: the
     * range is [-4300, 0] and `scrollLeft = 50` reads back as 0. So on the very
     * first frame the "already at the start, jump to the seam" branch fired,
     * the browser clamped the write to 0, and the next frame saw position 0
     * again — pinned at zero forever, on every carousel, in the site's primary
     * language.
     *
     * Owning the position removes the whole class of problem: nothing depends
     * on how a browser reports or clamps a scroll offset in RTL.
     */
    const rtl = getComputedStyle(el).direction === "rtl";
    let pos = Math.abs(el.scrollLeft);

    let frame = 0;
    const step = () => {
      frame = requestAnimationFrame(step);
      if (paused.current || Date.now() < resumeAt.current) return;

      const half = el.scrollWidth / 2;
      if (half < 1) return;

      pos += reverse ? -speed : speed;
      // Wrap in both directions. `half` is where the duplicated copy begins, so
      // landing on it is visually identical to landing on 0.
      if (pos >= half) pos -= half;
      else if (pos < 0) pos += half;

      el.scrollLeft = rtl ? -pos : pos;
    };
    frame = requestAnimationFrame(step);

    const hold = () => {
      paused.current = true;
    };
    const release = () => {
      paused.current = false;
      // Resync here as well as on wheel: a touch swipe or a mouse drag moves
      // the row without ever firing a wheel event. A plain `scroll` listener
      // cannot be used for this — our own per-frame writes would fire it and
      // push `resumeAt` forward forever, permanently pausing the loop.
      pos = Math.abs(el.scrollLeft);
      // Brief grace period so it does not lurch the instant a finger lifts.
      resumeAt.current = Date.now() + 1200;
    };
    // A manual scroll (swipe, trackpad, scrollbar) also counts as interaction.
    // Resync from where the visitor actually left it, otherwise the loop would
    // resume from its own stale position and snap the row backwards.
    const nudge = () => {
      pos = Math.abs(el.scrollLeft);
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
      /*
       * NO `scroll-smooth` here, deliberately.
       *
       * scroll-behavior: smooth turns every scrollLeft assignment into an
       * ANIMATED scroll toward a target. This component writes scrollLeft once
       * per animation frame, so each write re-targeted an animation that never
       * had time to move — measured: with smooth, `el.scrollLeft = -50` reads
       * back as 0; with auto it reads back as -50. The carousels sat
       * completely still.
       *
       * Smooth belongs on user-initiated scrolling, not on a loop that is
       * already producing its own per-frame motion.
       */
      className={`no-scrollbar flex gap-5 overflow-x-auto overscroll-x-contain ${mask} ${className}`}
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
