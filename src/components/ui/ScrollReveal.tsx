"use client";

import { useEffect } from "react";

/**
 * Reveals sections as they scroll into view, site-wide.
 *
 * Mounted once in the root layout. It arms itself by adding `.js-reveal` to
 * <html>, which is what the CSS keys off — so if this component never runs,
 * nothing is hidden. Content is never invisible waiting on JavaScript.
 *
 * A MutationObserver picks up sections added after client-side navigation,
 * which a one-shot querySelectorAll would miss on every route change.
 */
export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;

    // No IntersectionObserver (or reduced motion) => leave everything visible.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    root.classList.add("js-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          // One-way: sections do not re-hide when scrolled back past.
          observer.unobserve(entry.target);
        }
      },
      // Trigger slightly before the section reaches the viewport edge so the
      // motion finishes as it settles into view rather than after.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const arm = () => {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Anything already on screen at mount (the hero, above-the-fold cards)
        // is shown immediately — animating it would flash on first paint.
        if (rect.top < window.innerHeight * 0.9) el.classList.add("is-visible");
        else observer.observe(el);
      });
    };

    arm();
    const mutations = new MutationObserver(arm);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
