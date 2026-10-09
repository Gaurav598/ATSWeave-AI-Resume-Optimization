import { getAIProvider } from "@/lib/ai";
import { analyzeMatch } from "@/lib/ai/match";
import { stripFabrications, validateRewrite } from "@/lib/ai/validate";
import { scoreAts } from "@/lib/ats/score";
import { injectLatex } from "@/lib/latex/inject";
import { renderResumePdf } from "@/lib/resume-doc/render";
import type {
  AtsBreakdown,
  GenerationStep,
  JdAnalysis,
  MatchAnalysis,
  PipelineWarning,
  ResumeContent,
} from "@/lib/types";

export type PipelineEvent =
  | { type: "step"; step: GenerationStep; status: "running" | "done" | "error"; message?: string }
  | { type: "keywords"; keywords: string[] }
  | { type: "analysis"; analysis: JdAnalysis }
  | { type: "match"; match: MatchAnalysis }
  | { type: "warnings"; warnings: PipelineWarning[] }
  | { type: "content"; content: ResumeContent }
  | { type: "score"; breakdown: AtsBreakdown }
  | { type: "provider"; id: string }
  | { type: "error"; message: string }
  | { type: "done" };

/** One warning per issue, keeping the first wording seen. */
function dedupeWarnings(warnings: PipelineWarning[]): PipelineWarning[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.type}:${(warning.evidence ?? warning.message).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Keeps only the keywords the user left checked on the match screen. */
function applyConfirmedKeywords(analysis: JdAnalysis, confirmed?: string[]): JdAnalysis {
  if (!confirmed?.length) return analysis;
  const allowed = new Set(confirmed.map((k) => k.trim().toLowerCase()).filter(Boolean));
  const keep = (list: string[]) => list.filter((k) => allowed.has(k.trim().toLowerCase()));
  const mustHaveKeywords = keep(analysis.mustHaveKeywords);
  return {
    ...analysis,
    hardSkills: keep(analysis.hardSkills),
    tools: keep(analysis.tools),
    mustHaveKeywords: mustHaveKeywords.length ? mustHaveKeywords : keep(analysis.hardSkills),
    niceToHaveKeywords: keep(analysis.niceToHaveKeywords),
  };
}

export async function runAtsPipeline(options: {
  jd: string;
  profile: ResumeContent;
  latexTemplate: string;
  templateSlug?: string | null;
  confirmedKeywords?: string[];
  emit?: (event: PipelineEvent) => void | Promise<void>;
}) {
  const emit = options.emit ?? (() => undefined);
  const ai = getAIProvider();
  await emit({ type: "provider", id: ai.id });

  await emit({ type: "step", step: "analyze", status: "running" });
  const analysis = applyConfirmedKeywords(
    await ai.analyzeJobDescription(options.jd),
    options.confirmedKeywords,
  );
  await emit({ type: "analysis", analysis });
  await emit({
    type: "keywords",
    keywords: [...analysis.mustHaveKeywords, ...analysis.hardSkills, ...analysis.tools],
  });
  await emit({ type: "step", step: "analyze", status: "done" });

  await emit({ type: "step", step: "match", status: "running" });
  const match = analyzeMatch(options.profile, analysis);
  await emit({ type: "match", match });
  await emit({ type: "step", step: "match", status: "done" });

  await emit({ type: "step", step: "rewrite", status: "running" });
  const rewritten = await ai.rewriteResume({
    profile: options.profile,
    jd: options.jd,
    analysis,
    match,
  });
  await emit({ type: "step", step: "rewrite", status: "done" });

  await emit({ type: "step", step: "validate", status: "running" });
  const sanitized = stripFabrications(options.profile, rewritten.content);
  sanitized.summary = rewritten.content.summary || sanitized.summary;
  // Providers report their own gaps, so dedupe on the skill rather than
  // listing the same missing keyword under two different wordings.
  const warnings = dedupeWarnings([
    ...rewritten.warnings,
    ...validateRewrite(options.profile, sanitized),
    ...match.genuinelyMissing.map((keyword) => ({
      type: "missing_skill" as const,
      message: `This JD asks for ${keyword} — it is not in your profile, so it was not added.`,
      evidence: keyword,
    })),
  ]);
  await emit({ type: "warnings", warnings });
  await emit({ type: "content", content: sanitized });
  await emit({ type: "step", step: "validate", status: "done" });

  await emit({ type: "step", step: "compile", status: "running" });
  const latexSource = injectLatex(options.latexTemplate, sanitized);
  const rendered = await renderResumePdf({
    content: sanitized,
    templateSlug: options.templateSlug,
  });
  await emit({ type: "step", step: "compile", status: "done" });

  await emit({ type: "step", step: "score", status: "running" });
  const breakdown = scoreAts({
    plainText: rendered.text,
    latexSource,
    analysis,
  });
  await emit({ type: "score", breakdown });
  await emit({ type: "step", step: "score", status: "done" });

  // "done" is emitted by the caller once results are persisted, so the client
  // never fetches the resume before the tailored version has been written.
  return {
    analysis,
    match,
    content: sanitized,
    warnings,
    latexSource,
    rendered,
    breakdown,
  };
}
