import Image from "next/image";
import { partnerRows } from "@/content/partners";

/**
 * Partner logo carousel.
 *
 * Two rows scrolling in opposite directions, seamlessly looping. The loop is
 * achieved by rendering each row TWICE and translating by exactly -50%: at the
 * end of the animation the second copy sits precisely where the first began,
 * so the restart is invisible. Duplicating is why the width must be `w-max`
 * rather than a percentage.
 *
 * The duplicate copies are aria-hidden — a screen reader should hear each
 * partner once, not twice.
 *
 * The logos are supplied on white, so they sit on white tiles exactly as on
 * the approved sheet. They render at reduced saturation and come to full
 * colour on hover, which keeps eighteen competing brand palettes from
 * overwhelming the midnight page.
 */
export function PartnerCarousel() {
  return (
    <div
      className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      aria-label="شركاء النجاح"
    >
      {partnerRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex w-max gap-4 py-3 ${
            rowIndex === 0 ? "marquee-track" : "marquee-track-reverse"
          }`}
        >
          {[...row, ...row].map((partner, i) => (
            <div
              key={`${partner.file}-${i}`}
              aria-hidden={i >= row.length}
              title={partner.name}
              className="flex h-[92px] w-[168px] shrink-0 items-center justify-center rounded-xl border b-soft bg-white p-4 opacity-80 saturate-[0.75] transition duration-300 hover:scale-[1.04] hover:opacity-100 hover:saturate-100"
            >
              <Image
                src={`/partners/${partner.file}.png`}
                alt={i >= row.length ? "" : partner.name}
                width={320}
                height={180}
                loading="lazy"
                className="h-auto max-h-[60px] w-auto max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
