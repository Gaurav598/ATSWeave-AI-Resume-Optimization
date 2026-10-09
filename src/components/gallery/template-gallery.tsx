"use client";

import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { ChevronLeft, ChevronRight, Sparkles, PenLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  thumbnailUrl: string;
  atsSafe: boolean;
};

function editorUrl(templateId: string) {
  return `/editor/new?templateId=${encodeURIComponent(templateId)}&mode=manual&source=example`;
}

export function TemplateGallery({
  initialTemplates = [],
}: {
  initialTemplates?: Template[];
}) {
  const { data: templates = initialTemplates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      const data = await res.json();
      return Array.isArray(data) ? (data as Template[]) : [];
    },
    initialData: initialTemplates.length ? initialTemplates : undefined,
  });

  const plugins = useMemo(() => [WheelGesturesPlugin({ forceWheelAxis: "x" })], []);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      skipSnaps: false,
      dragFree: false,
      containScroll: false,
      duration: 18,
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
  }, [emblaApi, onSelect, templates.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") emblaApi?.scrollNext();
      if (event.key === "ArrowLeft") emblaApi?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emblaApi]);

  const current = templates[selected];

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col overflow-hidden text-foreground">
      <div className="desk-wood pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 pb-8 pt-5 sm:px-6">
        <div className="mb-4 text-center md:mb-5">
          <p className="eyebrow">Template gallery</p>
          <h1 className="mt-3 font-display text-3xl text-[#f6efe4] md:text-4xl">Swipe left or right</h1>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-white/60">
            Click a resume to edit it. Use the arrows, dots, or press ← → to browse.
          </p>
        </div>

        {templates.length === 0 && (
          <div className="flex flex-1 items-center justify-center gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-[min(72vh,780px)] aspect-[8.5/11] rounded-xl bg-white shadow-xl",
                  i === 1 ? "scale-100" : "hidden scale-90 opacity-50 sm:block",
                )}
              />
            ))}
          </div>
        )}

        {templates.length > 0 && (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <button
              type="button"
              aria-label="Previous template"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-0 top-[42%] z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground sm:left-2 sm:h-14 sm:w-14"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next template"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-0 top-[42%] z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground sm:right-2 sm:h-14 sm:w-14"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="min-h-0 flex-1 cursor-grab overflow-hidden px-10 sm:px-16" ref={emblaRef}>
              <div className="flex h-[min(72vh,820px)] items-center">
                {templates.map((template, index) => {
                  const isCenter = selected === index;
                  return (
                    <div
                      key={template.id}
                      className="flex h-full min-w-0 shrink-0 grow-0 basis-[92%] justify-center px-2 sm:basis-[70%] sm:px-3 lg:basis-[52%] xl:basis-[44%]"
                    >
                      <Link
                        href={editorUrl(template.slug)}
                        aria-label={`Edit ${template.name}`}
                        className={cn(
                          "h-full max-w-full text-left transition duration-300",
                          isCenter ? "scale-100 opacity-100" : "scale-[0.92] opacity-60 hover:opacity-90",
                        )}
                      >
                        <div
                          className={cn(
                            "relative h-full overflow-hidden rounded-xl border border-black/10 bg-white",
                            isCenter && "ring-2 ring-accent/40",
                          )}
                          style={{
                            aspectRatio: "8.5 / 11",
                            boxShadow: isCenter
                              ? "0 40px 70px -20px rgba(0,0,0,0.72)"
                              : "0 18px 36px -20px rgba(0,0,0,0.5)",
                          }}
                        >
                          <TemplateThumbnail
                            slug={template.slug}
                            name={template.name}
                            eager={Math.abs(index - selected) <= 2 || templates.length < 6}
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
          </div>
        )}

        {current && (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="text-center">
              <div className="font-display text-2xl text-[#f6efe4] md:text-3xl">{current.name}</div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {current.atsSafe && <Badge variant="accent">ATS-Safe</Badge>}
                <Badge variant="outline">{current.category}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {templates.map((t, i) => (
                <button
                  key={t.id}
                  aria-label={`Go to ${t.name}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === selected ? "w-8 bg-accent" : "w-2 bg-white/25 hover:bg-white/45",
                  )}
                />
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href={editorUrl(current.id)}>
                  <PenLine className="h-4 w-4" /> Use {current.name}
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/match/${current.id}`}>
                  <Sparkles className="h-4 w-4" /> Build with AI
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
