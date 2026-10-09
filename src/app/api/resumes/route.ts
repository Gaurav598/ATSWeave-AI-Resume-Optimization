import { prisma } from "@/lib/prisma";
import { injectLatex } from "@/lib/latex/inject";
import {
  isProfileReady,
  manualStartingContent,
  profileToContent,
  type ManualSource,
} from "@/lib/resume-content";
import { requireUser, apiError } from "@/lib/session";
import { getTemplateByIdOrSlug } from "@/lib/templates";

export async function GET() {
  try {
    const user = await requireUser();
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    const templateIds = [...new Set(resumes.map((r) => r.templateId))];
    const templates = templateIds.length
      ? await prisma.resumeTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, slug: true, name: true, thumbnailUrl: true, category: true },
        })
      : [];
    const byId = new Map(templates.map((t) => [t.id, t]));
    return Response.json(resumes.map((resume) => ({ ...resume, template: byId.get(resume.templateId) ?? null })));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    // Tailoring one base resume per job is the common workflow, so copying an
    // existing one keeps its template, content and job description together.
    if (typeof body.duplicateOf === "string" && body.duplicateOf) {
      const source = await prisma.resume.findFirst({
        where: { id: body.duplicateOf, userId: user.id },
      });
      if (!source) return Response.json({ error: "Not found" }, { status: 404 });

      const copy = await prisma.resume.create({
        data: {
          userId: user.id,
          templateId: source.templateId,
          title: `${source.title} (copy)`,
          mode: source.mode,
          jobDescription: source.jobDescription,
          latexSource: source.latexSource,
          contentJson: source.contentJson ?? undefined,
          sourceContentJson: source.sourceContentJson ?? undefined,
          plainText: source.plainText,
          atsScore: source.atsScore,
        },
      });
      await prisma.resumeVersion.create({
        data: {
          resumeId: copy.id,
          latexSource: copy.latexSource,
          contentJson: copy.contentJson ?? undefined,
          note: "created",
        },
      });
      return Response.json(copy);
    }

    if (!body.templateId || typeof body.templateId !== "string") {
      return Response.json({ error: "templateId is required" }, { status: 400 });
    }
    const template = await getTemplateByIdOrSlug(body.templateId);
    if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

    const mode = body.mode === "ats_matched" ? "ats_matched" : "manual";
    const source: ManualSource =
      body.source === "profile" || body.source === "blank" || body.source === "example"
        ? body.source
        : "example";

    // Manual opens the same example the gallery rendered for that template.
    // AI matching always starts from the career profile — never the example person.
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    let content;
    if (mode === "ats_matched") {
      content = profileToContent(user, profile);
      if (!isProfileReady(content)) {
        return Response.json(
          { error: "Complete your career profile before using AI match.", code: "PROFILE_REQUIRED" },
          { status: 400 },
        );
      }
    } else {
      content = manualStartingContent(user, profile, source);
    }

    const latexSource = injectLatex(template.latexSource, content);
    const month = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        templateId: template.id,
        title: body.title || `${template.name} — ${month}`,
        mode,
        jobDescription: body.jobDescription,
        latexSource,
        contentJson: content as object,
      },
    });
    await prisma.resumeVersion.create({
      data: { resumeId: resume.id, latexSource, contentJson: content as object, note: "created" },
    });
    return Response.json({
      ...resume,
      template: {
        id: template.id,
        slug: template.slug,
        name: template.name,
        thumbnailUrl: template.thumbnailUrl,
        category: template.category,
        latexSource: template.latexSource,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
