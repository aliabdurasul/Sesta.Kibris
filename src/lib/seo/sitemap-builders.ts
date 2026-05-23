import type { MetadataRoute } from "next";
import { assertSitemapEntryUrls } from "@/lib/site-config";
import {
  buildPublicUrl,
  getBrowseCategoryPaths,
  SITEMAP_PRIORITIES,
} from "./sitemap-config";
import type {
  SitemapCatalogProduct,
  SitemapCategory,
  SitemapMarketProduct,
  SitemapMerchant,
} from "./sitemap-queries";

function toLastModified(value: string | null | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function entry(
  pathname: string,
  opts: {
    lastModified?: Date;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority: number;
  },
): MetadataRoute.Sitemap[0] {
  return {
    url: buildPublicUrl(pathname),
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  };
}

/** Static + category + merchant URLs (sitemap id 0). */
export function buildCoreSitemapEntries(input: {
  merchants: SitemapMerchant[];
  productCategories: SitemapCategory[];
}): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    entry("/", {
      lastModified: now,
      changeFrequency: "daily",
      priority: SITEMAP_PRIORITIES.home,
    }),
    entry("/catalog", {
      lastModified: now,
      changeFrequency: "daily",
      priority: SITEMAP_PRIORITIES.catalogIndex,
    }),
  ];

  for (const path of getBrowseCategoryPaths()) {
    entries.push(
      entry(path, {
        changeFrequency: "weekly",
        priority: SITEMAP_PRIORITIES.browseCategory,
      }),
    );
  }

  for (const cat of input.productCategories) {
    entries.push(
      entry(`/catalog?category=${encodeURIComponent(cat.slug)}`, {
        lastModified: toLastModified(cat.updated_at),
        changeFrequency: "weekly",
        priority: SITEMAP_PRIORITIES.productCategory,
      }),
    );
  }

  for (const m of input.merchants) {
    entries.push(
      entry(`/market/${m.slug}`, {
        lastModified: toLastModified(m.updated_at),
        changeFrequency: "daily",
        priority: SITEMAP_PRIORITIES.merchant,
      }),
    );
  }

  assertSitemapEntryUrls(entries);
  return entries;
}

/** Global catalog product pages — canonical product URLs (/catalog/[slug]). */
export function buildCatalogProductEntries(
  products: SitemapCatalogProduct[],
): MetadataRoute.Sitemap {
  const entries = products.map((p) =>
    entry(`/catalog/${p.slug}`, {
      lastModified: toLastModified(p.updated_at),
      changeFrequency: "weekly",
      priority: SITEMAP_PRIORITIES.catalogProduct,
    }),
  );
  assertSitemapEntryUrls(entries);
  return entries;
}

/** Storefront product at merchant — /market/[slug]/product/[productSlug]. */
export function buildMarketProductEntries(
  rows: SitemapMarketProduct[],
): MetadataRoute.Sitemap {
  const entries = rows.map((r) =>
    entry(`/market/${r.merchantSlug}/product/${r.productSlug}`, {
      lastModified: toLastModified(r.updated_at),
      changeFrequency: "weekly",
      priority: SITEMAP_PRIORITIES.marketProduct,
    }),
  );
  assertSitemapEntryUrls(entries);
  return entries;
}
