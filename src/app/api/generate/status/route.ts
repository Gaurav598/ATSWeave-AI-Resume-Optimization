import { prisma } from "@/lib/prisma";
import { requireUser, apiError } from "@/lib/session";

/**
 * Durable view of a generation job. The client polls this alongside the event
 * stream so a dropped connection or a restarted server still resolves the run
 * instead of spinning forever.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const jobId = new URL(request.url).searchParams.get("jobId");
    if (!jobId) return Response.json({ error: "Missing jobId" }, { status: 400 });

    const job = await prisma.aiJob.findFirst({
      where: { id: jobId, userId: user.id },
      select: {
        id: true,
        status: true,
        step: true,
        progress: true,
        error: true,
        resumeId: true,
        updatedAt: true,
      },
    });
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    // A job that stopped reporting is dead, not running.
    const stalled =
      job.status === "running" && Date.now() - job.updatedAt.getTime() > 3 * 60 * 1000;

    return Response.json({
      ...job,
      status: stalled ? "error" : job.status,
      error: stalled ? "Generation stopped responding. Please try again." : job.error,
    });
  } catch (error) {
    return apiError(error);
  }
}
