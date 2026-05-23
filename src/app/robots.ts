import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

/**
 * robots.txt — allow public storefront; block dashboards and auth.
 * Sitemap index is served at /sitemap.xml (Next.js MetadataRoute).
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/merchant/",
        "/courier/",
        "/customer/",
        "/auth/",
        "/api/",
        "/setup-admin",
        "/staff",
        "/offline",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
