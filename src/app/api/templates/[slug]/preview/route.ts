import { exampleResume } from "@/lib/example-content";
import { renderResumePdf } from "@/lib/resume-doc/render";
import { isKnownTemplateSlug } from "@/lib/resume-doc/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only cached in production; in development every request re-renders so
// template edits show up immediately.
const cache = new Map<string, Buffer>();

/**
 * Public preview of a template, rendered from the shared example content by the
 * same component that renders a user's resume. The gallery therefore shows the
 * real template rather than a screenshot that can drift from it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isKnownTemplateSlug(slug)) return new Response("Unknown template", { status: 404 });

  let pdf = cache.get(slug);
  if (!pdf) {
    const rendered = await renderResumePdf({
      content: exampleResume(),
      templateSlug: slug,
      title: `${slug} template preview`,
    });
    pdf = rendered.pdf;
    cache.set(slug, pdf);
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}-example.pdf"`,
      "X-Template-Slug": slug,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      Vary: "Accept",
    },
  });
}
