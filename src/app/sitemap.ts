import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getPublicMerchants } from "@/lib/merchants/list-public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const { merchants } = await getPublicMerchants();

  const marketEntries: MetadataRoute.Sitemap = merchants.map((m) => ({
    url: `${base}/market/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...marketEntries,
  ];
}
