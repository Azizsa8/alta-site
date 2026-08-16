"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleLink";

export type GalleryItem = {
  slug: string;
  title: string;
  activity: string;
  poster: string;
  stills: string[];
  video: string | null;
};

type Slide = {
  kind: "image" | "video";
  src: string;
  poster: string;
  item: GalleryItem;
  /** 1-based position within this item's own media. */
  nth: number;
  of: number;
};

const COPY = {
  ar: {
    open: (t: string) => `عرض صور ${t}`,
    close: "إغلاق",
    prev: "السابق",
    next: "التالي",
    play: (t: string) => `تشغيل مقطع ${t}`,
    photos: (n: number) => `${n} صور`,
    clip: "مقطع",
    viewer: "معرض الصور",
  },
  en: {
    open: (t: string) => `View images for ${t}`,
    close: "Close",
    prev: "Previous",
    next: "Next",
    play: (t: string) => `Play ${t} clip`,
    photos: (n: number) => `${n} photos`,
    clip: "Clip",
    viewer: "Image viewer",
  },
} as const;

/**
 * Documented-work gallery.
 *
 * The source material is phone footage and phone photographs, most of it
 * portrait. Cards are therefore a 3:4 portrait frame with `object-cover`:
 * a landscape frame would letterbox the assets, and cropping a vertical shot
 * to a wide strip throws away the part that actually shows the work.
 *
 * Three columns, not four. This is now the only evidence on /projects — the
 * written portfolio below it was removed — so each card gets roughly a third
 * more linear size, which on 825px-wide sources is the difference between a
 * thumbnail and a photograph.
 *
 * Clicking a card opens a viewer over the page rather than navigating: these
 * are pictures to look at, not pages to visit, and a route change would cost a
 * document load per image. The viewer walks EVERY image in the gallery, not
 * just the one card's, so a visitor who starts browsing can keep going.
 */
