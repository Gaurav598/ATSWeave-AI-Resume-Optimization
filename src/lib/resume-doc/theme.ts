/**
 * Design tokens for every published template.
 *
 * This is the only place a template's look is defined. The PDF renderer, the
 * editor preview, and the gallery all read from here, so a template can never
 * look like one thing on screen and another in the downloaded file.
 */

export type SectionId =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "coding"
  | "certifications";

export type RuleStyle = "none" | "hair" | "thin" | "thick";

export type ResumeTheme = {
  slug: string;
  name: string;
  font: "Times-Roman" | "Helvetica";
  baseSize: number;
  lineHeight: number;
  margin: number;
  accent: string;
  text: string;
  muted: string;
  header: {
    align: "center" | "left";
    nameSize: number;
    nameLetterSpacing: number;
    uppercase: boolean;
    contactSize: number;
    separator: string;
    rule: RuleStyle;
    ruleWidth: string;
    gapAfter: number;
  };
  section: {
    size: number;
    uppercase: boolean;
    letterSpacing: number;
    rule: RuleStyle;
    colored: boolean;
    spaceBefore: number;
    spaceAfter: number;
  };
  entry: {
    gap: number;
    bulletGap: number;
    titleSize: number;
    bulletIndent: number;
  };
  order: SectionId[];
};

const CLASSIC_ORDER: SectionId[] = [
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "coding",
  "certifications",
];

const ENGINEERING_ORDER: SectionId[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "coding",
  "certifications",
];

/** Jake's and sb2nov lead with Education — that is the point of the format. */
const EDUCATION_FIRST_ORDER: SectionId[] = [
  "summary",
  "education",
  "experience",
  "projects",
  "skills",
  "coding",
  "certifications",
];

const INK_ORDER: SectionId[] = [
  "summary",
  "skills",
  "coding",
  "experience",
  "projects",
  "education",
  "certifications",
];

const INK_BLACK = "#111111";
const SOFT_GREY = "#444444";

