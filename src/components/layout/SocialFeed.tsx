"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Section, SectionTitle } from "@/components/ui/Section";
import { socialFeed, socialLinks } from "@/content/site";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement) => void } };
  }
}

/**
 * Loads a third-party embed script exactly once and resolves when it's ready
 * to use.
 *
 * Deliberately not `next/script`: in this project's dev server that component
 * never inserted a `<script>` element at all for either platform's embed —
 * `document.querySelectorAll('script[data-nscript]')` came back empty and
 * neither `window.twttr` nor a network request for the src ever appeared,
 * even minutes after mount. A plain `document.createElement` + manual
 * dedupe-by-src is what X and TikTok's own embed docs show anyway, and it is
 * verified working: the same call from the console set `window.twttr` and
 * turned the placeholder `<a>` into a real iframe.
 */
function loadScriptOnce(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    return existing.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error(`failed to load ${src}`)), {
            once: true,
          });
        });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`failed to load ${src}`)), {
      once: true,
    });
    document.body.appendChild(script);
  });
}

/**
 * Live social strip, rendered once above the site footer.
 *
 * Renders nothing while `socialLinks` is empty, same rule `SocialBar` follows
 * — see the comment there.
 *
 * The two embeds come from the platforms themselves (X's timeline widget,
 * TikTok's oEmbed), not a scrape — that is the only sanctioned way to show
 * live third-party content without an API key. Both degrade to a plain
 * profile link if the script fails to load (blocked by an ad blocker, no
 * network, platform outage), so the section is never a blank hole on a
 * corporate site.
 *
 * Mounted once in the root layout, outside `children` — App Router does not
 * remount the layout on route changes within a locale, so the embed scripts
 * run once per visit rather than once per page.
 */
export function SocialFeed() {
  useEffect(() => {
    if (socialLinks.length === 0) return;

    // twttr.widgets.load() is required: the widget script scans the DOM for
    // `.twitter-timeline` once at load time, and by then React may not have
    // painted this section yet (it is a client component further down the
    // tree, not part of the initial markup the script sees). Calling it
    // ourselves after the script resolves removes that race instead of
    // hoping the timing works out.
    loadScriptOnce("https://platform.twitter.com/widgets.js")
      .then(() => window.twttr?.widgets?.load())
      .catch(() => {
        /* FeedCard's fallback link covers a failed load. */
      });

    // TikTok's embed.js re-scans on its own; no equivalent call exists.
    loadScriptOnce("https://www.tiktok.com/embed.js").catch(() => {});
  }, []);

  if (socialLinks.length === 0) return null;

  return (
    <Section tone="midnight-deep" rule>
      <SectionTitle eyebrow="تابعونا" title={socialFeed.heading} body={socialFeed.intro} onDark />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <FeedCard href={socialFeed.x.profileUrl} handle={socialFeed.x.handle} icon="x">
          <a
            className="twitter-timeline"
            data-theme="dark"
            data-lang="ar"
            data-height="440"
            data-chrome="noheader nofooter noborders transparent"
            href={`https://twitter.com/${socialFeed.x.handle}?ref_src=twsrc%5Etfw`}
          >
            تحميل آخر المنشورات من @{socialFeed.x.handle}…
          </a>
        </FeedCard>

        <FeedCard href={socialFeed.tiktok.profileUrl} handle={socialFeed.tiktok.handle} icon="tiktok">
          <blockquote
            className="tiktok-embed"
            cite={`${socialFeed.tiktok.profileUrl}/video/${socialFeed.tiktok.latestVideoId}`}
            data-video-id={socialFeed.tiktok.latestVideoId}
            style={{ maxWidth: 325, minWidth: 288, margin: "0 auto" }}
          >
            <section />
          </blockquote>
        </FeedCard>
      </div>
    </Section>
  );
}

function FeedCard({
  href,
  handle,
  icon,
  children,
}: {
  href: string;
  handle: string;
  icon: "x" | "tiktok";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border b-soft bg-surface-panel/40 p-4 md:p-5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 flex items-center gap-2.5 text-[13px] font-semibold text-text-primary transition-colors hover:text-primary"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border b-soft text-primary">
          <Icon name={icon} className="size-3.5" strokeWidth={1.8} />
        </span>
        <span dir="ltr" className="tnum">
          @{handle}
        </span>
      </a>
      {/* The embeds are third-party widgets built for LTR chrome; isolating
          direction here stops them fighting the page's RTL flow. */}
      <div dir="ltr" className="min-h-[420px]">
        {children}
      </div>
    </div>
  );
}
