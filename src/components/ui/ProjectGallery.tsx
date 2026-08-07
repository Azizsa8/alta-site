"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./Icon";

export type GalleryItem = {
  slug: string;
  title: string;
  activity: string;
  poster: string;
  stills: string[];
  video: string | null;
};

/**
 * Documented-work gallery.
 *
 * The source material is phone footage and phone photographs, most of it
 * portrait. Cards are therefore a 3:4 portrait frame with `object-cover`:
 * a landscape frame would letterbox eight of the nine assets, and cropping a
 * vertical shot to a wide strip throws away the part of the picture that
 * actually shows the work.
 *
 * Video is opt-in per card. Nothing downloads until the visitor presses play,
 * so a page carrying seven clips still costs one poster image each on load.
 */
export function ProjectGallery({ items }: { items: GalleryItem[] }) {
  /** slug of the card currently playing, or null. One at a time. */
  const [playing, setPlaying] = useState<string | null>(null);
  /** slug -> index into that card's `stills`. */
  const [frame, setFrame] = useState<Record<string, number>>({});

  return (
    // Four columns from xl. There are seven documented projects: in three
    // columns that leaves the last card stranded beside two empty thirds,
    // which at a 3:4 card height is a conspicuous hole. 4+3 reads as a block.
    <ul className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const isPlaying = playing === item.slug;
        const shown = item.stills.length
          ? item.stills[(frame[item.slug] ?? 0) % item.stills.length]
          : item.poster;

        return (
          <li
            key={item.slug}
            className="group overflow-hidden rounded-lg border b-ink bg-paper-dim transition-colors hover:border-[color:var(--color-primary-container)]"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-lowest">
              {isPlaying && item.video ? (
                /* No <track>: the clips are silent b-roll with the audio
                   stripped at transcode, so there is no speech to caption. */
                <video
                  src={item.video}
                  poster={item.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Image
                    src={shown}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />

                  {item.video && (
                    <button
                      type="button"
                      onClick={() => setPlaying(item.slug)}
                      aria-label={`تشغيل مقطع ${item.title}`}
                      className="absolute inset-0 grid place-items-center"
                    >
                      <span className="grid size-14 place-items-center rounded-full border b-gold bg-surface/70 text-primary backdrop-blur transition-transform duration-300 group-hover:scale-110">
                        {/* ps-1 optically centres the triangle: a play glyph's
                            visual mass sits left of its bounding box. */}
                        <Icon name="play" className="size-6 ps-1" strokeWidth={0} />
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="p-5">
              <p className="mb-1.5 text-[11px] font-semibold text-gold-ink">
                {item.activity}
              </p>
              <h3 className="text-[14px] font-bold leading-[1.7] text-ink">
                {item.title}
              </h3>

              {item.stills.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.stills.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFrame((f) => ({ ...f, [item.slug]: i }))}
                      aria-label={`صورة ${i + 1} من ${item.stills.length}`}
                      aria-current={(frame[item.slug] ?? 0) === i}
                      className={`h-1.5 rounded-full transition-all ${
                        (frame[item.slug] ?? 0) === i
                          ? "w-6 bg-primary-container"
                          : "w-3 bg-ink-muted/35 hover:bg-ink-muted/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
