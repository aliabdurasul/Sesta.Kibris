import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getPublicMerchants } from "@/lib/merchants/list-public";
import { getGlobalCatalog } from "@/lib/catalog/storefront-queries";

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

  const { products } = await getGlobalCatalog({ pageSize: 500 });
  const catalogEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/catalog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...marketEntries,
    ...catalogEntries,
  ];
}
