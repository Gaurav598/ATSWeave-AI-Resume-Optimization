import type { JdAnalysis, MatchAnalysis, ResumeContent } from "@/lib/types";
import { normalizeKeyword } from "@/lib/utils";

function profileCorpus(profile: ResumeContent) {
  const chunks = [
    ...(profile.skills ?? []),
    ...(profile.skillCategories?.languages ?? []),
    ...(profile.skillCategories?.frameworks ?? []),
    ...(profile.skillCategories?.tools ?? []),
    profile.summary ?? "",
    ...(profile.experience ?? []).flatMap((job) => [job.title, job.company, ...(job.bullets ?? [])]),
    ...(profile.projects ?? []).flatMap((p) => [p.name, p.description ?? "", ...(p.bullets ?? []), ...(p.tech ?? [])]),
    ...(profile.certifications ?? []).map((c) => c.name),
  ];
  return chunks.join(" \n ").toLowerCase();
}

const EQUIVALENTS: Record<string, string[]> = {
  "restful apis": ["rest", "rest apis", "http apis"],
  "ci/cd": ["continuous integration", "github actions", "gitlab ci", "jenkins"],
  postgres: ["postgresql", "sql"],
  postgresql: ["postgres", "sql"],
  javascript: ["js", "typescript"],
  typescript: ["ts", "javascript"],
  kubernetes: ["k8s"],
  k8s: ["kubernetes"],
  react: ["react.js", "reactjs", "next.js"],
  "next.js": ["react", "nextjs"],
  "node.js": ["nodejs", "node", "express"],
  ml: ["machine learning"],
  "machine learning": ["ml"],
};

export function analyzeMatch(profile: ResumeContent, analysis: JdAnalysis): MatchAnalysis {
  const corpus = profileCorpus(profile);
  const alreadyMatched: string[] = [];
  const missingButUserHasEquivalent: MatchAnalysis["missingButUserHasEquivalent"] = [];
  const genuinelyMissing: string[] = [];

  for (const keyword of analysis.mustHaveKeywords) {
    const key = normalizeKeyword(keyword);
    if (!key) continue;
    if (corpus.includes(key)) {
      alreadyMatched.push(keyword);
      continue;
    }
    const alts = EQUIVALENTS[key] ?? [];
    const hit = alts.find((alt) => corpus.includes(alt));
    if (hit) {
      missingButUserHasEquivalent.push({ keyword, equivalent: hit });
    } else {
      genuinelyMissing.push(keyword);
    }
  }

  return { alreadyMatched, missingButUserHasEquivalent, genuinelyMissing };
}
