import { escapeLatex, formatDateLabel, formatInlineLatex } from "@/lib/utils";
import type { ResumeContent } from "@/lib/types";

function joinContact(content: ResumeContent, pipe = false) {
  const bits = [
    content.phone,
    content.email,
    content.linkedinUrl ? content.linkedinUrl.replace(/^https?:\/\//, "") : null,
    content.githubUrl ? content.githubUrl.replace(/^https?:\/\//, "") : null,
    content.portfolioUrl ? content.portfolioUrl.replace(/^https?:\/\//, "") : null,
    content.location,
  ].filter(Boolean) as string[];
  const sep = pipe ? " $|$ " : " $\\cdot$ ";
  return bits.map(escapeLatex).join(sep);
}

function itemize(lines: string[]) {
  const bullets = lines.filter((line) => line.trim());
  if (!bullets.length) return "";
  return [
    "\\begin{itemize}",
    ...bullets.map((line) => `  \\item ${formatInlineLatex(line)}`),
    "\\end{itemize}",
  ].join("\n");
}

function skillsBlock(content: ResumeContent, jakeStyle: boolean) {
  const cats = content.skillCategories;
  if (cats) {
    const rows = [
      cats.languages?.length ? `\\textbf{Languages:} ${escapeLatex(cats.languages.join(", "))}` : "",
      cats.frameworks?.length
        ? `\\textbf{Frameworks:} ${escapeLatex(cats.frameworks.join(", "))}`
        : "",
      cats.tools?.length ? `\\textbf{Developer Tools:} ${escapeLatex(cats.tools.join(", "))}` : "",
    ].filter(Boolean);
    if (rows.length) {
      if (jakeStyle) {
        return `\\begin{itemize}[leftmargin=0.15in, label={}]\\small{\\item{${rows.join(" \\\\\\\\ ")}}}\\end{itemize}`;
      }
      return rows.join("\\\\\n");
    }
  }
  if (content.skills?.length) {
    return escapeLatex(content.skills.join(", "));
  }
  return "\\textit{Add skills in Form view.}";
}

function experienceBlock(content: ResumeContent, jakeStyle: boolean) {
  if (!content.experience?.length) return "\\textit{Add experience in Form view.}";
  if (jakeStyle) {
    const entries = content.experience
      .map((job) => {
        const dates = [formatDateLabel(job.startDate), formatDateLabel(job.endDate) || "Present"]
          .filter(Boolean)
          .join(" -- ");
        const bullets = (job.bullets ?? [])
          .filter(Boolean)
          .map((b) => `\\resumeItem{${formatInlineLatex(b)}}`)
          .join("\n");
        return [
          `\\resumeSubheading`,
          `{${escapeLatex(job.title)}}{${escapeLatex(dates)}}`,
          `{${escapeLatex(job.company)}}{${escapeLatex(job.location || "")}}`,
          `\\resumeItemListStart`,
          bullets,
          `\\resumeItemListEnd`,
        ].join("\n");
      })
      .join("\n");
    return `\\resumeSubHeadingListStart\n${entries}\n\\resumeSubHeadingListEnd`;
  }
  return content.experience
    .map((job) => {
      const dates = [formatDateLabel(job.startDate), formatDateLabel(job.endDate) || "Present"]
        .filter(Boolean)
        .join(" -- ");
      const loc = job.location ? `\\hfill ${escapeLatex(job.location)}` : "";
      return [
        `\\textbf{${escapeLatex(job.title)}} \\hfill ${escapeLatex(dates)}\\\\`,
        `\\textit{${escapeLatex(job.company)}}${loc}`,
        itemize(job.bullets),
      ].join("\n");
    })
    .join("\n\\vspace{6pt}\n");
}

function educationBlock(content: ResumeContent, jakeStyle: boolean) {
  if (!content.education?.length) return "\\textit{Add education in Form view.}";
  if (jakeStyle) {
    const entries = content.education
      .map((ed) => {
        const dates = [formatDateLabel(ed.startDate), formatDateLabel(ed.endDate)].filter(Boolean).join(" -- ");
        const degree = [ed.degree, ed.field].filter(Boolean).join(" in ");
        const gpa = ed.gpa ? `, GPA: ${escapeLatex(ed.gpa)}` : "";
        const highlights = (ed.highlights ?? []).filter((h) => h.trim());
        const highlightItems = highlights.length
          ? [
              `\\resumeItemListStart`,
              ...highlights.map((h) => `\\resumeItem{${formatInlineLatex(h)}}`),
              `\\resumeItemListEnd`,
            ].join("\n")
          : "";
        return [
          `\\resumeSubheading`,
          `{${escapeLatex(ed.school)}}{${escapeLatex(ed.location || "")}}`,
          `{${escapeLatex(degree)}${gpa}}{${escapeLatex(dates)}}`,
          highlightItems,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n");
    return `\\resumeSubHeadingListStart\n${entries}\n\\resumeSubHeadingListEnd`;
  }
  return content.education
    .map((ed) => {
      const dates = [formatDateLabel(ed.startDate), formatDateLabel(ed.endDate)].filter(Boolean).join(" -- ");
      const degree = [ed.degree, ed.field].filter(Boolean).join(" in ");
      const gpa = ed.gpa ? `\\hfill GPA: ${escapeLatex(ed.gpa)}` : "";
      const highlights = (ed.highlights ?? []).filter((h) => h.trim());
      return [
        `\\textbf{${escapeLatex(ed.school)}} \\hfill ${escapeLatex(dates)}\\\\`,
        `${escapeLatex(degree)}${gpa}`,
        highlights.length ? itemize(highlights) : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\\vspace{6pt}\n");
}

function projectsBlock(content: ResumeContent, jakeStyle: boolean) {
  if (!content.projects?.length) return "";
  if (jakeStyle) {
    const entries = content.projects
      .map((project) => {
        const title = `\\textbf{${escapeLatex(project.name)}}${
          project.tech?.length ? ` $|$ \\emph{${escapeLatex(project.tech.join(", "))}}` : ""
        }`;
        const bullets = (project.bullets ?? [])
          .filter(Boolean)
          .map((b) => `\\resumeItem{${formatInlineLatex(b)}}`)
          .join("\n");
        return [
          `\\resumeProjectHeading`,
          `{${title}}{${escapeLatex(project.link || "")}}`,
          `\\resumeItemListStart`,
          bullets || (project.description ? `\\resumeItem{${formatInlineLatex(project.description)}}` : ""),
          `\\resumeItemListEnd`,
        ].join("\n");
      })
      .join("\n");
    return `\\section{Projects}\n\\resumeSubHeadingListStart\n${entries}\n\\resumeSubHeadingListEnd`;
  }
  const body = content.projects
    .map((project) => {
      const tech = project.tech?.length ? ` \\textit{(${escapeLatex(project.tech.join(", "))})}` : "";
      const link = project.link ? ` \\href{${escapeLatex(project.link)}}{[link]}` : "";
      return [
        `\\textbf{${escapeLatex(project.name)}}${tech}${link}\\\\`,
        project.description ? `${escapeLatex(project.description)}` : "",
        itemize(project.bullets ?? []),
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\\vspace{6pt}\n");
  return `\\section*{Projects}\n${body}`;
}

function certificationsBlock(content: ResumeContent) {
  if (!content.certifications?.length) return "";
  const body = content.certifications
    .map((cert) => {
      const extra = [cert.issuer, cert.date].filter(Boolean).join(" -- ");
      return `\\textbf{${escapeLatex(cert.name)}}${extra ? ` --- ${escapeLatex(extra)}` : ""}`;
    })
    .join("\\\\\n");
  return `\\section*{Certifications}\n${body}`;
}

function codingBlock(content: ResumeContent) {
  const stats = content.codingProfiles?.stats;
  const lines: string[] = [];
  if (stats?.leetcodeSolved) lines.push(`${stats.leetcodeSolved}+ LeetCode problems solved`);
  if (stats?.codeforcesRating) {
    lines.push(
      `Codeforces ${stats.codeforcesRank ? stats.codeforcesRank + ", " : ""}rating ${stats.codeforcesRating}`,
    );
  }
  if (stats?.gfgSolved) lines.push(`${stats.gfgSolved}+ GeeksforGeeks problems solved`);
  if (stats?.codechefRating) lines.push(`CodeChef rating ${stats.codechefRating}`);
  if (!lines.length) return "";
  return `\\section*{Competitive Programming}\n${escapeLatex(lines.join(" | "))}`;
}

function summaryBlock(content: ResumeContent) {
  if (!content.summary?.trim()) return "";
  return `\\section*{Summary}\n${formatInlineLatex(content.summary)}`;
}

export function injectLatex(templateSource: string, content: ResumeContent) {
  const jakeStyle = templateSource.includes("\\resumeSubheading");
  const replacements: Record<string, string> = {
    "{{fullName}}": escapeLatex(content.fullName || "Your Name"),
    "{{contactLine}}": joinContact(content, jakeStyle) || "email@domain.com",
    "{{summaryBlock}}": summaryBlock(content),
    "{{skillsBlock}}": skillsBlock(content, jakeStyle),
    "{{experienceBlock}}": experienceBlock(content, jakeStyle),
    "{{projectsBlock}}": projectsBlock(content, jakeStyle),
    "{{educationBlock}}": educationBlock(content, jakeStyle),
    "{{certificationsBlock}}": certificationsBlock(content),
    "{{codingBlock}}": codingBlock(content),
  };

  let output = templateSource;
  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(value);
  }
  return output;
}

export function detectAtsBreakingLatex(source: string) {
  const issues: string[] = [];
  if (/\\begin\{tabular\}/i.test(source) && !/resumeSubheading/i.test(source)) {
    issues.push("Contains a table (tabular)");
  }
  if (/\\begin\{minipage\}/i.test(source)) issues.push("Contains minipage columns");
  if (/twocolumn|\\column/i.test(source)) issues.push("Multi-column layout detected");
  if (/\\includegraphics/i.test(source)) issues.push("Contains an image");
  if (/tikz|pgf/i.test(source)) issues.push("Contains graphics/TikZ");
  if (/fontawesome|\\fa[A-Z]/i.test(source)) issues.push("Contains icon fonts");
  if (/textbox|textblock/i.test(source)) issues.push("Contains text boxes");
  return issues;
}
