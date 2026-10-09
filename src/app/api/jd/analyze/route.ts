import { getAIProvider } from "@/lib/ai";
import { coerceJdAnalysis } from "@/lib/ai/parse";
import { analyzeJobDescriptionHeuristic } from "@/lib/ats/analyze-jd";
import { requireUser, apiError } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    await requireUser();
    const { jd } = (await request.json()) as { jd?: string };
    if (!jd?.trim()) return Response.json({ error: "Missing JD" }, { status: 400 });
    const ai = getAIProvider();
    try {
      const analysis = coerceJdAnalysis(await ai.analyzeJobDescription(jd));
      return Response.json({ ...analysis, analysisSource: ai.id === "mock" ? "heuristic" : "ai" });
    } catch {
      const analysis = analyzeJobDescriptionHeuristic(jd);
      return Response.json({ ...analysis, analysisSource: "heuristic" });
    }
  } catch (error) {
    return apiError(error);
  }
}
