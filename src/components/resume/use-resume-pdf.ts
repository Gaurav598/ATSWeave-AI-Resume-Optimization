"use client";

import { useEffect, useRef, useState } from "react";
import type { ResumeContent } from "@/lib/types";

export type ResumePdfState = {
  /** Most recent successful render; kept while a new one is generated. */
  blob: Blob | null;
  rendering: boolean;
  error: string | null;
};

/**
 * Renders the resume document to a PDF blob in the browser.
 *
 * The editor previews this blob and downloads this same blob, which is what
 * keeps "what I see" and "what I send to a recruiter" identical.
 */
export function useResumePdf(options: {
  content: ResumeContent | null;
  templateSlug?: string | null;
  title?: string;
  debounceMs?: number;
  enabled?: boolean;
}): ResumePdfState {
  const { content, templateSlug, title, debounceMs = 450, enabled = true } = options;
  const [state, setState] = useState<ResumePdfState>({
    blob: null,
    rendering: false,
    error: null,
  });

  const runToken = useRef(0);
  const payload = content ? JSON.stringify({ content, templateSlug, title }) : null;

  useEffect(() => {
    if (!enabled || !payload) return;
    const token = ++runToken.current;
    setState((prev) => ({ ...prev, rendering: true }));

    const timer = setTimeout(async () => {
      try {
        const [{ pdf }, { ResumeDocument }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/resume-doc/document"),
        ]);
        const parsed = JSON.parse(payload) as {
          content: ResumeContent;
          templateSlug?: string | null;
          title?: string;
        };
        const blob = await pdf(
          ResumeDocument({
            content: parsed.content,
            templateSlug: parsed.templateSlug,
            title: parsed.title,
          }),
        ).toBlob();
        if (token !== runToken.current) return;
        setState({ blob, rendering: false, error: null });
      } catch (error) {
        if (token !== runToken.current) return;
        setState((prev) => ({
          ...prev,
          rendering: false,
          error: error instanceof Error ? error.message : "Could not render this resume",
        }));
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [payload, enabled, debounceMs]);

  return state;
}
