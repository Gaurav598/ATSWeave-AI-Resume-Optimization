import { Suspense } from "react";
import { LandingHero } from "@/components/landing-hero";

export default function LandingPage() {
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoConfigured = process.env.AUTH_DEMO_LOGIN === "true";
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>}>
      <LandingHero googleConfigured={googleConfigured} demoConfigured={demoConfigured} />
    </Suspense>
  );
}
