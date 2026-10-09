import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ats-checker", "/templates", "/templates/"],
        disallow: ["/api/", "/editor/", "/dashboard/", "/profile/", "/generate/", "/match/", "/gallery/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
