"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { extractPdfTextInBrowser } from "@/lib/pdf/extract-client";
import { isPdfFile, isTextFile, MAX_UPLOAD_BYTES, normalizeExtractedText } from "@/lib/pdf/text";
import { SAMPLE_ATS_RESUME_TEXT } from "@/lib/sample-ats-resume";
import { SAMPLE_RAZORPAY_JD } from "@/lib/sample-jd";
import { cn } from "@/lib/utils";

type Result = {
  score: number;
  breakdown: {
    keywordCoverage: number;
    mustHaveCoverage: number;
    sectionScore: number;
    formattingScore: number;
    quantificationScore?: number;
    matched: string[];
    missing: string[];
    formattingIssues: string[];
    recommendations?: string[];
  };
  analysis: {
    mustHaveKeywords: string[];
    hardSkills: string[];
    tools: string[];
    seniorityLevel: string;
    niceToHaveKeywords?: string[];
  };
  meta?: { analysisSource?: string; method?: string };
};

export function AtsCheckerForm() {
  const [jd, setJd] = useState(SAMPLE_RAZORPAY_JD);
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<"resume" | "jd" | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="eyebrow">Free ATS match checker</p>
        <h1 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
          See how your resume aligns with a job description
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Works with <strong className="font-medium text-foreground">any resume you already have</strong> — upload a PDF
          or paste text from Word / Google Docs. No ATSWeave account required.
        </p>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2">
            <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Job description
              <span className="flex gap-3 normal-case tracking-normal">
                <button type="button" className="underline-offset-4 hover:underline" onClick={() => setJd("")}>
                  clear sample
                </button>
              </span>
            </span>
            <FileDrop
              label="Upload JD PDF"
              fileName={jdFileName}
              busy={extracting === "jd"}
              onClear={() => setJdFileName(null)}
              onFile={(file) =>
                ingestFile(file, "jd", {
                  setExtracting,
                  setText: setJd,
                  setFileName: setJdFileName,
                })
              }
            />
            <Textarea className="min-h-44" value={jd} onChange={(e) => setJd(e.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Resume
              <button
                type="button"
                className="normal-case tracking-normal underline-offset-4 hover:underline"
                onClick={() => {
                  setResumeText(SAMPLE_ATS_RESUME_TEXT);
                  setResumeFileName(null);
                  toast.message("Loaded a sample resume — replace it with yours to score a real file.");
                }}
              >
                load sample
              </button>
            </span>
            <FileDrop
              label="Upload resume PDF"
              fileName={resumeFileName}
              busy={extracting === "resume"}
              onClear={() => setResumeFileName(null)}
              onFile={(file) =>
                ingestFile(file, "resume", {
                  setExtracting,
                  setText: setResumeText,
                  setFileName: setResumeFileName,
                })
              }
            />
            <Textarea
              className="min-h-56"
              placeholder="Upload a PDF above, or paste resume text here."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                setResumeFileName(null);
              }}
            />
          </label>
          <Button
            size="lg"
            disabled={loading || extracting !== null || jd.trim().length < 40 || resumeText.trim().length < 80}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("/api/ats/check", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ jd, resumeText }),
                });
                const data = await res.json();
                if (!res.ok) {
                  toast.error(data.error || "Check failed");
                  return;
                }
                setResult(data);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Analyzing…" : "Calculate match score"}
          </Button>
          {resumeText.trim().length > 0 && resumeText.trim().length < 80 ? (
            <p className="text-xs text-muted-foreground">Paste or upload a bit more of your resume to get a score.</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            This is an alignment estimate for applicants — not a score from Workday, Taleo, or Greenhouse.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        {!result ? (
          <div className="flex h-full min-h-[360px] flex-col justify-center gap-5">
            <div>
              <p className="eyebrow">How to use</p>
              <h2 className="mt-4 font-display text-xl text-foreground">Score in three steps</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-display text-lg text-accent">1</span>
                <span>Paste the full job description on the left, or upload a JD PDF (a sample is pre-filled).</span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-lg text-accent">2</span>
                <span>
                  Upload your resume PDF (or paste text). Building a resume on ATSWeave first is optional.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-lg text-accent">3</span>
                <span>
                  Click <strong className="text-foreground">Calculate match score</strong> — results (keywords, gaps,
                  formatting) show here.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Keyword &amp; structure match
                </p>
                <div className="mt-1 font-display text-6xl tracking-tight text-foreground">{result.score}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Seniority signal: {result.analysis.seniorityLevel}
                  {result.meta?.analysisSource
                    ? ` · Keywords read by ${result.meta.analysisSource === "ai" ? "a language model" : "rule-based parsing"}`
                    : ""}
                </p>
              </div>
              <div
                className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${result.score * 3.6}deg, var(--border) 0deg)`,
                }}
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-card text-sm font-medium">/100</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Keywords" value={`${result.breakdown.keywordCoverage}%`} />
              <Stat label="Must-have" value={`${result.breakdown.mustHaveCoverage}%`} />
              <Stat label="Sections" value={`${result.breakdown.sectionScore}%`} />
              <Stat label="Formatting" value={`${result.breakdown.formattingScore}%`} />
              {typeof result.breakdown.quantificationScore === "number" && (
                <Stat label="Quantified bullets" value={`${result.breakdown.quantificationScore}%`} />
              )}
            </div>

            {result.breakdown.recommendations && result.breakdown.recommendations.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">What to fix</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {result.breakdown.recommendations.map((tip) => (
                    <li key={tip} className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.breakdown.formattingIssues.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Formatting risks</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {result.breakdown.formattingIssues.map((issue) => (
                    <li key={issue}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Matched</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.breakdown.matched.length === 0 && (
                  <span className="text-sm text-muted-foreground">None yet</span>
                )}
                {result.breakdown.matched.map((k) => (
                  <Badge key={k} variant="accent">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Missing from resume</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.breakdown.missing.slice(0, 20).map((k) => (
                  <Badge key={k} variant="outline">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/50 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function FileDrop({
  label,
  fileName,
  busy,
  onFile,
  onClear,
}: {
  label: string;
  fileName: string | null;
  busy: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-3 py-3 text-sm transition",
        dragOver && "border-accent bg-accent/5",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,text/plain,.txt"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left text-muted-foreground"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <FileUp className="h-4 w-4 shrink-0" />}
        <span className="truncate">{busy ? "Reading PDF…" : fileName ? fileName : `${label} or drop here`}</span>
      </button>
      {fileName && !busy ? (
        <button
          type="button"
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClear}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

async function ingestFile(
  file: File,
  target: "resume" | "jd",
  setters: {
    setExtracting: (value: "resume" | "jd" | null) => void;
    setText: (value: string) => void;
    setFileName: (value: string | null) => void;
  },
) {
  if (file.size > MAX_UPLOAD_BYTES) {
    toast.error("File is too large (max 8 MB)");
    return;
  }

  setters.setExtracting(target);
  try {
    let text = "";
    if (isTextFile(file)) {
      text = normalizeExtractedText(await file.text());
    } else if (isPdfFile(file)) {
      try {
        text = await extractPdfTextInBrowser(file);
      } catch {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/ats/extract", { method: "POST", body: form });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || !data.text) throw new Error(data.error || "Could not read that PDF");
        text = data.text;
      }
    } else {
      toast.error("Upload a PDF or a .txt file");
      return;
    }

    const min = target === "resume" ? 80 : 40;
    if (text.trim().length < min) {
      toast.error("No readable text in that file. If it is a scanned PDF, paste the text instead.");
      return;
    }

    setters.setText(text);
    setters.setFileName(file.name);
    toast.success(`Extracted text from ${file.name}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not read that file");
  } finally {
    setters.setExtracting(null);
  }
}
