import { prisma } from "@/lib/prisma";
import { renderResumePdf } from "@/lib/resume-doc/render";
import { requireUser, apiError } from "@/lib/session";
import type { ResumeContent } from "@/lib/types";

export const runtime = "nodejs";

function safeFilename(title: string) {
  const base = title.replace(/[^\w\- ]+/g, "").trim() || "resume";
  return `${base}.pdf`;
}

/**
 * Renders the current content on every request. The editor previews the same
 * component client-side, so this can never serve a stale or different layout.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return new Response("Not found", { status: 404 });

    const template = await prisma.resumeTemplate.findFirst({
      where: { id: resume.templateId },
      select: { slug: true },
    });

    const { pdf, text } = await renderResumePdf({
      content: resume.contentJson as ResumeContent,
      templateSlug: template?.slug,
      title: resume.title,
    });

    if (resume.plainText !== text) {
      await prisma.resume.update({ where: { id }, data: { plainText: text } }).catch(() => undefined);
    }

    const download = new URL(request.url).searchParams.get("download");
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Disposition": download
          ? `attachment; filename="${safeFilename(resume.title)}"`
          : "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
