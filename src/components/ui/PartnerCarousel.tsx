import Image from "next/image";
import { partnerRows } from "@/content/partners";
import { AutoCarousel } from "./AutoCarousel";

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
    <div className="space-y-4">
      {partnerRows.map((row, rowIndex) => (
        <AutoCarousel
          key={rowIndex}
          reverse={rowIndex === 1}
          speed={rowIndex === 0 ? 0.35 : 0.3}
          ariaLabel={rowIndex === 0 ? "شركاء النجاح" : undefined}
        >
          {row.map((partner) => (
            <div
              key={partner.file}
              title={partner.name}
              className="flex h-[104px] w-[176px] shrink-0 items-center justify-center rounded-xl border b-soft bg-white p-3 opacity-85 saturate-[0.8] transition duration-300 hover:scale-[1.04] hover:opacity-100 hover:saturate-100 sm:h-[112px] sm:w-[192px]"
            >
              {/*
                Fill the padded tile rather than cap at a fixed height. The
                previous max-h-[56px] was the binding constraint for every logo,
                so tall and square marks rendered far smaller than their tile and
                looked lost in it. object-contain still prevents any distortion —
                the padding, not a magic number, sets the breathing room.
              */}
              <Image
                src={`/partners/${partner.file}.png`}
                alt={partner.name}
                width={320}
                height={180}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </AutoCarousel>
      ))}
    </div>
  );
}
