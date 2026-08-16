"use client";

import { useEffect } from "react";

export function ThemeClientSync({ initialCss }: { initialCss?: string | null }) {
  useEffect(() => {
    // 1. Instant local cache hydration
    try {
      const cached = localStorage.getItem("alta_theme_css");
      const activeCss = initialCss || cached;
      if (activeCss) {
        let el = document.getElementById("alta-theme-overrides");
        if (!el) {
          el = document.createElement("style");
          el.id = "alta-theme-overrides";
          document.head.appendChild(el);
        }
        if (el.innerHTML !== activeCss) {
          el.innerHTML = activeCss;
        }
      }
    } catch {
      /* ignore */
    }

    // 2. Fetch live settings from server
    fetch("/api/theme", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          let el = document.getElementById("alta-theme-overrides");
          if (data.css) {
            if (!el) {
              el = document.createElement("style");
              el.id = "alta-theme-overrides";
              document.head.appendChild(el);
            }
            if (el.innerHTML !== data.css) {
              el.innerHTML = data.css;
            }
            try {
              localStorage.setItem("alta_theme_css", data.css);
            } catch {}
          } else if (el) {
            // No custom theme (reset)
            el.remove();
            try {
              localStorage.removeItem("alta_theme_css");
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, [initialCss]);

  return null;
}
