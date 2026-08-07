import Image from "next/image";
import { partnerRows } from "@/content/partners";
import { AutoCarousel } from "./AutoCarousel";

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
 * There is deliberately NO tile behind each logo. The artwork is supplied on
 * white, and on the midnight page a white tile read as a large blank rectangle
 * with a small mark stranded in it. The fix is the surface, not the mark: this
 * component is designed to sit inside a `tone="bright"` band, where the logos
 * meet light ground directly and the tile has nothing left to do. Sizing is
 * therefore free to follow the artwork rather than a box it has to fit inside.
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
          // Tighter fade than the default: the band now runs edge to edge, so
          // the rows should stay legible closer to the viewport margins.
          mask="[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
        >
          {row.map((partner) => (
            <div
              key={partner.file}
              title={partner.name}
              className="flex h-[72px] w-[150px] shrink-0 items-center justify-center px-2 opacity-90 saturate-[0.9] transition duration-300 hover:scale-[1.06] hover:opacity-100 hover:saturate-100 sm:h-[88px] sm:w-[190px] sm:px-3"
            >
              <Image
                src={`/partners/${partner.file}.png`}
                alt={partner.name}
                width={320}
                height={180}
                loading="lazy"
                // Fills the slot rather than capping at a fixed height, so a
                // tall mark and a wide one both use the space available to
                // them. object-contain still prevents any distortion.
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </AutoCarousel>
      ))}
    </div>
  );
}