export function ProjectGallery({ items }: { items: GalleryItem[] }) {
  const locale = useLocale();
  const t = COPY[locale === "en" ? "en" : "ar"];

  /**
   * Flattened media in card order, plus slug -> index of that card's first
   * slide so a click lands in place.
   *
   * Built inside useMemo rather than in the render body: the arrays are
   * assembled by mutation, and a value mutated during render cannot be a
   * stable hook dependency — the React Compiler rejects it outright.
   */
  const { slides, entry } = useMemo(() => {
    const out: Slide[] = [];
    const at: Record<string, number> = {};

    for (const item of items) {
      const stills = item.stills.length ? item.stills : [item.poster];
      const of = stills.length + (item.video ? 1 : 0);
      at[item.slug] = out.length;
      stills.forEach((src, i) =>
        out.push({ kind: "image", src, poster: item.poster, item, nth: i + 1, of }),
      );
      if (item.video) {
        out.push({ kind: "video", src: item.video, poster: item.poster, item, nth: of, of });
      }
    }

    return { slides: out, entry: at };
  }, [items]);

  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** What had focus before the viewer opened, so Esc can hand it back. */
  const returnRef = useRef<HTMLElement | null>(null);

  const show = useCallback(
    (i: number) => {
      returnRef.current = document.activeElement as HTMLElement | null;
      setOpen(((i % slides.length) + slides.length) % slides.length);
    },
    [slides],
  );

  const step = useCallback(
    (by: number) =>
      setOpen((i) =>
        i === null ? i : (((i + by) % slides.length) + slides.length) % slides.length,
      ),
    [slides],
  );

  const dismiss = useCallback(() => {
    setOpen(null);
    returnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (open === null) return;

    // Arrow keys follow what the visitor SEES, not the array. In RTL the next
    // picture sits to the left, so ArrowLeft must advance — reading the live
    // document direction rather than the locale keeps this correct even if a
    // page ever mixes directions.
    const rtl = document.documentElement.dir === "rtl";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      else if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
      else if (e.key === "ArrowRight") step(rtl ? -1 : 1);
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);

    // Freeze the page behind the overlay. Restoring the previous value rather
    // than clearing it avoids stomping on anything else that locks scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step, dismiss]);

  const current = open === null ? null : slides[open];

  return (
    <>
      <ul className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const count = item.stills.length;
          return (
            <li key={item.slug} className="group">
              <button
                type="button"
                onClick={() => show(entry[item.slug])}
                aria-label={item.video ? t.play(item.title) : t.open(item.title)}
                className="block w-full overflow-hidden rounded-lg border b-ink bg-paper-dim text-start transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--color-primary-container)] hover:shadow-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-surface-lowest">
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
                  />
                  {/* Two stops, not three: the label sits on the lower third,
                      and a mid stop would grey the middle of the picture. */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/15 to-transparent" />

                  {(count > 1 || item.video) && (
                    <span className="pointer-events-none absolute top-3 start-3 inline-flex items-center gap-1.5 rounded-full border b-gold bg-surface/75 px-2.5 py-1 text-[10.5px] font-semibold text-primary backdrop-blur">
                      <Icon
                        name={item.video ? "play" : "image"}
                        className="size-3"
                        strokeWidth={item.video ? 0 : 2}
                      />
                      {item.video ? t.clip : t.photos(count)}
                    </span>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
                    <p className="mb-1.5 text-[11px] font-semibold text-primary-container">
                      {item.activity}
                    </p>
                    <h3 className="text-[14.5px] font-bold leading-[1.7] text-text-primary">
                      {item.title}
                    </h3>
                  </div>

                  {/* Grows out of the card on hover instead of sitting there
                      permanently, so a still card stays a picture. */}
                  <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="grid size-14 place-items-center rounded-full border b-gold bg-surface/70 text-primary backdrop-blur">
                      <Icon
                        name={item.video ? "play" : "search"}
                        className={item.video ? "size-6 ps-1" : "size-5"}
                        strokeWidth={item.video ? 0 : 2}
                      />
                    </span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.viewer}
          className="fixed inset-0 z-[200] flex flex-col bg-[#050b12]/95 backdrop-blur-sm"
          // Clicking the backdrop closes; clicking the picture must not, so the
          // media wrapper below stops the event.
          onClick={dismiss}
        >
          <div className="flex items-start justify-between gap-4 p-4 md:p-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-primary-container">
                {current.item.activity}
              </p>
              <h3 className="truncate text-[14px] font-bold text-text-primary md:text-[16px]">
                {current.item.title}
              </h3>
              {current.of > 1 && (
                <p className="tnum mt-0.5 text-[11.5px] text-text-muted">
                  {current.nth} / {current.of}
                </p>
              )}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={dismiss}
              aria-label={t.close}
              className="grid size-10 shrink-0 place-items-center rounded-full border b-soft bg-surface-panel text-text-primary transition-colors hover:border-[color:var(--color-primary)] hover:text-primary"
            >
              <Icon name="close" className="size-5" strokeWidth={2} />
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-3 pb-6 md:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            {current.kind === "video" ? (
              /* No <track>: the clips are silent b-roll with the audio
                 stripped at transcode, so there is no speech to caption. */
              <video
                key={current.src}
                src={current.src}
                poster={current.poster}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : (
              <Image
                key={current.src}
                src={current.src}
                alt={current.item.title}
                width={1100}
                height={1467}
                sizes="100vw"
                priority
                className="max-h-[78vh] w-auto rounded-lg object-contain"
              />
            )}

            {slides.length > 1 && (
              <>
                {/* start/end, not left/right: these swap with the document
                    direction, matching the arrow-key mapping above. */}
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t.prev}
                  className="absolute start-0 grid size-11 place-items-center rounded-full border b-soft bg-surface/80 text-text-primary backdrop-blur transition-colors hover:border-[color:var(--color-primary)] hover:text-primary"
                >
                  <Icon name="chevron" className="size-5 rotate-180 rtl:rotate-0" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t.next}
                  className="absolute end-0 grid size-11 place-items-center rounded-full border b-soft bg-surface/80 text-text-primary backdrop-blur transition-colors hover:border-[color:var(--color-primary)] hover:text-primary"
                >
                  <Icon name="chevron" className="size-5 rtl:rotate-180" strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