export const THEMES: Record<string, ResumeTheme> = {
  jakes: {
    slug: "jakes",
    name: "Jake's Resume",
    font: "Times-Roman",
    baseSize: 9.6,
    lineHeight: 1.32,
    margin: 38,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: SOFT_GREY,
    header: {
      align: "center",
      nameSize: 21,
      nameLetterSpacing: 1.1,
      uppercase: true,
      contactSize: 8.6,
      separator: "  |  ",
      rule: "none",
      ruleWidth: "100%",
      gapAfter: 10,
    },
    section: {
      size: 10.4,
      uppercase: false,
      letterSpacing: 0.6,
      rule: "thin",
      colored: false,
      spaceBefore: 10,
      spaceAfter: 4,
    },
    entry: { gap: 7, bulletGap: 2, titleSize: 10, bulletIndent: 11 },
    order: EDUCATION_FIRST_ORDER,
  },

  sb2nov: {
    slug: "sb2nov",
    name: "sb2nov (Sourabh Bajaj)",
    font: "Times-Roman",
    baseSize: 9.8,
    lineHeight: 1.34,
    margin: 42,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: SOFT_GREY,
    header: {
      align: "center",
      nameSize: 23,
      nameLetterSpacing: 0,
      uppercase: false,
      contactSize: 8.8,
      separator: "  •  ",
      rule: "none",
      ruleWidth: "100%",
      gapAfter: 10,
    },
    section: {
      size: 10.6,
      uppercase: true,
      letterSpacing: 0.4,
      rule: "thick",
      colored: false,
      spaceBefore: 11,
      spaceAfter: 5,
    },
    entry: { gap: 8, bulletGap: 2.4, titleSize: 10.2, bulletIndent: 12 },
    order: EDUCATION_FIRST_ORDER,
  },

  engineeringresumes: {
    slug: "engineeringresumes",
    name: "Engineering Resumes",
    font: "Helvetica",
    baseSize: 9,
    lineHeight: 1.26,
    margin: 40,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: SOFT_GREY,
    header: {
      align: "left",
      nameSize: 17,
      nameLetterSpacing: 0,
      uppercase: false,
      contactSize: 8.2,
      separator: "  |  ",
      rule: "hair",
      ruleWidth: "100%",
      gapAfter: 8,
    },
    section: {
      size: 9.4,
      uppercase: true,
      letterSpacing: 0.7,
      rule: "hair",
      colored: false,
      spaceBefore: 9,
      spaceAfter: 3.5,
    },
    entry: { gap: 6, bulletGap: 1.8, titleSize: 9.6, bulletIndent: 10 },
    order: ENGINEERING_ORDER,
  },

  classic: {
    slug: "classic",
    name: "RenderCV Classic",
    font: "Times-Roman",
    baseSize: 10,
    lineHeight: 1.38,
    margin: 50,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: SOFT_GREY,
    header: {
      align: "center",
      nameSize: 20,
      nameLetterSpacing: 0,
      uppercase: false,
      contactSize: 9,
      separator: "  ·  ",
      rule: "none",
      ruleWidth: "100%",
      gapAfter: 10,
    },
    section: {
      size: 11,
      uppercase: false,
      letterSpacing: 0,
      rule: "thin",
      colored: false,
      spaceBefore: 12,
      spaceAfter: 5,
    },
    entry: { gap: 9, bulletGap: 2.6, titleSize: 10.4, bulletIndent: 12 },
    order: CLASSIC_ORDER,
  },

  moderncv: {
    slug: "moderncv",
    name: "ModernCV",
    font: "Helvetica",
    baseSize: 9.6,
    lineHeight: 1.34,
    margin: 44,
    accent: "#1F4E79",
    text: "#14171a",
    muted: "#4a5058",
    header: {
      align: "left",
      nameSize: 25,
      nameLetterSpacing: -0.3,
      uppercase: false,
      contactSize: 8.6,
      separator: "  |  ",
      rule: "none",
      ruleWidth: "100%",
      gapAfter: 10,
    },
    section: {
      size: 10.6,
      uppercase: false,
      letterSpacing: 0.2,
      rule: "thin",
      colored: true,
      spaceBefore: 11,
      spaceAfter: 5,
    },
    entry: { gap: 8, bulletGap: 2.2, titleSize: 10, bulletIndent: 11 },
    order: CLASSIC_ORDER,
  },

  engineeringclassic: {
    slug: "engineeringclassic",
    name: "Engineering Classic",
    font: "Times-Roman",
    baseSize: 10,
    lineHeight: 1.42,
    margin: 47,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: SOFT_GREY,
    header: {
      align: "center",
      nameSize: 21,
      nameLetterSpacing: 0.3,
      uppercase: false,
      contactSize: 9,
      separator: "  |  ",
      rule: "none",
      ruleWidth: "100%",
      gapAfter: 12,
    },
    section: {
      size: 11.2,
      uppercase: false,
      letterSpacing: 0.3,
      rule: "thin",
      colored: false,
      spaceBefore: 13,
      spaceAfter: 6,
    },
    entry: { gap: 10, bulletGap: 3, titleSize: 10.6, bulletIndent: 12 },
    order: ENGINEERING_ORDER,
  },

  harvard: {
    slug: "harvard",
    name: "Harvard",
    font: "Times-Roman",
    baseSize: 10,
    lineHeight: 1.4,
    margin: 54,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: SOFT_GREY,
    header: {
      align: "center",
      nameSize: 22,
      nameLetterSpacing: 0.4,
      uppercase: false,
      contactSize: 9,
      separator: "  ·  ",
      rule: "thin",
      ruleWidth: "30%",
      gapAfter: 11,
    },
    section: {
      size: 10.4,
      uppercase: true,
      letterSpacing: 0.9,
      rule: "thin",
      colored: false,
      spaceBefore: 13,
      spaceAfter: 5.5,
    },
    entry: { gap: 9, bulletGap: 2.6, titleSize: 10.2, bulletIndent: 12 },
    order: CLASSIC_ORDER,
  },

  "deedy-safe": {
    slug: "deedy-safe",
    name: "Deedy (ATS-Safe)",
    font: "Helvetica",
    baseSize: 9.4,
    lineHeight: 1.3,
    margin: 40,
    accent: "#0F172A",
    text: "#0F172A",
    muted: "#475569",
    header: {
      align: "left",
      nameSize: 26,
      nameLetterSpacing: -0.4,
      uppercase: false,
      contactSize: 8.4,
      separator: "  |  ",
      rule: "thick",
      ruleWidth: "28%",
      gapAfter: 10,
    },
    section: {
      size: 9.8,
      uppercase: true,
      letterSpacing: 1,
      rule: "thick",
      colored: true,
      spaceBefore: 10,
      spaceAfter: 4.5,
    },
    entry: { gap: 7, bulletGap: 2, titleSize: 10, bulletIndent: 11 },
    order: ENGINEERING_ORDER,
  },

  ink: {
    slug: "ink",
    name: "Ink",
    font: "Helvetica",
    baseSize: 9.4,
    lineHeight: 1.34,
    margin: 44,
    accent: INK_BLACK,
    text: INK_BLACK,
    muted: "#52525b",
    header: {
      align: "left",
      nameSize: 24,
      nameLetterSpacing: -0.2,
      uppercase: false,
      contactSize: 8.4,
      separator: "  |  ",
      rule: "thick",
      ruleWidth: "100%",
      gapAfter: 10,
    },
    section: {
      size: 9.2,
      uppercase: true,
      letterSpacing: 1.2,
      rule: "hair",
      colored: false,
      spaceBefore: 11,
      spaceAfter: 4,
    },
    entry: { gap: 7.5, bulletGap: 2.2, titleSize: 9.8, bulletIndent: 11 },
    order: INK_ORDER,
  },
};

export const DEFAULT_THEME_SLUG = "jakes";

export function themeForSlug(slug?: string | null): ResumeTheme {
  if (!slug) return THEMES[DEFAULT_THEME_SLUG];
  const key = slug.trim().toLowerCase();
  return THEMES[key] ?? THEMES[DEFAULT_THEME_SLUG];
}

export function isKnownTemplateSlug(slug?: string | null) {
  return Boolean(slug && THEMES[slug.trim().toLowerCase()]);
}

export type FormSectionId = "contact" | SectionId;

/** The editor form follows the same order the template prints, so the two read alike. */
export function formSectionsForSlug(slug?: string | null): FormSectionId[] {
  return ["contact", ...themeForSlug(slug).order];
}

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  coding: "Competitive Programming",
  certifications: "Certifications",
};
