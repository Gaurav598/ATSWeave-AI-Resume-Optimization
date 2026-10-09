import { prisma } from "@/lib/prisma";
import { requireUser, apiError } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, note: true, createdAt: true },
    });
    return Response.json(versions);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });

    const version = await prisma.resumeVersion.findFirst({
      where: { id: body.restoreId, resumeId: id },
    });
    if (!version) return Response.json({ error: "Version not found" }, { status: 404 });

    // Snapshot what is on screen now so restoring is itself undoable.
    await prisma.resumeVersion.create({
      data: {
        resumeId: id,
        latexSource: resume.latexSource,
        contentJson: (resume.contentJson ?? undefined) as object | undefined,
        note: "before restore",
      },
    });

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        latexSource: version.latexSource,
        contentJson: (version.contentJson ?? undefined) as object | undefined,
      },
    });

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, note: true, createdAt: true },
    });

    return Response.json({ ...updated, versions });
  } catch (error) {
    return apiError(error);
  }
}
