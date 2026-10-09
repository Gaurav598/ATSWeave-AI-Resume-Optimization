import type { JdAnalysis, PipelineWarning, ResumeContent, RewriteResult } from "@/lib/types";

export function extractJsonPayload(raw: string): string {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON");
  }
  return cleaned.slice(start, end + 1);
}

export function parseModelJson<T>(raw: string): T {
  return JSON.parse(extractJsonPayload(raw)) as T;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item).trim()).filter(Boolean);
}

export function coerceJdAnalysis(raw: unknown): JdAnalysis {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const hardSkills = asStringArray(obj.hardSkills);
  const tools = asStringArray(obj.tools);
  const mustHaveKeywords = asStringArray(obj.mustHaveKeywords);
  return {
    hardSkills,
    softSkills: asStringArray(obj.softSkills),
    tools,
    seniorityLevel: asString(obj.seniorityLevel, "unspecified") || "unspecified",
    keyResponsibilities: asStringArray(obj.keyResponsibilities),
    mustHaveKeywords: mustHaveKeywords.length ? mustHaveKeywords : hardSkills.slice(0, 12),
    niceToHaveKeywords: asStringArray(obj.niceToHaveKeywords),
  };
}

function coerceExperience(raw: unknown, fallback: ResumeContent["experience"]): ResumeContent["experience"] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((item, index) => {
    const job = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const orig = fallback[index];
    const bullets = asStringArray(job.bullets);
    return {
      company: asString(job.company, orig?.company ?? ""),
      title: asString(job.title, orig?.title ?? ""),
      location: asString(job.location, orig?.location ?? ""),
      startDate: asString(job.startDate, orig?.startDate ?? ""),
      endDate: asString(job.endDate, orig?.endDate ?? ""),
      bullets: bullets.length ? bullets : orig?.bullets ?? [],
    };
  });
}

function coerceEducation(raw: unknown, fallback: ResumeContent["education"]): ResumeContent["education"] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((item, index) => {
    const ed = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const orig = fallback[index];
    return {
      school: asString(ed.school, orig?.school ?? ""),
      degree: asString(ed.degree, orig?.degree ?? ""),
      field: asString(ed.field, orig?.field ?? ""),
      location: asString(ed.location, orig?.location ?? ""),
      startDate: asString(ed.startDate, orig?.startDate ?? ""),
      endDate: asString(ed.endDate, orig?.endDate ?? ""),
      gpa: asString(ed.gpa, orig?.gpa ?? ""),
      highlights: asStringArray(ed.highlights).length ? asStringArray(ed.highlights) : orig?.highlights,
    };
  });
}

function coerceProjects(raw: unknown, fallback: ResumeContent["projects"]): ResumeContent["projects"] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((item, index) => {
    const project = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const orig = fallback?.[index];
    const bullets = asStringArray(project.bullets);
    return {
      name: asString(project.name, orig?.name ?? ""),
      description: asString(project.description, orig?.description ?? ""),
      bullets: bullets.length ? bullets : orig?.bullets ?? [],
      link: asString(project.link, orig?.link ?? ""),
      tech: asStringArray(project.tech).length ? asStringArray(project.tech) : orig?.tech ?? [],
    };
  });
}

function coerceWarnings(raw: unknown): PipelineWarning[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const warning = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const type =
      warning.type === "missing_skill" || warning.type === "fabricated_claim" ? warning.type : "generic";
    return {
      type,
      message: asString(warning.message, "Warning"),
      evidence: asString(warning.evidence) || undefined,
    };
  });
}

export function coerceRewriteResult(raw: unknown, fallback: ResumeContent): RewriteResult {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nested = obj.content && typeof obj.content === "object" ? obj.content : obj;
  const contentObj = nested as Record<string, unknown>;
  const skills = asStringArray(contentObj.skills);

  const content: ResumeContent = {
    ...fallback,
    fullName: asString(contentObj.fullName, fallback.fullName),
    email: asString(contentObj.email, fallback.email),
    phone: asString(contentObj.phone, fallback.phone ?? ""),
    location: asString(contentObj.location, fallback.location ?? ""),
    linkedinUrl: asString(contentObj.linkedinUrl, fallback.linkedinUrl ?? ""),
    githubUrl: asString(contentObj.githubUrl, fallback.githubUrl ?? ""),
    portfolioUrl: asString(contentObj.portfolioUrl, fallback.portfolioUrl ?? ""),
    summary: asString(contentObj.summary, fallback.summary ?? ""),
    skills: skills.length ? skills : fallback.skills,
    skillCategories: fallback.skillCategories,
    experience: coerceExperience(contentObj.experience, fallback.experience),
    education: coerceEducation(contentObj.education, fallback.education),
    projects: coerceProjects(contentObj.projects, fallback.projects),
    certifications: fallback.certifications,
    codingProfiles: fallback.codingProfiles,
    targetRole: asString(contentObj.targetRole, fallback.targetRole ?? ""),
  };

  return { content, warnings: coerceWarnings(obj.warnings) };
}
