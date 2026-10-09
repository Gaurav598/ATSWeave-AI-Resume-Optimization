import { getAIProvider } from "@/lib/ai";
import { coerceJdAnalysis } from "@/lib/ai/parse";
import { analyzeJobDescriptionHeuristic } from "@/lib/ats/analyze-jd";
import { scoreAts } from "@/lib/ats/score";
import { extractTextFromUpload } from "@/lib/pdf/extract-text";
import { MAX_UPLOAD_BYTES } from "@/lib/pdf/text";
import { enforceRateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { JdAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

async function readAtsPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    let jd = String(form.get("jd") || "").trim();
    let resumeText = String(form.get("resumeText") || "").trim();
    const latexSource = String(form.get("latexSource") || "");
    const resume = form.get("resume");
    const jdFile = form.get("jdFile");

    if (resume instanceof File && resume.size > 0) {
      if (resume.size > MAX_UPLOAD_BYTES) throw new Error("Resume file is too large (max 8 MB).");
      resumeText = (await extractTextFromUpload(resume)) || resumeText;
    }
    if (jdFile instanceof File && jdFile.size > 0) {
      if (jdFile.size > MAX_UPLOAD_BYTES) throw new Error("Job description file is too large (max 8 MB).");
      jd = (await extractTextFromUpload(jdFile)) || jd;
    }
    return { jd, resumeText, latexSource };
  }

  const body = (await request.json()) as {
    jd?: string;
    resumeText?: string;
    latexSource?: string;
  };
  return {
    jd: body.jd?.trim() || "",
    resumeText: body.resumeText?.trim() || "",
    latexSource: body.latexSource || "",
  };
}

export async function POST(request: Request) {
  const session = await auth();
  const userKey = session?.user?.id || session?.user?.email || request.headers.get("x-forwarded-for") || "anon";
  const limit = await enforceRateLimit(`ats-check:${userKey}`, Number(process.env.ATS_CHECK_LIMIT_PER_HOUR || 30));
  if (!limit.allowed) {
    return Response.json({ error: "Too many ATS checks. Try again later." }, { status: 429 });
  }

  let jd = "";
  let resumeText = "";
  let latexSource = "";
  try {
    const payload = await readAtsPayload(request);
    jd = payload.jd;
    resumeText = payload.resumeText;
    latexSource = payload.latexSource;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the uploaded file";
    return Response.json({ error: message }, { status: 400 });
  }

  if (jd.length < 40 || resumeText.length < 80) {
    return Response.json(
      {
        error:
          "Add a full job description (40+ characters) and your resume (80+ characters). Upload a PDF or paste the text.",
      },
      { status: 400 },
    );
  }

  const provider = getAIProvider();
  let analysis: JdAnalysis;
  let analysisSource: "ai" | "heuristic" = "heuristic";
  try {
    analysis = coerceJdAnalysis(
      await Promise.race([
        provider.analyzeJobDescription(jd),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 20_000)),
      ]),
    );
    const heuristic = analyzeJobDescriptionHeuristic(jd);
    analysis = {
      ...analysis,
      hardSkills: Array.from(new Set([...analysis.hardSkills, ...heuristic.hardSkills])),
      tools: Array.from(new Set([...analysis.tools, ...heuristic.tools])),
      mustHaveKeywords:
        analysis.mustHaveKeywords?.length > 0 ? analysis.mustHaveKeywords : heuristic.mustHaveKeywords,
      niceToHaveKeywords: Array.from(
        new Set([...(analysis.niceToHaveKeywords || []), ...heuristic.niceToHaveKeywords]),
      ),
    };
    analysisSource = provider.id === "mock" ? "heuristic" : "ai";
  } catch {
    analysis = analyzeJobDescriptionHeuristic(jd);
  }

  const breakdown = scoreAts({
    plainText: resumeText,
    latexSource,
    analysis,
  });

  await prisma.atsCheck.create({
    data: {
      userId: session?.user?.id ?? null,
      score: breakdown.score,
      breakdown: breakdown as object,
    },
  });

  return Response.json({
    score: breakdown.score,
    breakdown,
    analysis: {
      mustHaveKeywords: analysis.mustHaveKeywords,
      hardSkills: analysis.hardSkills,
      tools: analysis.tools,
      seniorityLevel: analysis.seniorityLevel,
      niceToHaveKeywords: analysis.niceToHaveKeywords,
      keyResponsibilities: analysis.keyResponsibilities,
    },
    meta: {
      analysisSource,
      method:
        "Keyword + synonym match, section detection, quantification, action verbs, and ATS-breaking format checks. Not affiliated with Workday/Taleo/Greenhouse.",
    },
  });
}
