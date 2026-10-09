"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PdfSource = { kind: "blob"; blob: Blob } | { kind: "url"; url: string };

let workerReady = false;

/**
 * Metrics for the 14 standard PDF fonts, copied into `public/` by
 * `scripts/copy-pdfjs-assets.mjs`. Without these pdf.js substitutes a fallback
 * face and lays text out at the wrong size and position.
 */
const STANDARD_FONT_DATA_URL = "/pdfjs/standard_fonts/";

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    workerReady = true;
  }
  return pdfjs;
}

const blobIds = new WeakMap<Blob, number>();
let nextBlobId = 1;
function idForBlob(blob: Blob) {
  const existing = blobIds.get(blob);
  if (existing) return existing;
  const id = nextBlobId++;
  blobIds.set(blob, id);
  return id;
}

async function bytesFrom(source: PdfSource): Promise<Uint8Array> {
  if (source.kind === "blob") {
    return new Uint8Array(await source.blob.arrayBuffer());
  }
  const res = await fetch(source.url, { cache: "no-store", credentials: "same-origin" });
  if (!res.ok) throw new Error(`Preview failed (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * Paints a PDF onto a canvas at the container's width.
 *
 * Bytes are fetched by this component and handed to pdf.js as `data`, so two
 * cards can never paint each other's file from a shared URL cache.
 */
export function PdfCanvas({
  source,
  className,
  maxPages = 1,
  onPageCount,
}: {
  source: PdfSource | null;
  className?: string;
  maxPages?: number;
  onPageCount?: (count: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const renderToken = useRef(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sourceKey =
    source == null
      ? ""
      : source.kind === "url"
        ? source.url
        : `blob:${idForBlob(source.blob)}`;

  useEffect(() => {
    if (!source || !width) return;
    const container = containerRef.current;
    if (!container) return;

    const token = ++renderToken.current;
    let cancelled = false;
    setStatus("loading");
    container.replaceChildren();

    void (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const data = await bytesFrom(source);
        if (cancelled || token !== renderToken.current) return;

        const doc = await pdfjs.getDocument({
          data,
          standardFontDataUrl: STANDARD_FONT_DATA_URL,
        }).promise;
        if (cancelled || token !== renderToken.current) return;

        onPageCount?.(doc.numPages);
        const pageCount = Math.min(doc.numPages, maxPages);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvases: HTMLCanvasElement[] = [];

        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          const page = await doc.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          if (pageNumber > 1) canvas.style.marginTop = "12px";

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          await page.render({ canvasContext: context, viewport } as never).promise;
          if (cancelled || token !== renderToken.current) return;
          canvases.push(canvas);
        }

        if (cancelled || token !== renderToken.current) return;
        container.replaceChildren(...canvases);
        setStatus("ready");
      } catch {
        if (cancelled || token !== renderToken.current) return;
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceKey, width, maxPages, onPageCount, source]);

  return (
    <div className={cn("relative w-full", className)}>
      <div ref={containerRef} className="w-full" />
      {status !== "ready" ? (
        <div className="absolute inset-0 bg-white px-[10%] py-[12%]">
          {status === "error" ? (
            <p className="text-xs text-neutral-400">Preview unavailable</p>
          ) : (
            <div className="space-y-2">
              <div className="h-2.5 w-2/5 rounded bg-neutral-200" />
              <div className="h-1.5 w-3/5 rounded bg-neutral-100" />
              <div className="mt-5 space-y-1.5">
                <div className="h-1.5 w-full rounded bg-neutral-100" />
                <div className="h-1.5 w-[92%] rounded bg-neutral-100" />
                <div className="h-1.5 w-[85%] rounded bg-neutral-100" />
                <div className="h-1.5 w-full rounded bg-neutral-100" />
                <div className="h-1.5 w-[70%] rounded bg-neutral-100" />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
