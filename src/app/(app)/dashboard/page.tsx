"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PdfCanvas } from "@/components/resume/pdf-canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Stored modes read like database values; these are what a person calls them. */
const MODE_LABELS: Record<string, string> = {
  manual: "Written by you",
  ats_matched: "Matched to a job",
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("/api/resumes", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not load your resumes");
      return Array.isArray(body) ? body : [];
    },
  });
  const resumes = Array.isArray(data) ? data : [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["resumes"] });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not delete this resume");
      }
    },
    onMutate: (id: string) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      refresh();
      toast.success("Resume deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateOf: id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not duplicate this resume");
      return body as { id: string };
    },
    onMutate: (id: string) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: (copy) => {
      refresh();
      router.push(`/editor/${copy.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Library</p>
          <h1 className="mt-4 font-display text-4xl">Saved resumes</h1>
        </div>
        <Button asChild>
          <Link href="/gallery">New from template</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4">
        {isLoading && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Loading your resumes…
          </div>
        )}
        {isError && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-10 text-center text-sm">
            Could not load your resumes. Refresh the page or sign in again.
          </div>
        )}
        {!isLoading && !isError && resumes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Nothing yet. Pick a template and either edit or match to a job.
          </div>
        )}
        {resumes.map(
          (resume: {
            id: string;
            title: string;
            mode: string;
            atsScore?: number | null;
            updatedAt: string;
            template?: { id?: string; name: string; slug?: string } | null;
          }) => (
          <div
            key={resume.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card/80 p-5 shadow-[0_16px_32px_-24px_rgba(28,20,16,0.4)] transition hover:border-accent/40"
          >
            <Link
              href={`/editor/${resume.id}`}
              className="flex min-w-0 flex-1 basis-60 items-center gap-4"
            >
              <div className="w-[72px] shrink-0 overflow-hidden rounded-sm border border-border bg-white">
                <PdfCanvas
                  key={resume.id}
                  source={{ kind: "url", url: `/api/resumes/${resume.id}/pdf` }}
                />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{resume.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {resume.template?.name ? `${resume.template.name} · ` : ""}
                  {new Date(resume.updatedAt).toLocaleString()}
                </div>
              </div>
            </Link>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge variant="outline">{MODE_LABELS[resume.mode] ?? resume.mode}</Badge>
              {typeof resume.atsScore === "number" && <Badge variant="accent">{resume.atsScore} ATS</Badge>}
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingId === resume.id}
                onClick={() => duplicate.mutate(resume.id)}
              >
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingId === resume.id}
                onClick={() => {
                  if (!window.confirm(`Delete “${resume.title}”? This cannot be undone.`)) return;
                  remove.mutate(resume.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
