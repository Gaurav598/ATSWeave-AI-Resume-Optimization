"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextField } from "@/components/editor/rich-text-field";
import { formSectionsForSlug, type FormSectionId } from "@/lib/resume-doc/theme";
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeContent,
} from "@/lib/types";

export function ResumeEditorForm({
  content,
  onChange,
  templateSlug,
  templateName,
}: {
  content: ResumeContent;
  onChange: (content: ResumeContent) => void;
  /** Drives which fields appear and in what order, matching the rendered page. */
  templateSlug?: string | null;
  templateName?: string | null;
}) {
  const set = (patch: Partial<ResumeContent>) => onChange({ ...content, ...patch });
  const cats = content.skillCategories ?? { languages: [], frameworks: [], tools: [] };
  const order = formSectionsForSlug(templateSlug);

  const setCategory = (key: "languages" | "frameworks" | "tools", raw: string) => {
    const values = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const skillCategories = { ...cats, [key]: values };
    const skills = Array.from(
      new Set([
        ...(skillCategories.languages ?? []),
        ...(skillCategories.frameworks ?? []),
        ...(skillCategories.tools ?? []),
      ]),
    );
    set({ skillCategories, skills });
  };

  const coding = content.codingProfiles ?? {};

  const blocks: Partial<Record<FormSectionId, ReactNode>> = {
    contact: (
      <Section key="contact" title="Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input
              placeholder="Your name"
              value={content.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              placeholder="you@email.com"
              value={content.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input value={content.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input value={content.location ?? ""} onChange={(e) => set({ location: e.target.value })} />
          </Field>
          <Field label="LinkedIn">
            <Input value={content.linkedinUrl ?? ""} onChange={(e) => set({ linkedinUrl: e.target.value })} />
          </Field>
          <Field label="GitHub">
            <Input value={content.githubUrl ?? ""} onChange={(e) => set({ githubUrl: e.target.value })} />
          </Field>
          <Field label="Portfolio" className="sm:col-span-2">
            <Input value={content.portfolioUrl ?? ""} onChange={(e) => set({ portfolioUrl: e.target.value })} />
          </Field>
        </div>
      </Section>
    ),
    summary: (
      <Section key="summary" title="Summary">
        <RichTextField
          label="Professional summary"
          rows={4}
          placeholder="2–3 lines for this role. Select text → Bold to emphasize keywords."
          value={content.summary ?? ""}
          onChange={(summary) => set({ summary })}
        />
      </Section>
    ),
    skills: (
      <Section key="skills" title="Technical skills">
        <div className="grid gap-3">
          <Field label="Languages">
            <Input
              placeholder="TypeScript, Python, SQL"
              value={(cats.languages ?? []).join(", ")}
              onChange={(e) => setCategory("languages", e.target.value)}
            />
          </Field>
          <Field label="Frameworks">
            <Input
              placeholder="React, Next.js, Node.js"
              value={(cats.frameworks ?? []).join(", ")}
              onChange={(e) => setCategory("frameworks", e.target.value)}
            />
          </Field>
          <Field label="Tools">
            <Input
              placeholder="PostgreSQL, Docker, AWS"
              value={(cats.tools ?? []).join(", ")}
              onChange={(e) => setCategory("tools", e.target.value)}
            />
          </Field>
        </div>
      </Section>
    ),
    experience: (
      <Section
        key="experience"
        title="Experience"
        action={
          <AddButton
            onClick={() =>
              set({
                experience: [
                  ...content.experience,
                  { company: "", title: "", location: "", startDate: "", endDate: "", bullets: [""] },
                ],
              })
            }
          />
        }
      >
        {content.experience.map((job, index) => (
          <Card
            key={index}
            onRemove={() => set({ experience: content.experience.filter((_, i) => i !== index) })}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Job title"
                value={job.title}
                onChange={(e) => patchExperience(content, onChange, index, { title: e.target.value })}
              />
              <Input
                placeholder="Company"
                value={job.company}
                onChange={(e) => patchExperience(content, onChange, index, { company: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={job.location ?? ""}
                onChange={(e) => patchExperience(content, onChange, index, { location: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Start (e.g. Jan 2022)"
                  value={job.startDate}
                  onChange={(e) => patchExperience(content, onChange, index, { startDate: e.target.value })}
                />
                <Input
                  placeholder="End / Present"
                  value={job.endDate ?? ""}
                  onChange={(e) => patchExperience(content, onChange, index, { endDate: e.target.value })}
                />
              </div>
            </div>
            <RichTextField
              className="mt-2"
              label="Achievement bullets (one per line)"
              rows={5}
              placeholder={"Reduced p95 latency by 40% by…\nLed migration of **payment** service to…"}
              value={job.bullets.join("\n")}
              onChange={(raw) =>
                patchExperience(content, onChange, index, { bullets: raw.split("\n") })
              }
            />
          </Card>
        ))}
      </Section>
    ),
    education: (
      <Section
        key="education"
        title="Education"
        action={
          <AddButton
            onClick={() =>
              set({
                education: [
                  ...content.education,
                  {
                    school: "",
                    degree: "",
                    field: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    gpa: "",
                    highlights: [],
                  },
                ],
              })
            }
          />
        }
      >
        {content.education.map((ed, index) => (
          <Card
            key={index}
            onRemove={() => set({ education: content.education.filter((_, i) => i !== index) })}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="School"
                value={ed.school}
                onChange={(e) => patchEducation(content, onChange, index, { school: e.target.value })}
              />
              <Input
                placeholder="Degree"
                value={ed.degree}
                onChange={(e) => patchEducation(content, onChange, index, { degree: e.target.value })}
              />
              <Input
                placeholder="Field of study"
                value={ed.field ?? ""}
                onChange={(e) => patchEducation(content, onChange, index, { field: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={ed.location ?? ""}
                onChange={(e) => patchEducation(content, onChange, index, { location: e.target.value })}
              />
              <Input
                placeholder="GPA (optional)"
                value={ed.gpa ?? ""}
                onChange={(e) => patchEducation(content, onChange, index, { gpa: e.target.value })}
              />
              <Input
                placeholder="Start"
                value={ed.startDate ?? ""}
                onChange={(e) => patchEducation(content, onChange, index, { startDate: e.target.value })}
              />
              <Input
                placeholder="End"
                value={ed.endDate ?? ""}
                onChange={(e) => patchEducation(content, onChange, index, { endDate: e.target.value })}
              />
            </div>
            <RichTextField
              className="mt-2"
              label="Highlights (thesis, awards — one per line)"
              rows={3}
              placeholder={"Thesis: …\nAdvisor: …"}
              value={(ed.highlights ?? []).join("\n")}
              onChange={(raw) =>
                patchEducation(content, onChange, index, {
                  highlights: raw.split("\n"),
                })
              }
            />
          </Card>
        ))}
      </Section>
    ),
    projects: (
      <Section
        key="projects"
        title="Projects"
        action={
          <AddButton
            onClick={() =>
              set({
                projects: [
                  ...(content.projects ?? []),
                  { name: "", description: "", bullets: [""], link: "", tech: [] },
                ],
              })
            }
          />
        }
      >
        {(content.projects ?? []).map((project, index) => (
          <Card
            key={index}
            onRemove={() =>
              set({ projects: (content.projects ?? []).filter((_, i) => i !== index) })
            }
          >
            <div className="grid gap-2">
              <Input
                placeholder="Project name"
                value={project.name}
                onChange={(e) => patchProject(content, onChange, index, { name: e.target.value })}
              />
              <Input
                placeholder="Link (optional)"
                value={project.link ?? ""}
                onChange={(e) => patchProject(content, onChange, index, { link: e.target.value })}
              />
              <Input
                placeholder="Tech stack, comma-separated"
                value={(project.tech ?? []).join(", ")}
                onChange={(e) =>
                  patchProject(content, onChange, index, {
                    tech: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
              <RichTextField
                label="Project bullets"
                rows={3}
                placeholder="Bullets, one per line"
                value={project.bullets.join("\n")}
                onChange={(raw) =>
                  patchProject(content, onChange, index, { bullets: raw.split("\n") })
                }
              />
            </div>
          </Card>
        ))}
      </Section>
    ),
    certifications: (
      <Section
        key="certifications"
        title="Certifications"
        action={
          <AddButton
            onClick={() =>
              set({
                certifications: [
                  ...(content.certifications ?? []),
                  { name: "", issuer: "", date: "" },
                ],
              })
            }
          />
        }
      >
        {(content.certifications ?? []).length === 0 ? (
          <Empty hint="Optional — add certifications if this resume includes them." />
        ) : null}
        {(content.certifications ?? []).map((cert, index) => (
          <Card
            key={index}
            onRemove={() =>
              set({ certifications: (content.certifications ?? []).filter((_, i) => i !== index) })
            }
          >
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                placeholder="Name"
                value={cert.name}
                onChange={(e) => patchCert(content, onChange, index, { name: e.target.value })}
              />
              <Input
                placeholder="Issuer"
                value={cert.issuer ?? ""}
                onChange={(e) => patchCert(content, onChange, index, { issuer: e.target.value })}
              />
              <Input
                placeholder="Date"
                value={cert.date ?? ""}
                onChange={(e) => patchCert(content, onChange, index, { date: e.target.value })}
              />
            </div>
          </Card>
        ))}
      </Section>
    ),
    coding: (
      <Section key="coding" title="Competitive programming">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="LeetCode URL">
            <Input
              value={coding.leetcode ?? ""}
              onChange={(e) =>
                set({ codingProfiles: { ...coding, leetcode: e.target.value } })
              }
            />
          </Field>
          <Field label="Codeforces URL">
            <Input
              value={coding.codeforces ?? ""}
              onChange={(e) =>
                set({ codingProfiles: { ...coding, codeforces: e.target.value } })
              }
            />
          </Field>
          <Field label="LeetCode solved">
            <Input
              type="number"
              value={coding.stats?.leetcodeSolved ?? ""}
              onChange={(e) =>
                set({
                  codingProfiles: {
                    ...coding,
                    stats: {
                      ...coding.stats,
                      leetcodeSolved: e.target.value ? Number(e.target.value) : undefined,
                    },
                  },
                })
              }
            />
          </Field>
          <Field label="Codeforces rating">
            <Input
              type="number"
              value={coding.stats?.codeforcesRating ?? ""}
              onChange={(e) =>
                set({
                  codingProfiles: {
                    ...coding,
                    stats: {
                      ...coding.stats,
                      codeforcesRating: e.target.value ? Number(e.target.value) : undefined,
                    },
                  },
                })
              }
            />
          </Field>
          <Field label="GeeksforGeeks solved">
            <Input
              type="number"
              value={coding.stats?.gfgSolved ?? ""}
              onChange={(e) =>
                set({
                  codingProfiles: {
                    ...coding,
                    stats: {
                      ...coding.stats,
                      gfgSolved: e.target.value ? Number(e.target.value) : undefined,
                    },
                  },
                })
              }
            />
          </Field>
          <Field label="CodeChef rating">
            <Input
              type="number"
              value={coding.stats?.codechefRating ?? ""}
              onChange={(e) =>
                set({
                  codingProfiles: {
                    ...coding,
                    stats: {
                      ...coding.stats,
                      codechefRating: e.target.value ? Number(e.target.value) : undefined,
                    },
                  },
                })
              }
            />
          </Field>
        </div>
      </Section>
    ),
  };

  return (
    <div className="grid gap-8 p-5 pb-24">
      <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {templateName ? (
          <>
            Sections are ordered the way <strong className="text-foreground">{templateName}</strong> prints
            them. Empty sections are left off the page.
          </>
        ) : (
          <>Empty sections are left off the page.</>
        )}
      </p>

      {order.map((id) => blocks[id])}
    </div>
  );
}

function patchExperience(
  content: ResumeContent,
  onChange: (c: ResumeContent) => void,
  index: number,
  patch: Partial<ExperienceItem>,
) {
  onChange({
    ...content,
    experience: content.experience.map((row, i) => (i === index ? { ...row, ...patch } : row)),
  });
}

function patchEducation(
  content: ResumeContent,
  onChange: (c: ResumeContent) => void,
  index: number,
  patch: Partial<EducationItem>,
) {
  onChange({
    ...content,
    education: content.education.map((row, i) => (i === index ? { ...row, ...patch } : row)),
  });
}

function patchProject(
  content: ResumeContent,
  onChange: (c: ResumeContent) => void,
  index: number,
  patch: Partial<ProjectItem>,
) {
  const projects = [...(content.projects ?? [])];
  projects[index] = { ...projects[index], ...patch };
  onChange({ ...content, projects });
}

function patchCert(
  content: ResumeContent,
  onChange: (c: ResumeContent) => void,
  index: number,
  patch: Partial<CertificationItem>,
) {
  const certifications = [...(content.certifications ?? [])];
  certifications[index] = { ...certifications[index], ...patch };
  onChange({ ...content, certifications });
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Card({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-background p-4">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-red-600"
      >
        <Trash2 className="h-3 w-3" /> Remove
      </button>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="secondary" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" /> Add
    </Button>
  );
}

function Empty({ hint }: { hint: string }) {
  return <p className="text-sm text-muted-foreground">{hint}</p>;
}
