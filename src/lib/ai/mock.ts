import type { AIProvider } from "@/lib/ai/provider";
import { analyzeJobDescriptionHeuristic } from "@/lib/ats/analyze-jd";
import type { JdAnalysis, ResumeContent, RewriteResult } from "@/lib/types";
import { normalizeKeyword } from "@/lib/utils";

function extractKeywords(jd: string): string[] {
  const analysis = analyzeJobDescriptionHeuristic(jd);
  return Array.from(
    new Set([...analysis.mustHaveKeywords, ...analysis.niceToHaveKeywords, ...analysis.hardSkills]),
  ).slice(0, 24);
}

function reorderSkills(content: ResumeContent, keywords: string[]): ResumeContent {
  const hay = keywords.map(normalizeKeyword);
  const score = (skill: string) => (hay.some((k) => normalizeKeyword(skill).includes(k) || k.includes(normalizeKeyword(skill))) ? 0 : 1);
  const skills = [...(content.skills ?? [])].sort((a, b) => score(a) - score(b));
  const sortCat = (items: string[] = []) => [...items].sort((a, b) => score(a) - score(b));
  return {
    ...content,
    skills,
    skillCategories: content.skillCategories
      ? {
          languages: sortCat(content.skillCategories.languages),
          frameworks: sortCat(content.skillCategories.frameworks),
          tools: sortCat(content.skillCategories.tools),
        }
      : content.skillCategories,
  };
}

function tailorBullets(bullets: string[], keywords: string[]) {
  const hay = keywords.map(normalizeKeyword);
  return [...bullets].sort((a, b) => {
    const as = hay.filter((k) => normalizeKeyword(a).includes(k)).length;
    const bs = hay.filter((k) => normalizeKeyword(b).includes(k)).length;
    return bs - as;
  });
}

export function createMockProvider(): AIProvider {
  return {
    id: "mock",
    // Without an API key there is no model to call, so this returns the same
    // deterministic analysis the public ATS checker uses rather than a
    // different, weaker guess.
    async analyzeJobDescription(jd) {
      return analyzeJobDescriptionHeuristic(jd);
    },
    async rewriteResume({ profile, analysis, match }) {
      const keywords = [...analysis.mustHaveKeywords, ...analysis.hardSkills];
      const reordered = reorderSkills(profile, keywords);
      const result: RewriteResult = {
        content: {
          ...reordered,
          summary: reordered.summary,
          experience: (reordered.experience ?? []).map((job) => ({
            ...job,
            bullets: tailorBullets(job.bullets ?? [], keywords).map((bullet) => {
              let next = bullet;
              if (/\bREST APIs?\b/i.test(next) && keywords.some((k) => /restful/i.test(k))) {
                next = next.replace(/\bREST APIs?\b/gi, "RESTful APIs");
              }
              if (/\bled\b/i.test(next) && /spearhead|lead/i.test(analysis.keyResponsibilities.join(" "))) {
                next = next.replace(/\bled\b/i, "spearheaded");
              }
              return next;
            }),
          })),
        },
        warnings: match.genuinelyMissing.map((keyword) => ({
          type: "missing_skill" as const,
          message: `This JD asks for ${keyword} — it is not in your profile, so it was not added.`,
          evidence: keyword,
        })),
      };
      return result;
    },
  };
}
