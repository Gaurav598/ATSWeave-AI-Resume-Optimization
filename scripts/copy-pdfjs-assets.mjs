/**
 * Copies pdf.js standard font metrics into public/.
 *
 * pdf.js needs these to draw the 14 standard PDF fonts; without them it
 * substitutes a fallback face and text lands in the wrong place. Runs on
 * postinstall so a fresh clone works without a manual step.
 */
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function main() {
  const pkg = require.resolve("pdfjs-dist/package.json");
  const from = path.join(path.dirname(pkg), "standard_fonts");
  const to = path.join(process.cwd(), "public", "pdfjs", "standard_fonts");

  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true });
  console.log(`Copied pdf.js standard fonts to ${path.relative(process.cwd(), to)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
