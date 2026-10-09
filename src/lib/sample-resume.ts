import type { ResumeContent } from "@/lib/types";

/**
 * Blank resume for manual edit — never invent a fake person (no "Alex Rivera" demo).
 * User fills every field. Gallery shows real template PNGs; editor starts empty in that layout.
 */
export const EMPTY_RESUME_CONTENT: ResumeContent = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  targetRole: "",
  summary: "",
  skills: [],
  skillCategories: {
    languages: [],
    frameworks: [],
    tools: [],
  },
  experience: [
    {
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      bullets: [""],
    },
  ],
  education: [
    {
      school: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
    },
  ],
  projects: [
    {
      name: "",
      description: "",
      bullets: [""],
      link: "",
      tech: [],
    },
  ],
  certifications: [],
  codingProfiles: {},
};

export function blankResume(): ResumeContent {
  return structuredClone(EMPTY_RESUME_CONTENT);
}

/** @deprecated Use blankResume() — kept only so old imports fail loudly if still referenced. */
export const SAMPLE_RESUME_CONTENT = EMPTY_RESUME_CONTENT;
export function cloneSampleResume() {
  return blankResume();
}
