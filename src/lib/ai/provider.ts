import type { JdAnalysis, MatchAnalysis, ResumeContent, RewriteResult } from "@/lib/types";

export interface AIProvider {
  id: "gemini" | "openai" | "grok" | "mock";
  analyzeJobDescription(jd: string): Promise<JdAnalysis>;
  rewriteResume(input: {
    profile: ResumeContent;
    jd: string;
    analysis: JdAnalysis;
    match: MatchAnalysis;
  }): Promise<RewriteResult>;
}

export const REWRITE_SYSTEM_PROMPT = `You are ATSWeave's ATS rewrite engine.

Hard rules:
- Never invent employers, job titles, dates, degrees, certifications, or metrics that are not present in the source data.
- You may rephrase, reorder, and emphasize using JD-aligned terminology. Synonym matching is allowed ("led" → "spearheaded"; "REST APIs" → "RESTful APIs" if the JD uses that exact phrasing).
- You may reorder the skills list to prioritize JD-relevant skills first. Do not add skills the user never listed.
- You may write a 2–3 line professional summary tailored to the role, using only claims supported by the user's actual data.
- If matching well would require a skill or experience the user does not have, put that in warnings — never silently claim it.
- Output strict JSON matching the schema. No prose, no markdown fences.

Output schema:
{
  "content": {
    "fullName": string,
    "email": string,
    "phone": string | null,
    "location": string | null,
    "linkedinUrl": string | null,
    "githubUrl": string | null,
    "portfolioUrl": string | null,
    "summary": string,
    "skills": string[],
    "skillCategories": { "languages": string[], "frameworks": string[], "tools": string[] },
    "experience": [{ "company": string, "title": string, "location": string, "startDate": string, "endDate": string, "bullets": string[] }],
    "education": [{ "school": string, "degree": string, "field": string, "startDate": string, "endDate": string, "gpa": string }],
    "projects": [{ "name": string, "description": string, "bullets": string[], "link": string, "tech": string[] }],
    "certifications": [{ "name": string, "issuer": string, "date": string, "url": string }],
    "codingProfiles": object
  },
  "warnings": [{ "type": "missing_skill" | "fabricated_claim" | "generic", "message": string, "evidence": string }]
}`;

export const ANALYZE_SYSTEM_PROMPT = `Extract ATS-relevant structure from a job description.
Return exact keyword phrases as they appear in the JD (ATS systems match literal strings). Example: keep "CI/CD" rather than expanding it unless both phrases appear.
Output strict JSON, no markdown:
{
  "hardSkills": string[],
  "softSkills": string[],
  "tools": string[],
  "seniorityLevel": string,
  "keyResponsibilities": string[],
  "mustHaveKeywords": string[],
  "niceToHaveKeywords": string[]
}`;
