import type { Metadata } from "next";
import Link from "next/link";
import { AtsCheckerForm } from "@/components/ats/ats-checker-form";
import { MarketingHeader } from "@/components/marketing-header";

export const metadata: Metadata = {
  title: "Free ATS Resume Score Checker",
  description:
    "Upload a resume PDF or paste text, then score it against a job description — keyword coverage, must-have gaps, and formatting checks. No account required.",
  alternates: { canonical: "/ats-checker" },
  openGraph: {
    title: "Free ATS Resume Score Checker | ATSWeave",
    description: "Score any resume text against a job description. No signup.",
    url: "/ats-checker",
  },
};

export default function AtsCheckerPage() {
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoConfigured = process.env.AUTH_DEMO_LOGIN === "true";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader googleConfigured={googleConfigured} demoConfigured={demoConfigured} />
      <AtsCheckerForm />
      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        Want to build an ATS-safe LaTeX resume next?{" "}
        <Link href="/templates" className="font-medium text-accent underline-offset-4 hover:underline">
          Browse templates
        </Link>
      </footer>
    </div>
  );
}
