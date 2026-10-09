export const siteConfig = {
  name: "ATSWeave",
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000",
  description:
    "ATS-optimized resume builder with real LaTeX templates. Edit by hand or AI-match to a job description — without inventing experience.",
  keywords: [
    "ATS resume",
    "LaTeX resume",
    "Jake's resume",
    "ATS score checker",
    "resume builder",
    "FAANG resume",
    "software engineer resume",
  ],
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
