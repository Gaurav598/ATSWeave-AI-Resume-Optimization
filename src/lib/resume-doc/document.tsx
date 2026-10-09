import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeContent } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";
import {
  SECTION_LABELS,
  themeForSlug,
  type ResumeTheme,
  type RuleStyle,
  type SectionId,
} from "@/lib/resume-doc/theme";

/**
 * The resume document. Rendered to a blob in the browser for the editor preview
 * and to a buffer on the server for downloads — the same component either way,
 * so the preview is the file.
 */

const RULE_WIDTH: Record<RuleStyle, number> = {
  none: 0,
  hair: 0.5,
  thin: 0.8,
  thick: 1.6,
};

function ruleColor(theme: ResumeTheme, style: RuleStyle, colored: boolean) {
  if (style === "hair") return theme.muted;
  return colored ? theme.accent : theme.text;
}

function styles(theme: ResumeTheme) {
  return StyleSheet.create({
    page: {
      paddingTop: theme.margin,
      paddingBottom: theme.margin,
      paddingHorizontal: theme.margin,
      fontFamily: theme.font,
      fontSize: theme.baseSize,
      color: theme.text,
      lineHeight: theme.lineHeight,
      backgroundColor: "#ffffff",
    },
    name: {
      fontSize: theme.header.nameSize,
      // Large type needs its own line box; the page-level multiplier is tuned
      // for body copy and leaves no room under a 20pt+ name.
      lineHeight: 1.2,
      fontWeight: "bold",
      letterSpacing: theme.header.nameLetterSpacing,
      color: theme.header.align === "left" ? theme.accent : theme.text,
      textAlign: theme.header.align,
    },
    contact: {
      // Scaled to the name so descenders never reach the contact line.
      marginTop: Math.round(theme.header.nameSize * 0.32),
      fontSize: theme.header.contactSize,
      lineHeight: 1.3,
      color: theme.muted,
      textAlign: theme.header.align,
    },
    headerRule: {
      marginTop: 7,
      alignSelf: theme.header.align === "left" ? "flex-start" : "center",
      width: theme.header.ruleWidth,
      borderBottomWidth: RULE_WIDTH[theme.header.rule],
      borderBottomColor: theme.accent,
    },
    sectionTitle: {
      fontSize: theme.section.size,
      lineHeight: 1.2,
      fontWeight: "bold",
      letterSpacing: theme.section.letterSpacing,
      color: theme.section.colored ? theme.accent : theme.text,
    },
    sectionRule: {
      marginTop: 2,
      borderBottomWidth: RULE_WIDTH[theme.section.rule],
      borderBottomColor: ruleColor(theme, theme.section.rule, theme.section.colored),
    },
    entryHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    entryTitle: {
      fontSize: theme.entry.titleSize,
      lineHeight: 1.25,
      fontWeight: "bold",
      flexShrink: 1,
      paddingRight: 10,
    },
    entryMeta: {
      fontSize: theme.baseSize - 0.4,
      color: theme.muted,
    },
    entrySubtitle: {
      fontSize: theme.baseSize,
      fontStyle: "italic",
      color: theme.muted,
      marginTop: 1,
    },
    bulletRow: {
      flexDirection: "row",
      marginTop: theme.entry.bulletGap,
      paddingLeft: theme.entry.bulletIndent,
    },
    bulletMark: {
      width: 8,
    },
    bulletText: {
      flex: 1,
    },
    skillRow: {
      marginTop: 1.5,
    },
  });
}

type Segment = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };

/** Parses the **bold** / *italic* / __underline__ markers the form accepts. */
export function parseInline(value: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let buffer = "";
  const flush = () => {
    if (buffer) segments.push({ text: buffer });
    buffer = "";
  };
  while (i < value.length) {
    if (value.startsWith("**", i)) {
      const end = value.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        segments.push({ text: value.slice(i + 2, end), bold: true });
        i = end + 2;
        continue;
      }
    }
    if (value.startsWith("__", i)) {
      const end = value.indexOf("__", i + 2);
      if (end !== -1) {
        flush();
        segments.push({ text: value.slice(i + 2, end), underline: true });
        i = end + 2;
        continue;
      }
    }
    if (value[i] === "*" && value[i + 1] !== "*") {
      const end = value.indexOf("*", i + 1);
      if (end !== -1 && value[end + 1] !== "*") {
        flush();
        segments.push({ text: value.slice(i + 1, end), italic: true });
        i = end + 1;
        continue;
      }
    }
    buffer += value[i];
    i += 1;
  }
  flush();
  return segments;
}

function Rich({ text }: { text: string }) {
  const segments = parseInline(text);
  return (
    <>
      {segments.map((segment, index) => (
        <Text
          key={index}
          style={{
            fontWeight: segment.bold ? "bold" : "normal",
            fontStyle: segment.italic ? "italic" : "normal",
            textDecoration: segment.underline ? "underline" : "none",
          }}
        >
          {segment.text}
        </Text>
      ))}
    </>
  );
}

