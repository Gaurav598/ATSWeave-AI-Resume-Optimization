"use client";

import { PdfCanvas } from "@/components/resume/pdf-canvas";
import { cn } from "@/lib/utils";

/**
 * Paper that shows a rendered resume PDF. Keeps the last good render on screen
 * while a new one is generated so typing never flashes blank.
 */
export function ResumePdfFrame({
  blob,
  rendering,
  error,
  empty,
  emptyHint,
  className,
  pages = 2,
}: {
  blob: Blob | null;
  rendering?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyHint?: string;
  className?: string;
  pages?: number;
}) {
  return (
    <div className={cn("relative", className)}>
      {rendering ? (
        <div className="pointer-events-none absolute inset-x-0 -top-0.5 z-20 h-0.5 overflow-hidden rounded-full">
          <div className="shimmer h-full w-full bg-accent/60" />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-sm border border-border bg-white shadow-sm">
        {blob ? (
          <PdfCanvas source={{ kind: "blob", blob }} maxPages={pages} />
        ) : (
          <div
            className="grid w-full place-items-center bg-white"
            style={{ aspectRatio: "8.5 / 11" }}
          >
            <p className="text-xs text-neutral-400">
              {error ? "Preview could not be rendered" : "Preparing preview…"}
            </p>
          </div>
        )}
      </div>

      {empty && blob ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/85 px-8 text-center">
          <div>
            <p className="text-sm font-medium text-neutral-700">Your resume is empty</p>
            <p className="mt-1 text-xs text-neutral-500">
              {emptyHint || "Fill the form and this page updates as you type."}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
