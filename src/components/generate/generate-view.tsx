"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResumePdfFrame } from "@/components/resume/resume-pdf-frame";
import { useResumePdf } from "@/components/resume/use-resume-pdf";
import {
  GENERATION_STEPS,
  type AtsBreakdown,
  type GenerationStep,
  type PipelineWarning,
  type ResumeContent,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type StepStatus = "idle" | "running" | "done" | "error";
type StepState = Record<GenerationStep, StepStatus>;

const INITIAL_STEPS: StepState = {
  analyze: "idle",
  match: "idle",
  rewrite: "idle",
  validate: "idle",
  compile: "idle",
  score: "idle",
};

type ResumePayload = {
  id: string;
  title: string;
  contentJson: ResumeContent;
  sourceContentJson?: ResumeContent | null;
  matchedKeywords?: { matched?: string[]; missing?: string[] } | null;
  template?: { slug: string; name: string } | null;
};

export function GenerateView({ resumeId, jobId }: { resumeId: string; jobId: string }) {
  const router = useRouter();
  const [steps, setSteps] = useState<StepState>(INITIAL_STEPS);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<PipelineWarning[]>([]);
  const [score, setScore] = useState<AtsBreakdown | null>(null);
  const [done, setDone] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const settled = useRef(false);

  const finish = (nextFailure?: string) => {
    if (settled.current) return;
    settled.current = true;
    if (nextFailure) {
      setFailure(nextFailure);
      setSteps((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next) as GenerationStep[]) {
          if (next[key] === "running") next[key] = "error";
        }
        return next;
      });
    } else {
      setDone(true);
    }
  };

  useEffect(() => {
    const source = new EventSource(`/api/generate/stream?jobId=${jobId}`);

    source.onmessage = (message) => {
      let event: { type: string; [key: string]: unknown };
      try {
        event = JSON.parse(message.data);
      } catch {
        return;
      }
      if (event.type === "step") {
        setSteps((prev) => ({
          ...prev,
          [event.step as GenerationStep]: event.status as StepStatus,
        }));
      }
      if (event.type === "provider") setProvider(event.id as string);
      if (event.type === "keywords") setKeywords(event.keywords as string[]);
      if (event.type === "warnings") setWarnings(event.warnings as PipelineWarning[]);
      if (event.type === "score") setScore(event.breakdown as AtsBreakdown);
      if (event.type === "error") {
        finish((event.message as string) || "Generation failed");
        source.close();
      }
      if (event.type === "done") {
        finish();
        source.close();
      }
    };

    source.onerror = () => {
      // The stream is best-effort; polling below is the source of truth.
      source.close();
    };

    // Durable fallback: resolves the run even if the stream never connects.
    const poll = setInterval(async () => {
      if (settled.current) return;
      try {
        const res = await fetch(`/api/generate/status?jobId=${jobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const job = (await res.json()) as { status: string; error?: string | null };
        if (job.status === "done") finish();
        if (job.status === "error") finish(job.error || "Generation failed");
      } catch {
        // transient — try again on the next tick
      }
    }, 2500);

    return () => {
      clearInterval(poll);
      source.close();
    };
  }, [jobId]);

  const { data: resume } = useQuery<ResumePayload>({
    queryKey: ["resume", resumeId],
    queryFn: async () => (await fetch(`/api/resumes/${resumeId}`, { cache: "no-store" })).json(),
    enabled: done,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 600,
  });

  const tailoredPdf = useResumePdf({
    content: resume?.contentJson ?? null,
    templateSlug: resume?.template?.slug,
    title: resume?.title,
    enabled: Boolean(resume?.contentJson),
  });

  const ring = score?.score ?? 0;

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden px-6 py-8 sm:px-8">
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <p className="eyebrow">Generation pipeline</p>
        <h1 className="mt-4 font-display text-4xl">Tailoring without inventing.</h1>

        {provider === "mock" ? (
          <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No language model is configured, so this run uses rule-based matching: your skills and bullets
            are reordered and lightly reworded around the job&apos;s keywords. Set an AI provider key for
            full rewriting.
          </div>
        ) : null}

        {failure ? (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-medium">Generation failed</p>
            <p className="mt-1 text-sm text-muted-foreground">{failure}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => router.back()}>
                Try again
              </Button>
              <Button size="sm" variant="secondary" onClick={() => router.push(`/editor/${resumeId}`)}>
                Edit this resume manually
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3">
          {GENERATION_STEPS.map((step) => {
            const status = steps[step.id];
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between rounded-2xl border border-border bg-card/80 px-4 py-3",
                  status === "running" && "border-accent/40",
                  status === "error" && "border-red-500/40",
                )}
              >
                <span>{step.label}</span>
                <span
                  className={cn(
                    "text-xs uppercase tracking-widest text-muted-foreground",
                    status === "error" && "text-red-600 dark:text-red-400",
                  )}
                >
                  {status === "idle" ? (failure ? "skipped" : "queued") : status}
                </span>
              </div>
            );
          })}
        </div>

        {keywords.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <motion.div key={keyword} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <Badge variant="accent">{keyword}</Badge>
              </motion.div>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            {warnings.slice(0, 6).map((warning) => (
              <div key={warning.message}>{warning.message}</div>
            ))}
          </div>
        )}

        {done && score && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="grid place-items-start rounded-3xl border border-border bg-card p-8">
              <div className="mx-auto">
                <div
                  className="grid h-40 w-40 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--accent) ${ring * 3.6}deg, var(--border) 0deg)`,
                  }}
                >
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-card font-display text-3xl">
                    {ring}
                  </div>
                </div>
              </div>
              <p className="mt-4 w-full text-center text-sm text-muted-foreground">
                Keyword match against this job description
              </p>
              <p className="mt-2 w-full text-center text-xs text-muted-foreground">
                Keywords {score.keywordCoverage}% · Must-have {score.mustHaveCoverage}% · Sections{" "}
                {score.sectionScore}%
              </p>
              <p className="mt-4 w-full text-center text-[11px] leading-relaxed text-muted-foreground">
                Our own keyword and structure analysis — not a score from Workday, Taleo, or any
                employer&apos;s ATS.
              </p>
            </div>

            <div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Before — your profile</div>
                  <BulletSnapshot content={resume?.sourceContentJson ?? null} />
                </div>
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">After — tailored resume</div>
                  <ResumePdfFrame
                    blob={tailoredPdf.blob}
                    rendering={tailoredPdf.rendering}
                    error={tailoredPdf.error}
                  />
                </div>
              </div>

              <BulletDiff
                before={resume?.sourceContentJson ?? null}
                after={resume?.contentJson ?? null}
                missing={resume?.matchedKeywords?.missing ?? []}
              />

              <Button className="mt-6" onClick={() => router.push(`/editor/${resumeId}`)}>
                Looks good, continue to edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function allBullets(content: ResumeContent | null) {
  if (!content) return [] as string[];
  return (content.experience ?? []).flatMap((job) => (job.bullets ?? []).filter(Boolean));
}

function BulletSnapshot({ content }: { content: ResumeContent | null }) {
  const bullets = allBullets(content).slice(0, 8);
  if (!bullets.length) {
    return (
      <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
        No original snapshot was stored for this resume.
      </div>
    );
  }
  return (
    <ul className="space-y-2 rounded-2xl border border-border p-4 text-sm">
      {bullets.map((bullet, index) => (
        <li key={index} className="text-muted-foreground">
          {bullet}
        </li>
      ))}
    </ul>
  );
}

/** Shows only the bullets the rewrite actually changed, with the original underneath. */
function BulletDiff({
  before,
  after,
  missing,
}: {
  before: ResumeContent | null;
  after: ResumeContent | null;
  missing: string[];
}) {
  const originals = allBullets(before);
  const rewritten = allBullets(after);
  const originalSet = new Set(originals);
  const changed = rewritten.filter((bullet) => !originalSet.has(bullet));

  return (
    <div className="mt-5 rounded-2xl border border-border p-4 text-sm">
      <div className="mb-2 text-muted-foreground">
        {changed.length ? `${changed.length} bullet${changed.length === 1 ? "" : "s"} rewritten` : "No bullets were rewritten"}
      </div>
      {changed.length ? (
        <ul className="space-y-2">
          {changed.slice(0, 6).map((bullet, index) => (
            <li key={index} className="rounded-lg bg-accent/10 px-3 py-2">
              {bullet}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          Your existing wording already matched this job description, so it was left alone.
        </p>
      )}
      {missing.length ? (
        <p className="mt-3 text-amber-700 dark:text-amber-300">
          Wanted by this job but not in your profile, so not claimed: {missing.slice(0, 8).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
