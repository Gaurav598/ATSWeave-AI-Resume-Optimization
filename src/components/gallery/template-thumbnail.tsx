"use client";

import { useEffect, useRef, useState } from "react";
import { PdfCanvas } from "@/components/resume/pdf-canvas";
import { EXAMPLE_LABEL } from "@/lib/example-content";
import { cn } from "@/lib/utils";

/**
 * Real render of a template, produced by the same component that renders the
 * user's resume. Each instance is keyed by slug so two cards can never share a
 * painted page.
 */
export function TemplateThumbnail({
  slug,
  name,
  className,
  eager = false,
  showLabel = false,
  fill = false,
}: {
  slug: string;
  name?: string;
  className?: string;
  eager?: boolean;
  showLabel?: boolean;
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div className={className}>
      <div
        ref={ref}
        className={cn("relative overflow-hidden bg-white", fill ? "h-full w-full" : "w-full")}
        style={fill ? undefined : { aspectRatio: "8.5 / 11" }}
      >
        {visible ? (
          <PdfCanvas
            key={slug}
            source={{ kind: "url", url: `/api/templates/${encodeURIComponent(slug)}/preview` }}
            className="[&_canvas]:pointer-events-none"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-neutral-100" />
        )}
        {name ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-8">
            <p className={cn("truncate text-[11px] font-medium text-white")}>{name}</p>
          </div>
        ) : null}
      </div>
      {showLabel ? (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {name ? `${name} · ` : ""}
          {EXAMPLE_LABEL}
        </p>
      ) : null}
    </div>
  );
}
