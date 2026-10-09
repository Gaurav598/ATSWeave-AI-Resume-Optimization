"use client";

import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";
import { cn } from "@/lib/utils";

const SLIDES = [
  { slug: "jakes", name: "Jake's" },
  { slug: "sb2nov", name: "sb2nov" },
  { slug: "deedy-safe", name: "Deedy" },
  { slug: "engineeringresumes", name: "Engineering" },
  { slug: "harvard", name: "Harvard" },
  { slug: "moderncv", name: "ModernCV" },
];

export function LandingResumeSlider({ className }: { className?: string }) {
  const plugins = useMemo(() => [WheelGesturesPlugin({ forceWheelAxis: "x" })], []);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      skipSnaps: false,
      duration: 22,
      watchDrag: false,
    },
    plugins,
  );
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className={cn("relative w-full", className)}>
      <button
        type="button"
        aria-label="Previous resume"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-0 top-[46%] z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground sm:left-1 sm:h-14 sm:w-14"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        aria-label="Next resume"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-0 top-[46%] z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground sm:right-1 sm:h-14 sm:w-14"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="cursor-grab overflow-hidden px-10 sm:px-16" ref={emblaRef}>
        <div className="flex h-[min(68vh,760px)] items-center">
          {SLIDES.map((slide, index) => {
            const isCenter = selected === index;
            const href = `/editor/new?templateId=${encodeURIComponent(slide.slug)}&mode=manual&source=example`;
            return (
              <div
                key={slide.slug}
                className="flex h-full min-w-0 shrink-0 grow-0 basis-[90%] justify-center px-2 sm:basis-[64%] lg:basis-[48%]"
              >
                <Link
                  href={href}
                  aria-label={`Edit ${slide.name}`}
                  className={cn(
                    "h-full max-w-full text-left transition duration-300",
                    isCenter ? "scale-100 opacity-100" : "scale-[0.9] opacity-55",
                  )}
                >
                  <div
                    className={cn(
                      "relative h-full overflow-hidden rounded-xl border border-black/10 bg-white",
                      isCenter && "ring-2 ring-accent/35",
                    )}
                    style={{
                      aspectRatio: "8.5 / 11",
                      boxShadow: isCenter
                        ? "0 40px 70px -20px rgba(0,0,0,0.72)"
                        : "0 18px 36px -20px rgba(0,0,0,0.5)",
                    }}
                  >
                    <TemplateThumbnail
                      slug={slide.slug}
                      name={slide.name}
                      eager={Math.abs(index - selected) <= 2}
                      fill
                      className="absolute inset-0 h-full"
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.slug}
            type="button"
            aria-label={`Show ${slide.name}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === selected ? "w-8 bg-accent" : "w-2 bg-white/25 hover:bg-white/45",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-white/65">
        Click a page to edit it · use arrows, dots, or a trackpad swipe
      </p>
    </div>
  );
}
