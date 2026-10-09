import type { AtsBreakdown, JdAnalysis } from "@/lib/types";
import { detectAtsBreakingLatex } from "@/lib/latex/inject";
import { resumeHasKeyword } from "@/lib/ats/analyze-jd";
import { unique } from "@/lib/utils";

const SECTION_PATTERNS: { id: string; patterns: RegExp[] }[] = [
  { id: "contact", patterns: [/@[a-z0-9.-]+\.[a-z]{2,}/i, /\b\d{3}[-.)\s]?\d{3}[-.\s]?\d{4}\b/] },
  {
    id: "experience",
    patterns: [/\b(experience|work history|employment|professional experience|work experience)\b/i],
  },
  { id: "education", patterns: [/\b(education|academic|university|bachelor|master|b\.?s\.?|m\.?s\.?)\b/i] },
  { id: "skills", patterns: [/\b(skills|technical skills|technologies|tech stack|competencies)\b/i] },
  { id: "projects", patterns: [/\b(projects|personal projects|selected projects)\b/i] },
];

/**
 * ATS-style match score against a job description.
 * Models how parsers + keyword filters behave (Taleo/Workday-like exact/synonym match),
 * not a proprietary vendor score. Transparent dimensions for the UI.
 */
export function scoreAts(options: {
  plainText: string;
  latexSource?: string;
  analysis: JdAnalysis;
}): AtsBreakdown {
  const plain = options.plainText || "";
  const text = plain.toLowerCase();

  const must = unique(options.analysis.mustHaveKeywords.map((k) => k.trim()).filter(Boolean));
  const nice = unique(
    [
      ...options.analysis.niceToHaveKeywords,
      ...options.analysis.hardSkills,
      ...options.analysis.tools,
    ]
      .map((k) => k.trim())
      .filter((k) => k && !must.some((m) => m.toLowerCase() === k.toLowerCase())),
  );

  const matched: string[] = [];
  const missing: string[] = [];
  let mustHits = 0;
  for (const keyword of must) {
    if (resumeHasKeyword(text, keyword)) {
      matched.push(keyword);
      mustHits += 1;
    } else {
      missing.push(keyword);
    }
  }

  let niceHits = 0;
  for (const keyword of nice) {
    if (resumeHasKeyword(text, keyword)) {
      matched.push(keyword);
      niceHits += 1;
    } else if (!missing.some((m) => m.toLowerCase() === keyword.toLowerCase())) {
      missing.push(keyword);
    }
  }

  const mustHaveCoverage = must.length ? mustHits / must.length : 0.5;
  const keywordCoverage =
    must.length + nice.length
      ? (mustHits * 2.2 + niceHits) / (must.length * 2.2 + nice.length)
      : 0.5;

  const sectionHits = SECTION_PATTERNS.filter((section) =>
    section.patterns.some((re) => re.test(plain)),
  ).length;
  const sectionScore = sectionHits / SECTION_PATTERNS.length;

  const bullets = plain
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter((l) => l.length > 28);
  const quantified = bullets.filter((l) => /\d/.test(l)).length;
  const quantificationScore = bullets.length ? Math.min(1, quantified / Math.max(3, bullets.length * 0.45)) : 0.2;

  const actionVerbScore = bullets.length
    ? bullets.filter((l) =>
        /^(led|built|designed|developed|implemented|improved|reduced|increased|owned|launched|created|managed|optimized|shipped|architected|automated)/i.test(
          l,
        ),
      ).length / bullets.length
    : 0.25;

  const formattingIssues = [
    ...detectAtsBreakingLatex(options.latexSource || ""),
    ...detectPlainTextFormatIssues(plain),
  ];
  const formattingScore = Math.max(0, 1 - formattingIssues.length * 0.18);

  // Weights inspired by ATS screener research: keywords dominate, then must-haves, structure, proof, format
  const score = Math.round(
    (keywordCoverage * 0.38 +
      mustHaveCoverage * 0.22 +
      sectionScore * 0.14 +
      quantificationScore * 0.12 +
      actionVerbScore * 0.06 +
      formattingScore * 0.08) *
      100,
  );

  const recommendations = buildRecommendations({
    mustHaveCoverage,
    keywordCoverage,
    sectionScore,
    quantificationScore,
    formattingIssues,
    missing: missing.slice(0, 8),
    sectionHits,
  });

  return {
    score: Math.max(0, Math.min(100, score)),
    keywordCoverage: Math.round(keywordCoverage * 100),
    mustHaveCoverage: Math.round(mustHaveCoverage * 100),
    sectionScore: Math.round(sectionScore * 100),
    formattingScore: Math.round(formattingScore * 100),
    quantificationScore: Math.round(quantificationScore * 100),
    matched: unique(matched),
    missing: unique(missing),
    formattingIssues,
    recommendations,
  };
}

function detectPlainTextFormatIssues(plain: string): string[] {
  const issues: string[] = [];
  if (!plain.trim()) {
    issues.push("Resume text is empty — paste the text copied from your PDF");
    return issues;
  }
  if (!/@[a-z0-9.-]+\.[a-z]{2,}/i.test(plain)) {
    issues.push("No email detected — contact info may be in a header/footer ATS cannot read");
  }
  if ((plain.match(/\|/g) || []).length >= 4) {
    issues.push("Many pipe characters — often a sign of multi-column layout that parsers scramble");
  }
  if (/▪|◆|★|●|■/.test(plain)) {
    issues.push("Special bullet symbols can break older ATS parsers — prefer plain hyphens");
  }
  if (plain.length < 400) {
    issues.push("Resume text looks very short — confirm you pasted the full document");
  }
  const lines = plain.split(/\n/).filter((l) => l.trim());
  const shortLines = lines.filter((l) => l.trim().length > 0 && l.trim().length < 18).length;
  if (lines.length > 20 && shortLines / lines.length > 0.45) {
    issues.push("Many very short lines — possible two-column extraction (text read left-to-right across columns)");
  }
  return issues;
}

function buildRecommendations(input: {
  mustHaveCoverage: number;
  keywordCoverage: number;
  sectionScore: number;
  quantificationScore: number;
  formattingIssues: string[];
  missing: string[];
  sectionHits: number;
}): string[] {
  const tips: string[] = [];
  if (input.mustHaveCoverage < 0.7 && input.missing.length) {
    tips.push(
      `Add missing must-have terms where they are true for you: ${input.missing.slice(0, 5).join(", ")}. Put critical skills in your summary and skills section.`,
    );
  }
  if (input.keywordCoverage < 0.55) {
    tips.push(
      "Mirror the job’s vocabulary in titles, summary, and the first bullet of each role — exact phrasing matters on Taleo/Workday-style filters.",
    );
  }
  if (input.sectionScore < 0.8) {
    tips.push(
      "Use standard headings: Experience, Education, Skills (and Projects if relevant). Creative titles often fail section detection.",
    );
  }
  if (input.quantificationScore < 0.4) {
    tips.push(
      "Quantify impact in bullets (%, time saved, users, revenue). Aim for numbers in at least half of your bullets.",
    );
  }
  if (input.formattingIssues.length) {
    tips.push("Fix formatting flags first — parsers must extract text before keywords can match.");
  }
  if (!tips.length) {
    tips.push("Strong alignment. Tailor the top third of the resume to this JD and keep claims accurate.");
  }
  return tips.slice(0, 5);
}
