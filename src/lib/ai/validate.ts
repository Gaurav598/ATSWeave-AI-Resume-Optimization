import type { PipelineWarning, ResumeContent } from "@/lib/types";

const NUMBER = /(\d+(?:\.\d+)?%?|\b\d{2,}\+?\b)/g;
const TOOLISH = /\b[A-Z][A-Za-z0-9.+#]{1,24}\b/g;

function corpus(content: ResumeContent) {
  return [
    content.summary,
    ...(content.skills ?? []),
    ...(content.skillCategories?.languages ?? []),
    ...(content.skillCategories?.frameworks ?? []),
    ...(content.skillCategories?.tools ?? []),
    ...(content.experience ?? []).flatMap((j) => [j.company, j.title, j.location, ...(j.bullets ?? [])]),
    ...(content.projects ?? []).flatMap((p) => [p.name, p.description, ...(p.bullets ?? []), ...(p.tech ?? [])]),
    ...(content.education ?? []).flatMap((e) => [e.school, e.degree, e.field]),
  ]
    .filter(Boolean)
    .join(" \n ");
}

export function validateRewrite(original: ResumeContent, rewritten: ResumeContent): PipelineWarning[] {
  const warnings: PipelineWarning[] = [];
  const source = corpus(original);
  const sourceLower = source.toLowerCase();

  const origCompanies = new Set((original.experience ?? []).map((j) => j.company.trim().toLowerCase()));
  for (const job of rewritten.experience ?? []) {
    if (job.company && !origCompanies.has(job.company.trim().toLowerCase())) {
      warnings.push({
        type: "fabricated_claim",
        message: `New employer "${job.company}" was not in your profile and was blocked.`,
        evidence: job.company,
      });
    }
  }

  const origSchools = new Set((original.education ?? []).map((e) => e.school.trim().toLowerCase()));
  for (const ed of rewritten.education ?? []) {
    if (ed.school && !origSchools.has(ed.school.trim().toLowerCase())) {
      warnings.push({
        type: "fabricated_claim",
        message: `New school "${ed.school}" was not in your profile and was blocked.`,
        evidence: ed.school,
      });
    }
  }

  const newText = corpus(rewritten);
  const numbers = newText.match(NUMBER) ?? [];
  for (const n of numbers) {
    if (!source.includes(n) && !sourceLower.includes(n.toLowerCase())) {
      warnings.push({
        type: "fabricated_claim",
        message: `Metric "${n}" does not appear in your original profile.`,
        evidence: n,
      });
    }
  }

  const tools = newText.match(TOOLISH) ?? [];
  const allow = new Set(
    ["I", "The", "A", "In", "For", "And", "With", "Built", "Led", "Present", "GPA", "API", "APIs", "CI", "CD"],
  );
  for (const tool of tools) {
    if (allow.has(tool)) continue;
    if (!sourceLower.includes(tool.toLowerCase())) {
      warnings.push({
        type: "fabricated_claim",
        message: `"${tool}" does not appear in your original profile.`,
        evidence: tool,
      });
    }
  }

  return warnings;
}

export function stripFabrications(original: ResumeContent, rewritten: ResumeContent): ResumeContent {
  const origCompanies = new Set((original.experience ?? []).map((j) => j.company.trim().toLowerCase()));
  const origSchools = new Set((original.education ?? []).map((e) => e.school.trim().toLowerCase()));
  const origSkills = new Set((original.skills ?? []).map((s) => s.toLowerCase()));
  const origSkillBag = new Set(
    [
      ...(original.skills ?? []),
      ...(original.skillCategories?.languages ?? []),
      ...(original.skillCategories?.frameworks ?? []),
      ...(original.skillCategories?.tools ?? []),
    ].map((s) => s.toLowerCase()),
  );

  return {
    ...rewritten,
    fullName: original.fullName,
    email: original.email,
    phone: original.phone,
    location: original.location,
    linkedinUrl: original.linkedinUrl,
    githubUrl: original.githubUrl,
    portfolioUrl: original.portfolioUrl,
    codingProfiles: original.codingProfiles,
    skills: (rewritten.skills ?? []).filter((s) => origSkills.has(s.toLowerCase()) || origSkillBag.has(s.toLowerCase())),
    skillCategories: original.skillCategories
      ? {
          languages: (rewritten.skillCategories?.languages ?? original.skillCategories.languages).filter((s) =>
            origSkillBag.has(s.toLowerCase()),
          ),
          frameworks: (rewritten.skillCategories?.frameworks ?? original.skillCategories.frameworks).filter((s) =>
            origSkillBag.has(s.toLowerCase()),
          ),
          tools: (rewritten.skillCategories?.tools ?? original.skillCategories.tools).filter((s) =>
            origSkillBag.has(s.toLowerCase()),
          ),
        }
      : rewritten.skillCategories,
    experience: (original.experience ?? []).map((orig, idx) => {
      const next = rewritten.experience?.[idx];
      if (!next || !origCompanies.has(next.company.trim().toLowerCase())) return orig;
      return {
        ...orig,
        title: orig.title,
        bullets: (next.bullets?.length ? next.bullets : orig.bullets).slice(0, Math.max(orig.bullets.length, 6)),
      };
    }),
    education: (original.education ?? []).map((orig, idx) => {
      const next = rewritten.education?.[idx];
      if (!next || !origSchools.has(next.school.trim().toLowerCase())) return orig;
      return orig;
    }),
    projects: original.projects,
    certifications: original.certifications,
  };
}
