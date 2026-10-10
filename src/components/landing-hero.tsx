"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, Gauge, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingResumeSlider } from "@/components/gallery/landing-resume-slider";
import { ThemeToggle } from "@/components/theme-toggle";
import { canSignIn, continueUrlFromSearch, startSignIn } from "@/lib/auth-client";

export function LandingHero({
  googleConfigured,
  demoConfigured,
}: {
  googleConfigured: boolean;
  demoConfigured: boolean;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const from = continueUrlFromSearch(search);
  const needsContinue = Boolean(search.get("from"));
  const authReady = canSignIn(googleConfigured, demoConfigured);
  const [mounted, setMounted] = useState(false);
  const signingIn = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && search.get("from")) {
      router.replace(from);
    }
  }, [status, search, from, router]);

  useEffect(() => {
    if (!mounted || status === "loading" || status === "authenticated") return;
    if (!needsContinue || !authReady || signingIn.current) return;
    signingIn.current = true;
    void startSignIn({ googleConfigured, demoConfigured, callbackUrl: from });
  }, [mounted, status, needsContinue, authReady, from, googleConfigured, demoConfigured]);

  const start = () => startSignIn({ googleConfigured, demoConfigured, callbackUrl: from });
  const authed = mounted && status === "authenticated" && Boolean(session?.user);
  const authPending = !mounted || status === "loading";

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="surface-mesh pointer-events-none absolute inset-x-0 top-0 h-[640px]" />

      <header className="relative z-20 border-b border-border/40 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight" suppressHydrationWarning>
            <img src="/logo.png" alt="ATSWeave Logo" className="h-8 w-8 rounded-xl object-contain shadow-[0_8px_16px_-8px_rgba(196,92,38,0.85)]" />
            ATSWeave
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground sm:gap-2">
            <Link
              href="/templates"
              className="hidden rounded-full px-3 py-1.5 font-medium transition hover:bg-muted hover:text-foreground sm:inline"
            >
              Templates
            </Link>
            <Link
              href="/ats-checker"
              className="rounded-full px-3 py-1.5 font-medium transition hover:bg-muted hover:text-foreground"
            >
              ATS Checker
            </Link>
            <ThemeToggle />
            {authPending ? (
              <Button size="sm" className="ml-1 invisible" disabled>
                Sign in
              </Button>
            ) : authed ? (
              <Button size="sm" className="ml-1" asChild>
                <Link href="/gallery">Open gallery</Link>
              </Button>
            ) : authReady ? (
              <Button size="sm" className="ml-1" onClick={start}>
                Continue with demo
              </Button>
            ) : (
              <Button size="sm" className="ml-1" variant="outline" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {needsContinue && !authPending && !authed && (
          <div className="mx-auto w-full max-w-6xl px-6 pt-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm">
              <span>Signing you in so you can edit that resume.</span>
              {authReady ? (
                <Button size="sm" onClick={start}>
                  Continue with demo <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <span className="text-muted-foreground">Auth is not configured on this server.</span>
              )}
            </div>
          </div>
        )}

        <section className="mx-auto w-full max-w-6xl px-6 pb-10 pt-12 text-center sm:px-8 lg:pt-16">
          <p className="eyebrow mx-auto">LaTeX resume studio</p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.02] text-foreground sm:text-6xl lg:text-7xl">
            Resumes that look like the file you send
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Swipe real layouts, fill them once, tailor to a job. What you see is the PDF —
            not a cartoon mockup.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {authPending ? (
              <Button size="lg" disabled className="invisible">
                Continue with demo <ArrowRight className="h-4 w-4" />
              </Button>
            ) : authed ? (
              <Button size="lg" asChild>
                <Link href="/gallery">
                  Open template gallery <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : authReady ? (
              <Button size="lg" onClick={start}>
                Continue with demo <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/templates">
                  Browse templates <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">Browse templates</Link>
            </Button>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-black/20 py-10 sm:py-14">
          <div className="desk-wood pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />
          <div className="relative mx-auto w-full max-w-7xl px-2 sm:px-6">
            <LandingResumeSlider />
          </div>
        </section>

        <section id="how" className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">From blank page to tailored PDF</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Fill your profile once",
                  body: "Contact, skills, roles, education, and projects live in one place. Use them for AI matching, or import them into any template in one click.",
                },
                {
                  n: "2",
                  title: "Edit or match a job",
                  body: "Change fields with a live preview, or paste a JD — we only rewrite what you already have.",
                },
                {
                  n: "3",
                  title: "Download and apply",
                  body: "Export PDF or .tex. Use the free ATS checker to see keyword gaps before you submit.",
                },
              ].map((step) => (
                <div key={step.n} className="rounded-3xl border border-border bg-card/80 p-6 shadow-[0_20px_40px_-28px_rgba(28,20,16,0.45)]">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                    {step.n}
                  </div>
                  <h3 className="mt-4 font-display text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/50 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">Why ATSWeave</p>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                Built for people who care what the ATS extracts
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: FileText,
                  title: "What you see is the file",
                  body: "The editor preview is the downloaded PDF, rendered from the template you picked. Export .tex too if you want to finish in Overleaf.",
                },
                {
                  icon: PenLine,
                  title: "Live editor",
                  body: "Add experience, education, projects, and certifications. The page re-renders as you type — no compile step.",
                },
                {
                  icon: Sparkles,
                  title: "Honest job matching",
                  body: "AI reorders and rephrases your real bullets for a JD. It will not invent companies, dates, or metrics.",
                },
                {
                  icon: Gauge,
                  title: "Clear keyword score",
                  body: "Matched keywords, missing must-haves, section coverage, and formatting risks — our own analysis, not a vendor ATS score.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-3xl border border-border bg-card/70 p-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10">
                    <item.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ink py-16 text-ink-foreground sm:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-6 sm:px-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Free · no account</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">
                Check your resume against any job description
              </h2>
              <p className="mt-3 text-white/70">
                Paste the posting and upload your resume PDF (or paste text). Get keyword coverage, must-have gaps, and
                formatting warnings before you hit apply.
              </p>
            </div>
            <Button size="lg" className="bg-accent text-accent-foreground hover:brightness-110" asChild>
              <Link href="/ats-checker">
                Open ATS checker <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-background py-16">
          <div className="mx-auto max-w-2xl px-6 text-center sm:px-8">
            <h2 className="font-display text-3xl sm:text-4xl">Start with a template</h2>
            <p className="mt-3 text-muted-foreground">
              Sign in, choose a layout, and fill in your experience. Export when it looks right.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {authPending ? null : authed ? (
                <Button size="lg" asChild>
                  <Link href="/gallery">
                    Open gallery <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : authReady ? (
                <Button size="lg" onClick={start}>
                  Continue with demo <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
              <Button size="lg" variant="outline" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/40 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:px-8">
          <span className="font-semibold text-foreground">ATSWeave</span>
          <div className="flex gap-5">
            <Link href="/templates" className="hover:text-foreground">
              Templates
            </Link>
            <Link href="/ats-checker" className="hover:text-foreground">
              ATS Checker
            </Link>
          </div>
          <span suppressHydrationWarning>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
