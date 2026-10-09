/**
 * Debug helper: rasterises a template preview to a PNG so layout can be checked
 * without going through a browser screenshot.
 *
 * Usage: node scripts/render-preview-png.mjs <slug> [outfile]
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const slug = process.argv[2] ?? "ink";
const out = process.argv[3] ?? `tmp-${slug}.png`;

const origin = process.env.PREVIEW_ORIGIN ?? "http://localhost:3399";

const response = await fetch(`${origin}/api/templates/${slug}/preview`);
const data = new Uint8Array(await response.arrayBuffer());

// In Node pdf.js reads standard font data straight off disk, so this must be a
// filesystem path rather than a URL.
const standardFontDataUrl = fileURLToPath(
  new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url),
).replace(/\\/g, "/");

const doc = await pdfjs.getDocument({ data, standardFontDataUrl }).promise;

const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 2 });
const canvas = createCanvas(viewport.width, viewport.height);
const context = canvas.getContext("2d");
context.fillStyle = "#ffffff";
context.fillRect(0, 0, viewport.width, viewport.height);

await page.render({ canvasContext: context, viewport }).promise;

await writeFile(out, canvas.toBuffer("image/png"));
console.log(`wrote ${out} (${viewport.width}x${viewport.height})`);
