"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canSignIn, startSignIn } from "@/lib/auth-client";

export function TemplateUseActions({
  templateId,
  templateName,
  googleConfigured,
  demoConfigured,
}: {
  templateId: string;
  templateName?: string;
  googleConfigured: boolean;
  demoConfigured: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const editUrl = `/editor/new?templateId=${encodeURIComponent(templateId)}&mode=manual&source=example`;
  const matchUrl = `/match/${templateId}`;
  const authReady = canSignIn(googleConfigured, demoConfigured);
  const label = templateName ? `the ${templateName} layout` : "this layout";

  if (status === "loading") {
    return <div className="h-24 animate-pulse rounded-xl bg-muted" />;
  }

  if (session?.user) {
    return (
      <div className="grid gap-3">
        <Button size="lg" className="h-auto min-h-12 w-full justify-start gap-3 py-3" onClick={() => router.push(editUrl)}>
          <PenLine className="h-5 w-5 shrink-0" />
          <span className="text-left">
            <span className="block font-medium">Use this template</span>
            <span className="block text-xs font-normal opacity-80">
              Opens {label} with the same example you see on the left
            </span>
          </span>
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-auto min-h-12 w-full justify-start gap-3 py-3"
          onClick={() => router.push(matchUrl)}
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          <span className="text-left">
            <span className="block font-medium">Build with AI</span>
            <span className="block text-xs font-normal opacity-80">Uses your career profile + a job description</span>
          </span>
        </Button>
      </div>
    );
  }

  const continueWith = (dest: string) =>
    startSignIn({ googleConfigured, demoConfigured, callbackUrl: dest });

  return (
    <div className="grid gap-3">
      <Button
        size="lg"
        className="h-auto min-h-12 w-full justify-start gap-3 py-3"
        disabled={!authReady}
        onClick={() => continueWith(editUrl)}
      >
        <PenLine className="h-5 w-5 shrink-0" />
        <span className="text-left">
          <span className="block font-medium">Sign in to use this template</span>
          <span className="block text-xs font-normal opacity-80">
            You&apos;ll edit {label} — the same page shown here
          </span>
        </span>
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="h-auto min-h-12 w-full justify-start gap-3 py-3"
        disabled={!authReady}
        onClick={() => continueWith(matchUrl)}
      >
        <Sparkles className="h-5 w-5 shrink-0" />
        <span className="text-left">
          <span className="block font-medium">Sign in for AI match</span>
          <span className="block text-xs font-normal opacity-80">We&apos;ll use your profile + a JD</span>
        </span>
      </Button>
    </div>
  );
}
