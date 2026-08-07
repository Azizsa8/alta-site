import Image from "next/image";
import { partnerRows } from "@/content/partners";
import { AutoCarousel } from "./AutoCarousel";

/**
 * Asset generation for the logo sheet.
 *
 * netlify.toml serves `*.png` with `max-age=31536000, immutable`, which is a
 * promise that the bytes at a URL will never change. Re-cutting the artwork
 * under the same filenames therefore does NOT reach anyone holding a cached
 * copy — not the CDN, not a returning visitor — for a year. The version lives
 * in the path so the promise stays true and a new cut is simply a new URL.
 *
 * Bump this when the logo files are re-cut, and move the new files into the
 * matching folder under public/partners/.
 */
const ASSETS = "v2";

/**
 * Partner logo carousel.
 *
 * Two rows scrolling in opposite directions, seamlessly looping. The loop is
 * achieved by rendering each row TWICE and translating by exactly -50%: at the
 * end of the animation the second copy sits precisely where the first began,
 * so the restart is invisible.
 *
 * The duplicate copies are aria-hidden — a screen reader should hear each
 * partner once, not twice.
 *
 * On tiles, on the midnight band.
 *
 * Two treatments were tried and rejected before this one. Dropping the tile so
 * the marks sat directly on the page fails because the artwork is opaque: each
 * file is a filled rectangle, so removing the tile in markup removes nothing.
 * Lifting the whole band to a light surface hides the rectangles, but puts a
 * white slab through the middle of a midnight-and-gold site.
 *
 * Knocking the background out per-file is not available either: the sheet is
 * inconsistent. Roughly a dozen marks sit on white, but stc, Lilly, Nabatat,
 * King Saud University and Petlas ship with solid COLOURED blocks baked in, so
 * a luminance keyed alpha would turn stc's purple panel into a solid silhouette
 * rather than clearing it.
 *
 * So the tile stays — the client's objection was its proportion, "a huge white
 * block with a small logo inside", not its existence. The mark now fills the
 * tile, the tile is warm off-white rather than pure white, it carries the same
 * gold hairline and radius as every other card on the site, and it sits on the
 * dark band where it reads as a deliberate plate instead of a hole.
 */
export function PartnerCarousel() {
  return (
    <div className="space-y-2 sm:space-y-4">
      {partnerRows.map((row, rowIndex) => (
        <AutoCarousel
          key={rowIndex}
          reverse={rowIndex === 1}
          speed={rowIndex === 0 ? 0.35 : 0.3}
          ariaLabel={rowIndex === 0 ? "شركاء النجاح" : undefined}
          // Tighter fade than the default: the band runs edge to edge, so the
          // rows should stay legible closer to the viewport margins.
          mask="[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
        >
          {row.map((partner) => (
            <div
              key={partner.file}
              title={partner.name}
              /*
               * Warm off-white, not #fff: against a midnight band pure white
               * is the brightest thing on the page and pulls the eye to the
               * plate rather than the mark.
               *
               * No container opacity. An earlier `opacity-90` let the dark
               * band through the plate and turned every tile a muddy grey —
               * the tiles read as switched-off rather than as paper. Restraint
               * belongs on the artwork (saturate) not on the surface.
               */
              className="flex h-[84px] w-[164px] shrink-0 items-center justify-center rounded-lg border b-gold bg-[#f7f5f0] p-2.5 saturate-[0.95] transition duration-300 hover:-translate-y-0.5 hover:saturate-100 hover:shadow-gold sm:h-[96px] sm:w-[188px] sm:p-3"
            >
              <Image
                src={`/partners/${ASSETS}/${partner.file}.png`}
                alt={partner.name}
                width={320}
                height={180}
                loading="lazy"
                /*
                 * multiply against the tile, NOT against the page.
                 *
                 * The files are opaque, so their own white corners would
                 * otherwise sit a shade brighter than the warm tile behind
                 * them and show as a rectangle inside a rectangle. Multiplying
                 * onto the off-white plate maps that white to the tile colour
                 * exactly, so plate and artwork become one surface.
                 *
                 * This only works because the tile is light. The same blend
                 * directly on the midnight band would crush every mark to
                 * black — which is precisely what the tile is preventing.
                 *
                 * Fills the slot rather than capping at a fixed height, so a
                 * tall mark and a wide one both use the space available;
                 * object-contain still prevents distortion.
                 */
                className="h-full w-full object-contain mix-blend-multiply"
              />
            </div>
          ))}
        </AutoCarousel>
      ))}
    </div>
  );
}
