import type { ResumeContent } from "@/lib/types";
import { codingLines, hasSectionContent, skillRows } from "@/lib/resume-doc/document";
import { SECTION_LABELS, themeForSlug } from "@/lib/resume-doc/theme";
import { formatDateLabel } from "@/lib/utils";

function stripMarkers(value: string) {
  return value.replace(/\*\*|__|\*/g, "");
}

/**
 * The text an ATS would read, in the same order the PDF lays it out. Derived
 * from content rather than parsed back out of the PDF, so scoring never drifts
 * from what was rendered.
 */
export function resumePlainText(content: ResumeContent, templateSlug?: string | null) {
  const theme = themeForSlug(templateSlug);
  const lines: string[] = [];

  if (content.fullName?.trim()) lines.push(content.fullName.trim());
  const contact = [
    content.email,
    content.phone,
    content.location,
    content.linkedinUrl,
    content.githubUrl,
    content.portfolioUrl,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);
  if (contact.length) lines.push(contact.join(" | "));

  for (const section of theme.order) {
    if (!hasSectionContent(content, section)) continue;
    lines.push("", SECTION_LABELS[section].toUpperCase());

    switch (section) {
      case "summary":
        lines.push(stripMarkers(content.summary!.trim()));
        break;

      case "experience":
        for (const job of content.experience ?? []) {
          const heading = [job.title?.trim(), job.company?.trim()].filter(Boolean).join(", ");
          const dates = [formatDateLabel(job.startDate), formatDateLabel(job.endDate) || "Present"]
            .filter(Boolean)
            .join(" – ");
          if (heading) lines.push([heading, dates, job.location?.trim()].filter(Boolean).join(" | "));
          for (const bullet of job.bullets ?? []) {
            if (bullet?.trim()) lines.push(`• ${stripMarkers(bullet.trim())}`);
          }
        }
        break;

      case "education":
        for (const item of content.education ?? []) {
          const degree = [item.degree?.trim(), item.field?.trim()].filter(Boolean).join(" in ");
          const dates = [formatDateLabel(item.startDate), formatDateLabel(item.endDate)]
            .filter(Boolean)
            .join(" – ");
          const row = [item.school?.trim(), degree, item.gpa?.trim() ? `GPA ${item.gpa.trim()}` : "", dates]
            .filter(Boolean)
            .join(" | ");
          if (row) lines.push(row);
          for (const highlight of item.highlights ?? []) {
            if (highlight?.trim()) lines.push(`• ${stripMarkers(highlight.trim())}`);
          }
        }
        break;

      case "projects":
        for (const project of content.projects ?? []) {
          const tech = (project.tech ?? []).filter(Boolean).join(", ");
          const row = [project.name?.trim(), tech].filter(Boolean).join(" | ");
          if (row) lines.push(row);
          if (project.description?.trim()) lines.push(stripMarkers(project.description.trim()));
          for (const bullet of project.bullets ?? []) {
            if (bullet?.trim()) lines.push(`• ${stripMarkers(bullet.trim())}`);
          }
        }
        break;

      case "skills":
        for (const row of skillRows(content)) {
          lines.push(row.label ? `${row.label}: ${row.value}` : row.value);
        }
        break;

      case "coding":
        lines.push(codingLines(content).join(" · "));
        break;

      case "certifications":
        for (const cert of content.certifications ?? []) {
          if (!cert.name?.trim()) continue;
          const meta = [cert.issuer?.trim(), cert.date?.trim()].filter(Boolean).join(", ");
          lines.push(meta ? `${cert.name.trim()} — ${meta}` : cert.name.trim());
        }
        break;
    }
  }

  return lines.join("\n").trim();
}
