"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";

export function MarketingHeader({
  googleConfigured = false,
  demoConfigured = false,
}: {
  googleConfigured?: boolean;
  demoConfigured?: boolean;
}) {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-accent text-[11px] font-bold text-accent-foreground shadow-[0_8px_16px_-8px_rgba(196,92,38,0.85)]">
            R
          </span>
          ATSWeave
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-4">
          <Link href="/templates" className="transition hover:text-foreground">
            Templates
          </Link>
          <Link href="/ats-checker" className="transition hover:text-foreground">
            ATS Checker
          </Link>
          <ThemeToggle />
          {status === "loading" ? (
            <Button size="sm" disabled className="invisible">
              Sign in
            </Button>
          ) : session?.user ? (
            <Button size="sm" asChild>
              <Link href="/gallery">Gallery</Link>
            </Button>
          ) : (
            <Suspense fallback={<Button size="sm">Sign in</Button>}>
              <SignInButton
                size="sm"
                googleConfigured={googleConfigured}
                demoConfigured={demoConfigured}
                callbackUrl="/gallery"
              >
                Sign in
              </SignInButton>
            </Suspense>
          )}
        </nav>
      </div>
    </header>
  );
}
