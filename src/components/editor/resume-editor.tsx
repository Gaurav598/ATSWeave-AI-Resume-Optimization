"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";

import { ResumeEditorForm } from "@/components/editor/resume-form";
import { ResumePdfFrame } from "@/components/resume/resume-pdf-frame";
import { useResumePdf } from "@/components/resume/use-resume-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exampleResume, isExampleContent } from "@/lib/example-content";
import { isEmptyResume } from "@/lib/resume-doc/document";
import { blankResume } from "@/lib/sample-resume";
import type { ResumeContent } from "@/lib/types";
import { cn } from "@/lib/utils";

type ResumeVersion = { id: string; note?: string | null; createdAt: string };

type ResumePayload = {
  id: string;
  title: string;
  latexSource: string;
  contentJson: ResumeContent;
  templateId?: string;
  template?: {
    id: string;
    slug: string;
    name: string;
    category: string;
  } | null;
  versions?: ResumeVersion[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 700;

export function ResumeEditor({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"form" | "tex">("form");
  const [draft, setDraft] = useState<ResumeContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [narrow, setNarrow] = useState(false);
  // Bumped whenever the whole document is swapped out, to remount the form so
  // its field state re-initialises from the new content.
  const [formKey, setFormKey] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContent = useRef<ResumeContent | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const {
    data: resume,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => {
      const res = await fetch(`/api/resumes/${resumeId}`, { cache: "no-store" });
      const data = (await res.json()) as ResumePayload & { error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Resume not found");
      return data;
    },
    enabled: Boolean(resumeId) && resumeId !== "new",
    refetchOnWindowFocus: false,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      const data = await res.json();
      return Array.isArray(data)
        ? (data as { id: string; slug: string; name: string }[])
        : [];
    },
  });

  // Seed the draft once per resume. Later swaps (restore, example content,
  // profile import) set the draft directly; re-running here would overwrite
  // them with the copy that was fetched on load.
  useEffect(() => {
    if (!resume?.id) return;
    setDraft(resume.contentJson);
    setSaveState("idle");
  }, [resume?.id]);

  const save = useMutation({
    mutationFn: async (payload: {
      contentJson?: ResumeContent;
      title?: string;
      note?: string;
      templateId?: string;
    }) => {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not save");
      }
      return (await res.json()) as ResumePayload;
    },
    onMutate: () => setSaveState("saving"),
    onSuccess: (updated, payload) => {
      setSaveState("saved");
      queryClient.setQueryData(["resume", resumeId], (old: ResumePayload | undefined) =>
        old ? { ...old, ...updated, template: updated.template ?? old.template } : old,
      );
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      if (payload.templateId && updated.template?.name) {
        toast.success(`Layout switched to ${updated.template.name}`);
      }
    },
    onError: (err: Error) => {
      setSaveState("error");
      toast.error("Changes not saved", { description: err.message });
    },
  });

  const scheduleSave = useCallback(
    (content: ResumeContent) => {
      pendingContent.current = content;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const next = pendingContent.current;
        if (next) save.mutate({ contentJson: next, note: "autosave" });
      }, AUTOSAVE_DELAY_MS);
    },
    [save],
  );

  // Flush pending edits if the tab is closed mid-typing.
  useEffect(() => {
    const flush = () => {
      if (!timer.current || !pendingContent.current) return;
      clearTimeout(timer.current);
      timer.current = null;
      void fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentJson: pendingContent.current, note: "autosave" }),
        keepalive: true,
      });
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [resumeId]);

  const templateSlug = resume?.template?.slug;
  const templateName = resume?.template?.name;

  const pdf = useResumePdf({
    content: draft,
    templateSlug,
    title: resume?.title,
  });

  const applyContent = (next: ResumeContent) => {
    setDraft(next);
    scheduleSave(next);
  };

  /** Swap the whole document, e.g. example content or a profile import. */
  const replaceContent = (next: ResumeContent) => {
    applyContent(next);
    setFormKey((n) => n + 1);
  };

  const download = () => {
    if (!pdf.blob) return;
    const url = URL.createObjectURL(pdf.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(resume?.title || "resume").replace(/[^\w\- ]+/g, "").trim() || "resume"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const switchTemplate = (templateId: string) => {
    if (!templateId || templateId === resume?.templateId) return;
    save.mutate({ templateId });
  };

  const restore = async (versionId: string) => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreId: versionId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not restore this version");
      }
      const updated = (await res.json()) as ResumePayload;
      queryClient.setQueryData(["resume", resumeId], (old: ResumePayload | undefined) =>
        old ? { ...old, ...updated, template: updated.template ?? old.template } : old,
      );
      setDraft(updated.contentJson);
      setFormKey((n) => n + 1);
      toast.success("Version restored");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (isLoading || !resume || !draft) {
    return (
      <div className="grid min-h-[calc(100dvh-64px)] place-items-center px-4 text-sm text-muted-foreground">
        {isError ? (error as Error)?.message || "Could not open this resume" : "Opening editor…"}
      </div>
    );
  }

  const versions = resume.versions ?? [];
  const empty = isEmptyResume(draft);

  const previewPane = (
    <div className="h-full min-h-[280px] overflow-auto bg-desk">
      <div className="mx-auto w-full max-w-[620px] px-3 py-4 sm:px-4">
        <ResumePdfFrame
          blob={pdf.blob}
          rendering={pdf.rendering}
          error={pdf.error}
          empty={empty}
          emptyHint="Fill the form on the right — this is the exact PDF you'll download."
          pages={3}
        />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          This is the actual PDF — what you see here is what downloads.
        </p>
      </div>
    </div>
  );

  const editorPane = (
    <div className="h-full min-h-[320px] overflow-auto border-border bg-card md:border-l">
      {view === "tex" ? (
        <div className="space-y-3 p-5">
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            LaTeX export of this resume, generated from your content. Useful if you want to keep
            editing in Overleaf — it is not what the PDF above is rendered from.
          </div>
          <Button variant="secondary" size="sm" asChild>
            <a href={`/api/resumes/${resume.id}/tex`}>Download .tex</a>
          </Button>
          <pre className="max-h-[70dvh] overflow-auto rounded-xl border border-border bg-muted/30 p-3 text-[11px] leading-relaxed">
            {resume.latexSource}
          </pre>
        </div>
      ) : (
        <>
          {isExampleContent(draft) ? (
            <div className="border-b border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
              You&apos;re editing the same example shown in the gallery. Use{" "}
              <span className="font-medium text-foreground">Content → Fill from my career profile</span>{" "}
              or type over it before you apply.
            </div>
          ) : null}
          <ResumeEditorForm
            key={`${resume.id}-${formKey}`}
            content={draft}
            templateSlug={templateSlug}
            templateName={templateName}
            onChange={applyContent}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            key={resume.id}
            className="h-9 max-w-[160px] border-transparent bg-transparent px-2 font-medium shadow-none focus-visible:border-border focus-visible:bg-card sm:max-w-[220px]"
            defaultValue={resume.title}
            onBlur={(e) => {
              const title = e.target.value.trim();
              if (title && title !== resume.title) save.mutate({ title });
            }}
          />
          {templateName ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden truncate rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground transition hover:border-accent/40 hover:text-foreground sm:inline"
                >
                  {templateName}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 w-64 overflow-auto">
                <DropdownMenuLabel>Switch layout — your content stays</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    disabled={template.id === resume.templateId || template.slug === templateSlug}
                    onClick={() => switchTemplate(template.id)}
                  >
                    {template.name}
                    {template.slug === templateSlug ? " · current" : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <SaveIndicator state={saveState} />
        </div>

        <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "form" | "tex")}>
            <TabsList>
              <TabsTrigger value="form">Edit</TabsTrigger>
              <TabsTrigger value="tex">LaTeX</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Content
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {isExampleContent(draft) ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  This is the gallery example. Replace it before you apply.
                </p>
              ) : null}
              <DropdownMenuItem
                onClick={async () => {
                  const res = await fetch("/api/profile", { cache: "no-store" });
                  if (!res.ok) {
                    toast.error("Could not read your profile");
                    return;
                  }
                  const profile = (await res.json()) as { content?: ResumeContent; ready?: boolean };
                  if (!profile.ready || !profile.content) {
                    toast.message("Your career profile is empty", {
                      description: "Add your details in Profile first.",
                    });
                    return;
                  }
                  replaceContent(profile.content);
                  toast.success("Filled from your career profile");
                }}
              >
                Fill from my career profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  replaceContent(exampleResume());
                  toast.message("Example content loaded", {
                    description: "This is sample data — replace it with your own.",
                  });
                }}
              >
                Reload gallery example
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  replaceContent(blankResume());
                  toast.message("Cleared to a blank form");
                }}
              >
                Start from a blank form
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                History
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 w-72 overflow-auto">
              <DropdownMenuLabel>Restore a previous version</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {versions.length === 0 ? (
                <DropdownMenuItem disabled>No versions yet</DropdownMenuItem>
              ) : (
                versions.map((version) => (
                  <DropdownMenuItem key={version.id} onClick={() => restore(version.id)}>
                    <span className="truncate">
                      {version.note || "edit"} · {new Date(version.createdAt).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={download} disabled={!pdf.blob || pdf.rendering}>
            {pdf.rendering && !pdf.blob ? "Preparing…" : "Download PDF"}
          </Button>

          <Button size="sm" variant="ghost" onClick={() => router.push("/gallery")}>
            Gallery
          </Button>
        </div>
      </div>

      <Group orientation={narrow ? "vertical" : "horizontal"} className="min-h-0 flex-1">
        <Panel defaultSize={narrow ? 42 : 46} minSize={narrow ? 28 : 30}>
          {previewPane}
        </Panel>
        <Separator
          className={cn(
            "bg-border transition-colors hover:bg-accent",
            narrow ? "h-1.5 w-full" : "w-1.5",
          )}
        />
        <Panel defaultSize={narrow ? 58 : 54} minSize={narrow ? 32 : 30}>
          {editorPane}
        </Panel>
      </Group>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const label =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Not saved";
  return (
    <span
      className={cn(
        "hidden text-xs sm:inline",
        state === "error" ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
