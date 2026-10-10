import type { Metadata } from "next";
import { TemplateGallery } from "@/components/gallery/template-gallery";
import { listPublishedTemplates } from "@/lib/templates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resume Template Gallery",
  description: "Swipe real ATS-safe LaTeX resume templates and edit or AI-match them to a job.",
  robots: { index: false, follow: false },
};

export default async function GalleryPage() {
  const templates = await listPublishedTemplates();
  return (
    <TemplateGallery
      initialTemplates={templates.map((template) => ({
        id: template.id,
        slug: template.slug,
        name: template.name,
        category: template.category,
        description: template.description ?? "",
        thumbnailUrl: template.thumbnailUrl,
        atsSafe: template.atsSafe,
      }))}
    />
  );
}
