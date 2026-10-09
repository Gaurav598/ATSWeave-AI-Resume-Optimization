import { prisma } from "@/lib/prisma";
import { injectLatex } from "@/lib/latex/inject";
import { requireUser, apiError } from "@/lib/session";
import type { ResumeContent } from "@/lib/types";

/**
 * Generated from the template and the current content on every request, so the
 * .tex export always matches what the editor is showing.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return new Response("Not found", { status: 404 });

    const template = await prisma.resumeTemplate.findFirst({
      where: { id: resume.templateId },
      select: { latexSource: true },
    });
    const latex = template?.latexSource
      ? injectLatex(template.latexSource, resume.contentJson as ResumeContent)
      : resume.latexSource;

    return new Response(latex, {
      headers: {
        "Content-Type": "application/x-tex; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resume.title.replace(/[^\w\- ]+/g, "") || "resume"}.tex"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
