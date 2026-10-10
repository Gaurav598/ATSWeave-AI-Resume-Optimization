import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listPublishedTemplates } from "@/lib/templates";

export const dynamic = "force-dynamic";
import { MarketingHeader } from "@/components/marketing-header";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";
import { SignInButton } from "@/components/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "LaTeX Resume Templates (Jake's, sb2nov, RenderCV)",
  description:
    "Browse real ATS-safe LaTeX resume templates — Jake's Resume, sb2nov, Engineering Resumes, ModernCV, and more.",
  alternates: { canonical: "/templates" },
};

export default async function TemplatesIndexPage() {
  const templates = await listPublishedTemplates();
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoConfigured = process.env.AUTH_DEMO_LOGIN === "true";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader googleConfigured={googleConfigured} demoConfigured={demoConfigured} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <p className="eyebrow">Template library</p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">
          Real LaTeX resume templates
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every page below is this template filled with the same labeled example. Open one and you
          edit that exact layout — not a different person, not a different design.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.slug}`}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_40px_-24px_rgba(28,20,16,0.45)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_-20px_rgba(196,92,38,0.35)]"
            >
              <TemplateThumbnail
                slug={template.slug}
                name={template.name}
                className="border-b border-border desk-wood"
              />
              <div className="p-4">
                <div className="font-display text-xl">{template.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.atsSafe && <Badge variant="accent">ATS-Safe</Badge>}
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Suspense fallback={<Button size="lg">Continue to gallery</Button>}>
            <SignInButton
              size="lg"
              googleConfigured={googleConfigured}
              demoConfigured={demoConfigured}
              callbackUrl="/gallery"
            >
              Sign in &amp; open gallery
            </SignInButton>
          </Suspense>
          <Button size="lg" variant="outline" asChild>
            <Link href="/ats-checker">Score an existing resume (PDF or text)</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
