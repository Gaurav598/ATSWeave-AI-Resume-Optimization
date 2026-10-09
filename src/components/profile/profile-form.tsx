"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STEPS = [
  "Contact",
  "Role",
  "Skills",
  "Experience",
  "Education",
  "Projects",
  "Certifications",
];

type Profile = Record<string, unknown>;

const CODING_SOURCES = [
  { key: "leetcode", label: "LeetCode", placeholder: "https://leetcode.com/u/yourhandle" },
  { key: "codeforces", label: "Codeforces", placeholder: "https://codeforces.com/profile/yourhandle" },
  { key: "gfg", label: "GeeksforGeeks", placeholder: "https://geeksforgeeks.org/user/yourhandle" },
  { key: "codechef", label: "CodeChef", placeholder: "https://codechef.com/users/yourhandle" },
] as const;

export function ProfileForm({ redirectTo }: { redirectTo?: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/profile")).json() as Promise<Profile>,
  });
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const save = useMutation({
    mutationFn: async (payload: Profile) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast.error("A change didn't save", { description: "Your last edit may be lost." });
    },
  });

  const profile = data ?? {};
  const update = (patch: Profile) => {
    const next = { ...profile, ...patch, onboardingStep: step };
    queryClient.setQueryData(["profile"], next);
    save.mutate(next);
  };

  if (!data) {
    return <div className="p-10 text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
      <p className="eyebrow">Career profile</p>
      <h1 className="mt-4 font-display text-4xl">Your experience library</h1>
      <p className="mt-2 text-muted-foreground">
        Fill this once. AI job matching only ever rewords what you enter. For a manual template,
        import this profile from the editor in one click — templates never silently swap in a
        different person.
      </p>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs",
              i === step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (from account)">
              <Input value={String(profile.name ?? "")} disabled />
            </Field>
            <Field label="Email (from account)">
              <Input value={String(profile.email ?? "")} disabled />
            </Field>
            <Field label="Phone">
              <Input defaultValue={String(profile.phone ?? "")} onBlur={(e) => update({ phone: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input defaultValue={String(profile.location ?? "")} onBlur={(e) => update({ location: e.target.value })} />
            </Field>
            <Field label="LinkedIn URL">
              <Input defaultValue={String(profile.linkedinUrl ?? "")} onBlur={(e) => update({ linkedinUrl: e.target.value })} />
            </Field>
            <Field label="GitHub URL">
              <Input defaultValue={String(profile.githubUrl ?? "")} onBlur={(e) => update({ githubUrl: e.target.value })} />
            </Field>
            <Field label="Portfolio URL" className="sm:col-span-2">
              <Input defaultValue={String(profile.portfolioUrl ?? "")} onBlur={(e) => update({ portfolioUrl: e.target.value })} />
            </Field>
            <Field label="Professional summary" className="sm:col-span-2">
              <Textarea
                rows={4}
                placeholder="2–4 lines describing your focus and strongest proof points. Job match can tailor wording — not invent facts."
                defaultValue={String(profile.summary ?? "")}
                onBlur={(e) => update({ summary: e.target.value })}
              />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4">
            <Field label="Target role">
              <div className="flex flex-wrap gap-2">
                {["SWE", "Data", "PM", "Design", "Other"].map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={profile.targetRole === role ? "default" : "secondary"}
                    onClick={() => update({ targetRole: role })}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </Field>
            {["SWE", "Data"].includes(String(profile.targetRole)) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {CODING_SOURCES.map(({ key, label, placeholder }) => (
                  <Field key={key} label={label}>
                    <Input
                      placeholder={placeholder}
                      defaultValue={String((profile.codingProfiles as Record<string, string> | undefined)?.[key] ?? "")}
                      onBlur={async (e) => {
                        const codingProfiles = {
                          ...((profile.codingProfiles as object) ?? {}),
                          [key]: e.target.value,
                        };
                        update({ codingProfiles });
                        if (!e.target.value.trim()) return;

                        const res = await fetch("/api/coding-stats", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(codingProfiles),
                        });
                        if (!res.ok) {
                          toast.error("Could not reach the stats service");
                          return;
                        }
                        const data = (await res.json()) as {
                          codingProfiles: object;
                          outcomes: { source: string; status: string }[];
                        };
                        update({ codingProfiles: data.codingProfiles });

                        const outcome = data.outcomes.find((o) => o.source === key);
                        if (outcome?.status === "fetched") {
                          toast.success(`${label} stats imported`);
                        } else if (outcome) {
                          toast.message(`Couldn't read ${label} stats`, {
                            description: "The profile may be private. Enter the numbers manually in the editor.",
                          });
                        }
                      }}
                    />
                  </Field>
                ))}
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            {(["languages", "frameworks", "tools"] as const).map((cat) => (
              <Field key={cat} label={cat}>
                <Input
                  placeholder="Comma separated"
                  defaultValue={(((profile.skillCategories as Record<string, string[]>) ?? {})[cat] ?? []).join(", ")}
                  onBlur={(e) => {
                    const values = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    const skillCategories = {
                      languages: [],
                      frameworks: [],
                      tools: [],
                      ...((profile.skillCategories as object) ?? {}),
                      [cat]: values,
                    };
                    const skills = Array.from(
                      new Set([
                        ...((skillCategories.languages as string[]) ?? []),
                        ...((skillCategories.frameworks as string[]) ?? []),
                        ...((skillCategories.tools as string[]) ?? []),
                      ]),
                    );
                    update({ skillCategories, skills });
                  }}
                />
              </Field>
            ))}
          </div>
        )}
        {step === 3 && (
          <Repeatable
            items={(profile.experience as Array<Record<string, unknown>>) ?? []}
            blank={{ company: "", title: "", location: "", startDate: "", endDate: "", bullets: [""] }}
            onChange={(experience) => update({ experience })}
            render={(item, patch) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Company" defaultValue={String(item.company ?? "")} onBlur={(e) => patch({ company: e.target.value })} />
                <Input placeholder="Title" defaultValue={String(item.title ?? "")} onBlur={(e) => patch({ title: e.target.value })} />
                <Input placeholder="Location" defaultValue={String(item.location ?? "")} onBlur={(e) => patch({ location: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Start" defaultValue={String(item.startDate ?? "")} onBlur={(e) => patch({ startDate: e.target.value })} />
                  <Input placeholder="End / Present" defaultValue={String(item.endDate ?? "")} onBlur={(e) => patch({ endDate: e.target.value })} />
                </div>
                <Textarea
                  className="sm:col-span-2"
                  placeholder="Reduced API latency by 40% by..."
                  defaultValue={((item.bullets as string[]) ?? []).join("\n")}
                  onBlur={(e) => patch({ bullets: e.target.value.split("\n").filter(Boolean) })}
                />
              </div>
            )}
          />
        )}
        {step === 4 && (
          <Repeatable
            items={(profile.education as Array<Record<string, unknown>>) ?? []}
            blank={{ school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" }}
            onChange={(education) => update({ education })}
            render={(item, patch) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="School" defaultValue={String(item.school ?? "")} onBlur={(e) => patch({ school: e.target.value })} />
                <Input placeholder="Degree" defaultValue={String(item.degree ?? "")} onBlur={(e) => patch({ degree: e.target.value })} />
                <Input placeholder="Field of study" defaultValue={String(item.field ?? "")} onBlur={(e) => patch({ field: e.target.value })} />
                <Input placeholder="GPA (optional)" defaultValue={String(item.gpa ?? "")} onBlur={(e) => patch({ gpa: e.target.value })} />
                <Input placeholder="Start (e.g. 2019)" defaultValue={String(item.startDate ?? "")} onBlur={(e) => patch({ startDate: e.target.value })} />
                <Input placeholder="End (e.g. 2023)" defaultValue={String(item.endDate ?? "")} onBlur={(e) => patch({ endDate: e.target.value })} />
              </div>
            )}
          />
        )}
        {step === 5 && (
          <Repeatable
            items={(profile.projects as Array<Record<string, unknown>>) ?? []}
            blank={{ name: "", description: "", bullets: [""], link: "", tech: [] }}
            onChange={(projects) => update({ projects })}
            render={(item, patch) => (
              <div className="grid gap-3">
                <Input placeholder="Project name" defaultValue={String(item.name ?? "")} onBlur={(e) => patch({ name: e.target.value })} />
                <Input placeholder="Link" defaultValue={String(item.link ?? "")} onBlur={(e) => patch({ link: e.target.value })} />
                <Textarea placeholder="Description" defaultValue={String(item.description ?? "")} onBlur={(e) => patch({ description: e.target.value })} />
                <Textarea placeholder="Bullets, one per line" defaultValue={((item.bullets as string[]) ?? []).join("\n")} onBlur={(e) => patch({ bullets: e.target.value.split("\n").filter(Boolean) })} />
                <Input placeholder="Tech, comma separated" defaultValue={((item.tech as string[]) ?? []).join(", ")} onBlur={(e) => patch({ tech: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
            )}
          />
        )}
        {step === 6 && (
          <Repeatable
            items={(profile.certifications as Array<Record<string, unknown>>) ?? []}
            blank={{ name: "", issuer: "", date: "" }}
            onChange={(certifications) => update({ certifications })}
            render={(item, patch) => (
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Name" defaultValue={String(item.name ?? "")} onBlur={(e) => patch({ name: e.target.value })} />
                <Input placeholder="Issuer" defaultValue={String(item.issuer ?? "")} onBlur={(e) => patch({ issuer: e.target.value })} />
                <Input placeholder="Date" defaultValue={String(item.date ?? "")} onBlur={(e) => patch({ date: e.target.value })} />
              </div>
            )}
          />
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button
              disabled={finishing}
              onClick={async () => {
                setFinishing(true);
                try {
                  // Fields commit on blur, so flush whatever is still focused first.
                  (document.activeElement as HTMLElement | null)?.blur();
                  await new Promise((resolve) => setTimeout(resolve, 60));
                  const latest = (queryClient.getQueryData(["profile"]) as Profile) ?? profile;
                  await save.mutateAsync({ ...latest, onboardingStep: step });
                  toast.success("Profile saved");
                  if (redirectTo) window.location.href = redirectTo;
                } catch {
                  toast.error("Could not save your profile", {
                    description: "Check your connection and try again.",
                  });
                } finally {
                  setFinishing(false);
                }
              }}
            >
              {finishing ? "Saving…" : "Done"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function Repeatable({
  items,
  blank,
  onChange,
  render,
}: {
  items: Array<Record<string, unknown>>;
  blank: Record<string, unknown>;
  onChange: (items: Array<Record<string, unknown>>) => void;
  render: (item: Record<string, unknown>, patch: (value: Record<string, unknown>) => void, index: number) => React.ReactNode;
}) {
  return (
    <div className="grid gap-6">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-border p-4">
          {render(item, (value) => {
            const next = items.map((row, i) => (i === index ? { ...row, ...value } : row));
            onChange(next);
          }, index)}
          <button
            className="mt-3 text-xs text-muted-foreground hover:text-red-400"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, blank])}>
        Add another
      </Button>
    </div>
  );
}
