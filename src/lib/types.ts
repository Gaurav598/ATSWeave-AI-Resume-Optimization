export type TargetRole = "SWE" | "Data" | "PM" | "Design" | "Other";

export type CodingProfiles = {
  leetcode?: string;
  codeforces?: string;
  gfg?: string;
  codechef?: string;
  atcoder?: string;
  stats?: {
    leetcodeSolved?: number;
    codeforcesRating?: number;
    codeforcesRank?: string;
    gfgSolved?: number;
    codechefRating?: number;
  };
};

export type SkillCategories = {
  languages: string[];
  frameworks: string[];
  tools: string[];
};

export type ExperienceItem = {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  bullets: string[];
};

export type EducationItem = {
  school: string;
  degree: string;
  field?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  /** Extra bullets shown on some templates (thesis, awards, etc.) */
  highlights?: string[];
};

export type ProjectItem = {
  name: string;
  description?: string;
  bullets: string[];
  link?: string;
  tech: string[];
};

export type CertificationItem = {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
};

export type ResumeContent = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  skills: string[];
  skillCategories?: SkillCategories;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  codingProfiles?: CodingProfiles;
  targetRole?: TargetRole | string;
};

export type JdAnalysis = {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  seniorityLevel: string;
  keyResponsibilities: string[];
  mustHaveKeywords: string[];
  niceToHaveKeywords: string[];
};

export type MatchAnalysis = {
  alreadyMatched: string[];
  missingButUserHasEquivalent: { keyword: string; equivalent: string }[];
  genuinelyMissing: string[];
};

export type PipelineWarning = {
  type: "missing_skill" | "fabricated_claim" | "generic";
  message: string;
  evidence?: string;
};

export type RewriteResult = {
  content: ResumeContent;
  warnings: PipelineWarning[];
};

export type AtsBreakdown = {
  score: number;
  keywordCoverage: number;
  mustHaveCoverage: number;
  sectionScore: number;
  formattingScore: number;
  quantificationScore?: number;
  matched: string[];
  missing: string[];
  formattingIssues: string[];
  recommendations?: string[];
};

export type GenerationStep =
  | "analyze"
  | "match"
  | "rewrite"
  | "validate"
  | "compile"
  | "score";

export const GENERATION_STEPS: { id: GenerationStep; label: string }[] = [
  { id: "analyze", label: "Analyzing job description" },
  { id: "match", label: "Matching your experience" },
  { id: "rewrite", label: "Tailoring your resume" },
  { id: "validate", label: "Validating claims" },
  { id: "compile", label: "Rendering PDF" },
  { id: "score", label: "Scoring ATS match" },
];
