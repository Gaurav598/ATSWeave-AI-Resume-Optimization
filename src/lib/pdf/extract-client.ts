import { MAX_PDF_PAGES, normalizeExtractedText } from "@/lib/pdf/text";

/**
 * Browser-side PDF text extract using the same pdf.js build as the preview.
 * Falls back to `/api/ats/extract` when the worker cannot start.
 */
export async function extractPdfTextInBrowser(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({
    data,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }).promise;

  const pages: string[] = [];
  const n = Math.min(doc.numPages, MAX_PDF_PAGES);
  for (let i = 1; i <= n; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .filter(Boolean);
    pages.push(strings.join(" "));
  }
  return normalizeExtractedText(pages.join("\n\n"));
}
