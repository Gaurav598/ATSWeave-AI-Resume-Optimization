import { prisma } from "@/lib/prisma";

/** Runtime templates always come from the database — never from hardcoded source. */
export async function listPublishedTemplates() {
  return prisma.resumeTemplate.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      thumbnailUrl: true,
      category: true,
      description: true,
      sourceUrl: true,
      atsSafe: true,
      sortOrder: true,
    },
  });
}

export async function getTemplateByIdOrSlug(idOrSlug: string) {
  return prisma.resumeTemplate.findFirst({
    where: {
      published: true,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}
