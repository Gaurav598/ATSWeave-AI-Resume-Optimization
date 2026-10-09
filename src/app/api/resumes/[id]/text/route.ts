import { prisma } from "@/lib/prisma";
import { requireUser, unauthorized } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ text: resume.plainText || "" });
  } catch {
    return unauthorized();
  }
}
