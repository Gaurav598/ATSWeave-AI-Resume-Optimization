import { getJobBuffer, onJobEvent } from "@/lib/jobs/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return new Response("Missing jobId", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      for (const event of getJobBuffer(jobId)) send(event);
      const off = onJobEvent(jobId, send);
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(`: ping\n\n`)), 15000);
      const close = () => {
        clearInterval(heartbeat);
        off();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      setTimeout(close, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
