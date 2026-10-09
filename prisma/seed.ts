import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TemplateJson = {
  slug: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  sourceUrl?: string;
  latexSource: string;
  sortOrder?: number;
  published?: boolean;
};

async function main() {
  const dir = path.join(process.cwd(), "prisma", "data", "templates");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    throw new Error("No template JSON files in prisma/data/templates — run scripts/export-templates.ts first");
  }

  await prisma.resumeTemplate.deleteMany();

  for (const file of files) {
    const raw = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as TemplateJson;
    await prisma.resumeTemplate.create({
      data: {
        slug: raw.slug,
        name: raw.name,
        thumbnailUrl: raw.thumbnailUrl,
        latexSource: raw.latexSource,
        category: raw.category,
        description: raw.description,
        sourceUrl: raw.sourceUrl ?? null,
        sourceRepo: raw.sourceUrl ?? null,
        atsSafe: true,
        sortOrder: raw.sortOrder ?? 0,
        published: raw.published ?? true,
      },
    });
  }

  console.log(`Seeded ${files.length} templates from prisma/data/templates/*.json into the database`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });
