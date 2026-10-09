import { createMockProvider } from "../src/lib/ai/mock";
import { analyzeMatch } from "../src/lib/ai/match";
import { stripFabrications, validateRewrite } from "../src/lib/ai/validate";
import { scoreAts } from "../src/lib/ats/score";
import { injectLatex } from "../src/lib/latex/inject";
import { SAMPLE_RAZORPAY_JD } from "../src/lib/sample-jd";
import type { ResumeContent } from "../src/lib/types";
import { readFileSync } from "node:fs";
import path from "node:path";

const profile: ResumeContent = {
  fullName: "Alex Rivera",
  email: "alex@example.com",
  skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS"],
  experience: [
    {
      company: "Northline Payments",
      title: "Software Engineer",
      startDate: "2022",
      bullets: ["Led redesign of checkout API in TypeScript/Node.js, reducing p95 latency by 40%."],
    },
  ],
  education: [{ school: "UW", degree: "B.S.", field: "CS" }],
};

async function main() {
  const template = JSON.parse(
    readFileSync(path.join(process.cwd(), "prisma/data/templates/jakes.json"), "utf8"),
  ) as { latexSource: string };
  const ai = createMockProvider();
  const analysis = await ai.analyzeJobDescription(SAMPLE_RAZORPAY_JD);
  const match = analyzeMatch(profile, analysis);
  const rewritten = await ai.rewriteResume({ profile, jd: SAMPLE_RAZORPAY_JD, analysis, match });
  const sanitized = stripFabrications(profile, rewritten.content);
  const warnings = validateRewrite(profile, sanitized);
  const latex = injectLatex(template.latexSource, sanitized);
  const breakdown = scoreAts({ plainText: JSON.stringify(sanitized), latexSource: latex, analysis });
  console.log(
    JSON.stringify(
      {
        analysisKeys: Object.keys(analysis),
        match,
        warningCount: warnings.length,
        score: breakdown.score,
        latexHasName: latex.includes("Alex Rivera"),
      },
      null,
      2,
    ),
  );
}

main();
