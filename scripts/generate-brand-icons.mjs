import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#0ea5e9" />
    </linearGradient>
  </defs>
  <!-- Modern squircle background matching BrandMark -->
  <rect x="16" y="16" width="480" height="480" rx="136" fill="url(#bgGrad)" />
  
  <!-- Centered Lucide Layers3 icon with stroke matching BrandMark -->
  <g transform="translate(106, 106) scale(12.5)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
    <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
    <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
  </g>
</svg>
`;

async function main() {
  const root = process.cwd();
  const svgBuffer = Buffer.from(svg.trim());

  // 1. 512x512 logo
  const logo512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  await fs.writeFile(path.join(root, "public", "logo.png"), logo512);

  // 2. App icon (Next.js automatically uses src/app/icon.png as favicon / app icon)
  const icon128 = await sharp(svgBuffer).resize(128, 128).png().toBuffer();
  await fs.writeFile(path.join(root, "src", "app", "icon.png"), icon128);

  // 3. Apple touch icon
  const appleIcon = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  await fs.writeFile(path.join(root, "src", "app", "apple-icon.png"), appleIcon);

  // 4. Also write favicon.ico in public
  const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  await fs.writeFile(path.join(root, "public", "favicon.ico"), favicon32);
  await fs.writeFile(path.join(root, "src", "app", "favicon.ico"), favicon32);

  console.log("Brand icons successfully generated!");
}

main().catch(console.error);
