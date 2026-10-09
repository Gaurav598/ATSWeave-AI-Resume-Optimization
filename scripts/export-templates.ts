import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

async function main() {
  const mod = await import("../prisma/data/templates-catalog");
  const templates = mod.templates;
  const dir = path.join(process.cwd(), "prisma", "data", "templates");
  mkdirSync(dir, { recursive: true });

  for (const [index, template] of templates.entries()) {
    const payload = {
      ...template,
      sortOrder: index,
      published: true,
    };
    writeFileSync(path.join(dir, `${template.slug}.json`), JSON.stringify(payload, null, 2));
  }

  writeFileSync(
    path.join(process.cwd(), "prisma", "data", "templates-index.json"),
    JSON.stringify(
      templates.map((t: { slug: string }) => t.slug),
      null,
      2,
    ),
  );

  console.log(`Exported ${templates.length} templates to prisma/data/templates/*.json`);
}

main();
