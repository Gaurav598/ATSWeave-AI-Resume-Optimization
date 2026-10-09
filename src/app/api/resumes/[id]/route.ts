import { prisma } from "@/lib/prisma";
import { injectLatex } from "@/lib/latex/inject";
import { resumePlainText } from "@/lib/resume-doc/plain-text";
import { requireUser, apiError } from "@/lib/session";
import { getTemplateByIdOrSlug } from "@/lib/templates";
import type { ResumeContent } from "@/lib/types";

const AUTOSAVE_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Autosave fires constantly, so snapshotting every call would bury real history.
 * Explicit saves always snapshot; autosaves snapshot at most once per interval.
 */
async function snapshotIfDue(
  resumeId: string,
  latexSource: string,
  content: ResumeContent,
  note?: string,
) {
  const isAutosave = note === "autosave";
  if (isAutosave) {
    const latest = await prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < AUTOSAVE_SNAPSHOT_INTERVAL_MS) {
      return;
    }
  }
  await prisma.resumeVersion.create({
    data: {
      resumeId,
      latexSource,
      contentJson: content as object,
      note: isAutosave ? "edit" : note || "manual save",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: user.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });
    const template = await prisma.resumeTemplate.findFirst({
      where: { id: resume.templateId },
      select: {
        id: true,
        slug: true,
        name: true,
        thumbnailUrl: true,
        category: true,
        latexSource: true,
      },
    });
    return Response.json({ ...resume, template });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const content = (body.contentJson ?? existing.contentJson) as ResumeContent | null;
    if (!content || typeof content !== "object") {
      return Response.json({ error: "This resume has no content to save" }, { status: 400 });
    }
    let templateId = existing.templateId;
    let template = await prisma.resumeTemplate.findFirst({
      where: { id: existing.templateId },
      select: { id: true, slug: true, name: true, category: true, latexSource: true },
    });

    if (typeof body.templateId === "string" && body.templateId && body.templateId !== existing.templateId) {
      const next = await getTemplateByIdOrSlug(body.templateId);
      if (!next) return Response.json({ error: "Template not found" }, { status: 404 });
      templateId = next.id;
      template = {
        id: next.id,
        slug: next.slug,
        name: next.name,
        category: next.category,
        latexSource: next.latexSource,
      };
    }

    const latexSource =
      (body.contentJson || body.templateId) && template?.latexSource
        ? injectLatex(template.latexSource, content)
        : (body.latexSource ?? existing.latexSource);

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        templateId,
        latexSource,
        contentJson: content as object,
        jobDescription: body.jobDescription ?? existing.jobDescription,
        plainText: body.contentJson || body.templateId ? resumePlainText(content, template?.slug) : existing.plainText,
      },
    });

    if (body.contentJson || body.latexSource || body.templateId) {
      await snapshotIfDue(
        id,
        resume.latexSource,
        content,
        body.templateId && body.templateId !== existing.templateId
          ? `switched to ${template?.name ?? "template"}`
          : body.note,
      );
    }

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, note: true, createdAt: true },
    });

    return Response.json({
      ...resume,
      template: template
        ? {
            id: template.id,
            slug: template.slug,
            name: template.name,
            category: template.category,
          }
        : null,
      versions,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    // Scoped to the owner so a guessed id cannot delete someone else's resume.
    const { count } = await prisma.resume.deleteMany({ where: { id, userId: user.id } });
    if (!count) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