function dateRange(start?: string, end?: string, fallbackPresent = false) {
  const from = formatDateLabel(start);
  const to = formatDateLabel(end) || (from && fallbackPresent ? "Present" : "");
  return [from, to].filter(Boolean).join(" – ");
}

function contactLine(content: ResumeContent, separator: string) {
  const strip = (url?: string) => url?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [
    content.email,
    content.phone,
    content.location,
    strip(content.linkedinUrl),
    strip(content.githubUrl),
    strip(content.portfolioUrl),
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(separator);
}

export function codingLines(content: ResumeContent) {
  const stats = content.codingProfiles?.stats;
  const lines: string[] = [];
  if (stats?.leetcodeSolved) lines.push(`${stats.leetcodeSolved}+ LeetCode problems solved`);
  if (stats?.codeforcesRating) {
    lines.push(
      `Codeforces ${stats.codeforcesRank ? `${stats.codeforcesRank}, ` : ""}rating ${stats.codeforcesRating}`,
    );
  }
  if (stats?.gfgSolved) lines.push(`${stats.gfgSolved}+ GeeksforGeeks problems solved`);
  if (stats?.codechefRating) lines.push(`CodeChef rating ${stats.codechefRating}`);
  return lines;
}

export function skillRows(content: ResumeContent) {
  const categories = content.skillCategories;
  const rows: { label: string; value: string }[] = [];
  if (categories?.languages?.length) {
    rows.push({ label: "Languages", value: categories.languages.join(", ") });
  }
  if (categories?.frameworks?.length) {
    rows.push({ label: "Frameworks & Libraries", value: categories.frameworks.join(", ") });
  }
  if (categories?.tools?.length) {
    rows.push({ label: "Tools & Platforms", value: categories.tools.join(", ") });
  }
  if (!rows.length && content.skills?.length) {
    rows.push({ label: "", value: content.skills.filter(Boolean).join(", ") });
  }
  return rows;
}

function cleanBullets(bullets?: string[]) {
  return (bullets ?? []).map((bullet) => bullet?.trim()).filter(Boolean) as string[];
}

export function hasSectionContent(content: ResumeContent, section: SectionId): boolean {
  switch (section) {
    case "summary":
      return Boolean(content.summary?.trim());
    case "experience":
      return (content.experience ?? []).some(
        (job) => job.company?.trim() || job.title?.trim() || cleanBullets(job.bullets).length,
      );
    case "education":
      return (content.education ?? []).some((item) => item.school?.trim() || item.degree?.trim());
    case "projects":
      return (content.projects ?? []).some(
        (project) => project.name?.trim() || cleanBullets(project.bullets).length,
      );
    case "skills":
      return skillRows(content).length > 0;
    case "coding":
      return codingLines(content).length > 0;
    case "certifications":
      return (content.certifications ?? []).some((cert) => cert.name?.trim());
  }
}

export function isEmptyResume(content: ResumeContent) {
  if (content.fullName?.trim() || content.email?.trim()) return false;
  const sections: SectionId[] = [
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "coding",
    "certifications",
  ];
  return !sections.some((section) => hasSectionContent(content, section));
}

export function ResumeDocument({
  content,
  templateSlug,
  title,
}: {
  content: ResumeContent;
  templateSlug?: string | null;
  title?: string;
}) {
  const theme = themeForSlug(templateSlug);
  const s = styles(theme);
  const contact = contactLine(content, theme.header.separator);
  const name = content.fullName?.trim() || "";
  const displayName = theme.header.uppercase ? name.toUpperCase() : name;

  const Section = ({ id, children }: { id: SectionId; children: React.ReactNode }) => (
    <View style={{ marginTop: theme.section.spaceBefore }} wrap={false}>
      <Text style={s.sectionTitle}>
        {theme.section.uppercase ? SECTION_LABELS[id].toUpperCase() : SECTION_LABELS[id]}
      </Text>
      {theme.section.rule !== "none" ? <View style={s.sectionRule} /> : null}
      <View style={{ marginTop: theme.section.spaceAfter }}>{children}</View>
    </View>
  );

  const Bullets = ({ items }: { items: string[] }) => (
    <>
      {items.map((item, index) => (
        <View key={index} style={s.bulletRow}>
          <Text style={s.bulletMark}>•</Text>
          <Text style={s.bulletText}>
            <Rich text={item} />
          </Text>
        </View>
      ))}
    </>
  );

  const renderSection = (id: SectionId) => {
    if (!hasSectionContent(content, id)) return null;

    if (id === "summary") {
      return (
        <Section id="summary" key="summary">
          <Text>
            <Rich text={content.summary!.trim()} />
          </Text>
        </Section>
      );
    }

    if (id === "experience") {
      return (
        <Section id="experience" key="experience">
          {content.experience.map((job, index) => {
            const bullets = cleanBullets(job.bullets);
            const heading = [job.title?.trim(), job.company?.trim()].filter(Boolean).join(", ");
            if (!heading && !bullets.length) return null;
            return (
              <View key={index} style={{ marginBottom: index === content.experience.length - 1 ? 0 : theme.entry.gap }}>
                <View style={s.entryHeaderRow}>
                  <Text style={s.entryTitle}>{heading}</Text>
                  <Text style={s.entryMeta}>{dateRange(job.startDate, job.endDate, true)}</Text>
                </View>
                {job.location?.trim() ? <Text style={s.entrySubtitle}>{job.location.trim()}</Text> : null}
                <Bullets items={bullets} />
              </View>
            );
          })}
        </Section>
      );
    }

    if (id === "education") {
      return (
        <Section id="education" key="education">
          {content.education.map((item, index) => {
            const degree = [item.degree?.trim(), item.field?.trim()].filter(Boolean).join(" in ");
            const highlights = cleanBullets(item.highlights);
            if (!item.school?.trim() && !degree) return null;
            return (
              <View key={index} style={{ marginBottom: index === content.education.length - 1 ? 0 : theme.entry.gap }}>
                <View style={s.entryHeaderRow}>
                  <Text style={s.entryTitle}>{item.school?.trim()}</Text>
                  <Text style={s.entryMeta}>{dateRange(item.startDate, item.endDate)}</Text>
                </View>
                {degree || item.gpa?.trim() || item.location?.trim() ? (
                  <Text style={s.entrySubtitle}>
                    {[degree, item.gpa?.trim() ? `GPA ${item.gpa.trim()}` : "", item.location?.trim()]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </Text>
                ) : null}
                <Bullets items={highlights} />
              </View>
            );
          })}
        </Section>
      );
    }

    if (id === "projects") {
      const projects = content.projects ?? [];
      return (
        <Section id="projects" key="projects">
          {projects.map((project, index) => {
            const bullets = cleanBullets(project.bullets);
            if (!project.name?.trim() && !bullets.length) return null;
            const tech = (project.tech ?? []).filter(Boolean).join(", ");
            return (
              <View key={index} style={{ marginBottom: index === projects.length - 1 ? 0 : theme.entry.gap }}>
                <View style={s.entryHeaderRow}>
                  <Text style={s.entryTitle}>
                    {project.name?.trim()}
                    {tech ? <Text style={{ fontWeight: "normal", color: theme.muted }}>{`  |  ${tech}`}</Text> : null}
                  </Text>
                  {project.link?.trim() ? (
                    <Text style={s.entryMeta}>{project.link.replace(/^https?:\/\//, "")}</Text>
                  ) : null}
                </View>
                {project.description?.trim() ? (
                  <Text style={{ marginTop: 1 }}>
                    <Rich text={project.description.trim()} />
                  </Text>
                ) : null}
                <Bullets items={bullets} />
              </View>
            );
          })}
        </Section>
      );
    }

    if (id === "skills") {
      return (
        <Section id="skills" key="skills">
          {skillRows(content).map((row, index) => (
            <Text key={index} style={s.skillRow}>
              {row.label ? <Text style={{ fontWeight: "bold" }}>{`${row.label}: `}</Text> : null}
              {row.value}
            </Text>
          ))}
        </Section>
      );
    }

    if (id === "coding") {
      return (
        <Section id="coding" key="coding">
          <Text>{codingLines(content).join("  ·  ")}</Text>
        </Section>
      );
    }

    return (
      <Section id="certifications" key="certifications">
        {(content.certifications ?? []).map((cert, index) => {
          if (!cert.name?.trim()) return null;
          const meta = [cert.issuer?.trim(), cert.date?.trim()].filter(Boolean).join(", ");
          return (
            <Text key={index} style={s.skillRow}>
              <Text style={{ fontWeight: "bold" }}>{cert.name.trim()}</Text>
              {meta ? ` — ${meta}` : ""}
            </Text>
          );
        })}
      </Section>
    );
  };

  return (
    <Document title={title || name || "Resume"} author={name || undefined}>
      <Page size="LETTER" style={s.page}>
        <View>
          {displayName ? <Text style={s.name}>{displayName}</Text> : null}
          {contact ? <Text style={s.contact}>{contact}</Text> : null}
          {theme.header.rule !== "none" && (displayName || contact) ? <View style={s.headerRule} /> : null}
        </View>
        <View style={{ marginTop: theme.header.gapAfter - theme.section.spaceBefore }}>
          {theme.order.map((section) => renderSection(section))}
        </View>
      </Page>
    </Document>
  );
}
