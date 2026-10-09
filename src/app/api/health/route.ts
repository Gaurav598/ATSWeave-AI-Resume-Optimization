import { getAIProvider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  let database: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  let ai = "unknown";
  try {
    ai = getAIProvider().id;
  } catch {
    ai = "error";
  }

  const ok = database === "ok";
  return Response.json(
    {
      ok,
      name: "ATSWeave",
      database,
      ai,
      demoLogin: process.env.AUTH_DEMO_LOGIN === "true",
    },
    { status: ok ? 200 : 503 },
  );
}
