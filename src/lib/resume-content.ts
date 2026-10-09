import type { ResumeContent, SkillCategories, CodingProfiles } from "@/lib/types";
import type { User, UserProfile } from "@prisma/client";
import { exampleResume } from "@/lib/example-content";
import { blankResume } from "@/lib/sample-resume";

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * AI path only — real career profile facts. Never invents demo employers.
 */
export function profileToContent(user: User, profile: UserProfile | null): ResumeContent {
  const skills = asArray<string>(profile?.skills);
  const skillCategories = (profile?.skillCategories as SkillCategories | null) ?? {
    languages: [],
    frameworks: [],
    tools: [],
  };
  return {
    fullName: user.name || "",
    email: user.email || "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
    summary: profile?.summary ?? "",
    skills,
    skillCategories,
    experience: asArray(profile?.experience),
    education: asArray(profile?.education),
    projects: asArray(profile?.projects),
    certifications: asArray(profile?.certifications),
    codingProfiles: (profile?.codingProfiles as CodingProfiles | null) ?? {},
    targetRole: profile?.targetRole ?? "",
  };
}

export function isProfileReady(content: ResumeContent) {
  return Boolean(
    content.fullName?.trim() &&
      content.email?.trim() &&
      (content.experience.some((e) => e.company?.trim() || e.title?.trim()) ||
        content.projects?.some((p) => p.name?.trim()) ||
        content.education.some((e) => e.school?.trim())),
  );
}

export type ManualSource = "example" | "profile" | "blank";

/**
 * Manual path — the gallery shows the example resume in this template, so
 * opening it must start from that same example. Profile and blank are explicit
 * choices, never a silent swap to a different person.
 */
export function manualStartingContent(
  user: User,
  profile: UserProfile | null,
  source: ManualSource = "example",
): ResumeContent {
  if (source === "blank") return blankResume();
  if (source === "profile") {
    const fromProfile = profileToContent(user, profile);
    const blank = blankResume();
    return {
      ...fromProfile,
      experience: fromProfile.experience.length ? fromProfile.experience : blank.experience,
      education: fromProfile.education.length ? fromProfile.education : blank.education,
      projects: fromProfile.projects?.length ? fromProfile.projects : blank.projects,
    };
  }
  return exampleResume();
}
