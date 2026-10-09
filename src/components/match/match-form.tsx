"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";

/** Matches the server's minimum for a usable job description. */
const MIN_JD_LENGTH = 40;

type ProfileResponse = {
  ready?: boolean;
  content?: { fullName?: string; email?: string };
};

export function MatchForm({ templateId }: { templateId: string }) {
  const router = useRouter();

  const { data: profile } = useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/profile", { cache: "no-store" })).json(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const template = templates.find(
    (t: { id: string; slug: string }) => t.id === templateId || t.slug === templateId,
  ) as { id: string; slug: string; name: string } | undefined;

  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [starting, setStarting] = useState(false);

  // Mirrors the server's own readiness rule so the button never enables into a 400.
  const ready = Boolean(profile?.ready);

  const extract = useCallback(async (text: string, options?: { quiet?: boolean }) => {
    if (text.trim().length < MIN_JD_LENGTH) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/jd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (!options?.quiet) toast.error(data.error || "Could not read that job description");
        return;
      }
      const chips = Array.from(
        new Set([
          ...(data.mustHaveKeywords ?? []),
          ...(data.hardSkills ?? []),
          ...(data.tools ?? []),
        ]),
      ) as string[];
      setKeywords(chips);
      if (!chips.length && !options?.quiet) {
        toast.message("No clear keywords found — try a fuller job description.");
      }
    } catch {
      if (!options?.quiet) toast.error("Could not reach the keyword service");
    } finally {
      setExtracting(false);
    }
  }, []);

  // Keywords are promised "after you paste", so read them as the text settles
  // rather than waiting for the field to lose focus.
  useEffect(() => {
    if (jd.trim().length < MIN_JD_LENGTH) {
      setKeywords([]);
      return;
    }
    const timer = setTimeout(() => extract(jd, { quiet: true }), 600);
    return () => clearTimeout(timer);
  }, [jd, extract]);

  const importUrl = async () => {
    if (!url.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/jd/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.text) {
        toast.error(data.error || "Could not import. Paste the job description instead.");
        return;
      }
      setJd(data.text);
      await extract(data.text);
    } finally {
      setImporting(false);
    }
  };

  const generate = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?.id || templateId,
          jd,
          confirmedKeywords: keywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PROFILE_REQUIRED") {
          toast.error(data.error, { description: "Opening your profile…" });
          router.push(`/profile?next=/match/${templateId}`);
          return;
        }
        toast.error(data.error || "Could not start generation");
        return;
      }
      router.push(`/generate/${data.resumeId}?jobId=${data.jobId}`);
    } catch {
      toast.error("Could not start generation");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-8">
      <p className="eyebrow">AI path</p>
      <h1 className="mt-4 font-display text-4xl">
        Build {template?.name ? template.name : "this template"} with your profile
      </h1>

      {template?.slug ? (
        <div className="mt-6 w-40">
          <TemplateThumbnail slug={template.slug} name={template.name} />
        </div>
      ) : null}

      <p className="mt-4 text-muted-foreground">
        Only facts from your career profile and the job description below are used. Nothing is invented,
        and skills you don&apos;t have are reported rather than claimed.
      </p>

      {!ready && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          Add your name, email, and at least one role or degree first — we collect it once, then never ask
          again.
          <Button
            className="ml-3"
            size="sm"
            onClick={() => router.push(`/profile?next=/match/${templateId}`)}
          >
            Complete profile
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-3">
        <div className="flex gap-2">
          <input
            className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
            placeholder="Import from URL (many job boards block this — pasting is more reliable)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button variant="secondary" onClick={importUrl} disabled={importing || !url.trim()}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </div>

        <Textarea
          className="min-h-64"
          placeholder="Paste the full job description here."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />

        <div className="text-sm text-muted-foreground">
          {extracting
            ? "Extracting keywords…"
            : keywords.length
              ? "Remove any keyword you don't want targeted — the rest drive the rewrite."
              : "Paste a job description above and its keywords appear here."}
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => setKeywords((list) => list.filter((k) => k !== keyword))}
            >
              <Badge variant="accent">{keyword} ×</Badge>
            </button>
          ))}
        </div>

        <Button
          disabled={!ready || jd.trim().length < MIN_JD_LENGTH || starting}
          onClick={generate}
        >
          {starting ? "Starting…" : "Generate ATS-matched resume"}
        </Button>
        {jd.trim().length > 0 && jd.trim().length < MIN_JD_LENGTH ? (
          <p className="text-xs text-muted-foreground">
            Paste a bit more of the job description (at least 40 characters).
          </p>
        ) : null}
      </div>
    </div>
  );
}
