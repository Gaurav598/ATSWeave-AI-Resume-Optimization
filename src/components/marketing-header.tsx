"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export function MarketingHeader({
  googleConfigured = false,
  demoConfigured = false,
}: {
  googleConfigured?: boolean;
  demoConfigured?: boolean;
}) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <BrandMark />
        <nav className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-4">
          <Link href="/templates" className="hidden rounded-full px-2 py-1.5 transition hover:bg-muted hover:text-foreground sm:inline">
            Templates
          </Link>
          <Link href="/ats-checker" className="hidden rounded-full px-2 py-1.5 transition hover:bg-muted hover:text-foreground sm:inline">
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
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-foreground sm:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </nav>
      </div>
      {menuOpen && <nav aria-label="Mobile navigation" className="grid gap-1 border-t border-border bg-card px-5 py-3 sm:hidden">
        <Link href="/templates" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">Templates</Link>
        <Link href="/ats-checker" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">ATS checker</Link>
      </nav>}
    </header>
  );
}
