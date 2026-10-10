import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateByIdOrSlug } from "@/lib/templates";

export const dynamic = "force-dynamic";
import { MarketingHeader } from "@/components/marketing-header";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";
import { TemplateUseActions } from "@/components/templates/template-use-actions";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplateByIdOrSlug(slug);
  if (!template) return { title: "Template not found" };
  return {
    title: `${template.name} LaTeX Resume Template`,
    description: template.description || `${template.name} ATS-safe LaTeX resume template on ATSWeave.`,
    alternates: { canonical: `/templates/${template.slug}` },
    openGraph: {
      title: `${template.name} | ATSWeave`,
      description: template.description || undefined,
      url: `/templates/${template.slug}`,
      images: [{ url: "/templates/preview.svg" }],
    },
  };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params;
  const template = await getTemplateByIdOrSlug(slug);
  if (!template) notFound();
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const demoConfigured = process.env.AUTH_DEMO_LOGIN === "true";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${template.name} Resume Template`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${siteConfig.url}/templates/${template.slug}`,
    description: template.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingHeader googleConfigured={googleConfigured} demoConfigured={demoConfigured} />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="desk-wood rounded-3xl border border-black/20 p-4 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.55)] sm:p-6">
          <TemplateThumbnail slug={template.slug} name={template.name} eager showLabel />
        </div>
        <div>
          <p className="eyebrow">Real LaTeX template</p>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">{template.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {template.atsSafe && <Badge variant="accent">ATS-Safe</Badge>}
            <Badge variant="outline">{template.category}</Badge>
          </div>
          <p className="mt-5 text-muted-foreground">{template.description}</p>
          {template.sourceUrl && (
            <p className="mt-3 text-sm text-muted-foreground">
              Source:{" "}
              <a href={template.sourceUrl} className="text-accent underline-offset-4 hover:underline" rel="noreferrer">
                {template.sourceUrl}
              </a>
            </p>
          )}
          <div className="mt-8">
            <TemplateUseActions
              templateId={template.id}
              templateName={template.name}
              googleConfigured={googleConfigured}
              demoConfigured={demoConfigured}
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Already have a resume PDF?{" "}
            <Link href="/ats-checker" className="text-accent underline-offset-4 hover:underline">
              Score any resume text against a job description
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
