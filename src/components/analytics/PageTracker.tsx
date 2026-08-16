"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let sid = window.sessionStorage.getItem("alta_sid");
    if (!sid) {
      sid = "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      window.sessionStorage.setItem("alta_sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const sid = getOrCreateSessionId();
    const payload = JSON.stringify({
      type: "page_view",
      path: pathname,
      sessionId: sid,
      source: "web",
      meta: {
        referrer: typeof document !== "undefined" ? document.referrer : "",
        screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
      },
    });

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* non-blocking */
    }
  }, [pathname]);

  return null;
}
