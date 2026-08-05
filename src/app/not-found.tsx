import { Button } from "@/components/ui/Button";
import { notFoundCopy } from "@/content/site";

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden bg-surface">
      <div className="blueprint absolute inset-0" />
      <div className="alta-container relative flex min-h-[520px] flex-col items-center justify-center py-24 text-center">
        <p className="tnum font-display text-[76px] font-extrabold leading-none text-primary/25 md:text-[110px]">
          404
        </p>
        <h1 className="mt-4 font-display text-[26px] font-bold text-text-primary md:text-[36px]">
          {notFoundCopy.title}
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-[1.9] text-text-muted">
          {notFoundCopy.body}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href="/" size="lg" withArrow>
            {notFoundCopy.primary}
          </Button>
          <Button href="/services" variant="secondary" size="lg">
            {notFoundCopy.secondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
