"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createResumeClient } from "@/lib/create-resume-client";

function NewResumeRedirect() {
  const router = useRouter();
  const search = useSearchParams();
  const templateId = search.get("templateId");
  const mode = search.get("mode") || "manual";
  const source = search.get("source") || "example";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      router.replace("/gallery");
      return;
    }

    let cancelled = false;
    createResumeClient(templateId, mode, source)
      .then(({ id }) => {
        if (cancelled) return;
        router.replace(`/editor/${id}`);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Could not open that template";
        setError(message);
        toast.error(message);
      });

    return () => {
      cancelled = true;
    };
  }, [templateId, mode, source, router]);

  if (error) {
    return (
      <div className="grid h-[calc(100vh-64px)] place-items-center px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button className="mt-4 text-sm text-accent underline" onClick={() => router.replace("/gallery")}>
            Back to gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-64px)] place-items-center text-sm text-muted-foreground">
        Opening {source === "blank" ? "a blank" : source === "profile" ? "your" : "the example"} resume…
    </div>
  );
}

export default function NewEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-[calc(100vh-64px)] place-items-center text-sm text-muted-foreground">
          Opening editor…
        </div>
      }
    >
      <NewResumeRedirect />
    </Suspense>
  );
}
