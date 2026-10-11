"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Download, FileCheck2, FileText, Gauge, Menu, PenLine, ScanSearch, Sparkles, WandSparkles, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";
import { LandingResumeSlider } from "@/components/gallery/landing-resume-slider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { canSignIn, continueUrlFromSearch, startSignIn } from "@/lib/auth-client";

const journey = [
  { title: "Choose a template", detail: "Start from a real, ATS-safe LaTeX layout.", icon: FileText, href: "/templates" },
  { title: "Make it yours", detail: "Edit your experience alongside the live PDF.", icon: PenLine, href: "/gallery" },
  { title: "Match the role", detail: "Use your profile and a job description to tailor the wording.", icon: WandSparkles, href: "/gallery" },
  { title: "Watch it build", detail: "Follow the actual analyze, match, rewrite, validate, compile, and score events.", icon: Sparkles, href: "/gallery" },
  { title: "Find the gaps", detail: "Check matched keywords, missing requirements, and formatting.", icon: ScanSearch, href: "/ats-checker" },
  { title: "Export the PDF", detail: "Download the exact document shown in the editor.", icon: Download, href: "/gallery" },
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: .65, ease: [0.2, .8, .2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LandingHero({ googleConfigured, demoConfigured }: { googleConfigured: boolean; demoConfigured: boolean }) {
  const search = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const from = continueUrlFromSearch(search);
  const needsContinue = Boolean(search.get("from"));
  const authReady = canSignIn(googleConfigured, demoConfigured);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const signingIn = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (status === "authenticated" && needsContinue) router.replace(from);
  }, [status, needsContinue, from, router]);
  useEffect(() => {
    if (!mounted || status === "loading" || status === "authenticated") return;
    if (!needsContinue || !authReady || signingIn.current) return;
    signingIn.current = true;
    void startSignIn({ googleConfigured, demoConfigured, callbackUrl: from });
  }, [mounted, status, needsContinue, authReady, from, googleConfigured, demoConfigured]);

  const start = () => startSignIn({ googleConfigured, demoConfigured, callbackUrl: from });
  const authed = mounted && status === "authenticated" && Boolean(session?.user);
  const authPending = !mounted || status === "loading";
  const mainHref = authed ? "/gallery" : "/templates";

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <BrandMark />
          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-full border border-border/80 bg-card/75 p-1 shadow-sm md:flex">
            <Link href="#how" className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">How it works</Link>
            <Link href="/templates" className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">Templates</Link>
            <Link href="/ats-checker" className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">ATS checker</Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {authPending ? <Button size="sm" disabled className="invisible">Get started</Button> :
              authed ? <Button size="sm" asChild><Link href="/gallery">Open workspace <ArrowRight /></Link></Button> :
              authReady ? <Button size="sm" onClick={start}>Get started <ArrowRight /></Button> :
              <Button size="sm" asChild><Link href="/templates">Get started <ArrowRight /></Link></Button>}
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-foreground md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && <nav aria-label="Mobile navigation" className="grid gap-1 border-t border-border bg-card px-5 py-3 md:hidden">
          {[["How it works", "#how"], ["Templates", "/templates"], ["ATS checker", "/ats-checker"]].map(([label, href]) =>
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">{label}</Link>)}
        </nav>}
      </header>

      <main>
        {needsContinue && !authPending && !authed && <div className="mx-auto max-w-7xl px-5 pt-4 sm:px-8">
          <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <span>Signing you in so you can edit that resume.</span>
            {authReady ? <Button size="sm" onClick={start}>Continue <ArrowRight /></Button> :
              <span className="text-muted-foreground">Authentication is not configured on this server.</span>}
          </div>
        </div>}

        <section className="ambient-section relative px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-10">
            <div className="relative z-10">
              <div className="reveal"><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> AI-powered resume workspace</span></div>
              <h1 className="reveal reveal-delay-1 mt-6 max-w-[12ch] font-display text-[clamp(3.3rem,6vw,6.2rem)] leading-[.98]">
                Your story, <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-sky-300">sharper for every role.</span>
              </h1>
              <p className="reveal reveal-delay-2 mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Choose a polished template, edit with a live PDF, tailor to a job using your real experience, and see exactly where your resume stands.
              </p>
              <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
                {authed ? <Button size="lg" asChild><Link href="/gallery">Open template gallery <ArrowRight /></Link></Button> :
                  authReady ? <Button size="lg" onClick={start}>Build your resume <ArrowRight /></Button> :
                  <Button size="lg" asChild><Link href="/templates">Explore templates <ArrowRight /></Link></Button>}
                <Button size="lg" variant="outline" asChild><Link href="/ats-checker">Check a resume <Gauge /></Link></Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Real PDF preview</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Your facts stay yours</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Free ATS check</span>
              </div>
            </div>
            <div className="relative reveal reveal-delay-2">
              <div className="absolute -inset-6 rounded-[48px] bg-gradient-to-br from-indigo-400/20 via-violet-400/10 to-sky-400/20 blur-3xl" aria-hidden />
              <div className="glass-panel relative overflow-hidden rounded-[28px] p-2 shadow-[0_35px_90px_-40px_rgba(48,63,138,.45)] sm:p-3">
                <div className="flex items-center justify-between rounded-t-[20px] border-b border-border bg-card/80 px-4 py-3">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff7773]" /><span className="h-2.5 w-2.5 rounded-full bg-[#f4c95d]" /><span className="h-2.5 w-2.5 rounded-full bg-[#6ad4a9]" /><span className="ml-3 text-xs font-semibold text-muted-foreground">ATSWeave / Resume editor</span></div>
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success">LIVE PDF</span>
                </div>
                <div className="grid min-h-[410px] grid-cols-[.64fr_1fr] gap-2 bg-muted/60 p-2 sm:min-h-[500px] sm:gap-3 sm:p-3">
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[.15em] text-accent">Edit content</div>
                    <div className="font-display text-base sm:text-xl">A resume that reads like you.</div>
                    <div className="mt-1 space-y-2">
                      {["Contact details", "Experience", "Skills", "Projects", "Education"].map((item, i) =>
                        <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-semibold text-muted-foreground sm:px-3 sm:text-xs">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">{i + 1}</span>{item}
                        </div>)}
                    </div>
                    <div className="mt-auto rounded-lg border border-accent/20 bg-accent/5 p-2 text-[10px] font-medium text-muted-foreground sm:p-3 sm:text-xs">Match to a job, then export the exact PDF you see.</div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-[#e6ebf5] p-2 sm:p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#53637b]"><span>Document preview</span><span>Letter · PDF</span></div>
                    <div className="mx-auto max-w-[340px] overflow-hidden rounded-sm bg-white shadow-[0_20px_35px_-18px_rgba(9,18,38,.5)]">
                      <TemplateThumbnail slug="jakes" name="Jake's resume" eager />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-b-[20px] bg-card px-4 py-3 text-[10px] font-semibold text-muted-foreground sm:text-xs">
                  <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5 text-success" /> Actual template preview</span>
                  <Link href={mainHref} className="inline-flex items-center gap-1 text-accent hover:underline">Explore the workflow <ArrowRight className="h-3 w-3" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="border-y border-border bg-card/45 px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="max-w-2xl"><p className="eyebrow">One connected workflow</p><h2 className="mt-5 font-display text-4xl sm:text-5xl">From first draft to final PDF.</h2>
              <p className="mt-4 text-muted-foreground">Every step has a purpose. Move from layout to content to job match, with the document in view.</p></Reveal>
            <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {journey.map((step, i) => <Reveal key={step.title}>
                <Link href={step.href} className="lift-card group flex h-full flex-col rounded-[24px] border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent"><step.icon className="h-5 w-5" /></span><span className="font-mono text-xs text-muted-foreground">0{i + 1} / 06</span></div>
                  <h3 className="mt-6 font-display text-xl">{step.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-accent">Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                </Link></Reveal>)}
            </div>
          </div>
        </section>

        <section className="ambient-section px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl"><Reveal className="mx-auto max-w-2xl text-center"><p className="eyebrow">The document is the product</p><h2 className="mt-5 font-display text-4xl sm:text-5xl">Explore real resume layouts.</h2><p className="mt-4 text-muted-foreground">These previews use ATSWeave templates. Open one to edit that same layout with your content.</p></Reveal></div>
          <Reveal className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-[28px] border border-border bg-ink p-3 shadow-[0_32px_70px_-38px_rgba(9,18,38,.6)] sm:p-5">
            <LandingResumeSlider />
          </Reveal>
        </section>

        <section className="px-5 pb-20 sm:px-8 lg:pb-28">
          <Reveal className="mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[32px] bg-ink p-8 text-ink-foreground sm:p-12 lg:grid-cols-[1fr_auto]">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#aaa5ff]">Know before you apply</p><h2 className="mt-4 max-w-xl font-display text-3xl sm:text-4xl">See the match. Find the gaps. Send with confidence.</h2>
              <p className="mt-4 max-w-xl text-sm text-slate-300">Upload an existing PDF or paste resume text and a job description. See keyword coverage, missing requirements, and formatting risks. No account needed.</p></div>
            <Button size="lg" asChild><Link href="/ats-checker">Open ATS checker <ArrowRight /></Link></Button>
          </Reveal>
        </section>
      </main>
      <footer className="border-t border-border bg-card/50 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <BrandMark /><span>Build with clarity. Apply with confidence.</span><div className="flex gap-5"><Link href="/templates" className="hover:text-foreground">Templates</Link><Link href="/ats-checker" className="hover:text-foreground">ATS checker</Link></div>
      </div></footer>
    </div>
  );
}
