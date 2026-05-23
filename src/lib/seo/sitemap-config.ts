/**
 * Sitemap / robots configuration — single source for SEO URL building.
 * Extend here for multi-city (path prefix) or multi-language (hreflang) later.
 */
import { buildAbsoluteUrl, getSiteUrl } from "@/lib/site-config";
import { SESTA_CATEGORIES } from "@/lib/landing/categories";

/** Max URLs per sitemap file (Google limit 50_000; keep headroom). */
export const SITEMAP_CHUNK_SIZE = 5_000;

/** ISR: regenerate sitemap at most once per hour on Vercel. */
export const SITEMAP_REVALIDATE_SECONDS = 3600;

export const SITEMAP_PRIORITIES = {
  home: 1.0,
  catalogIndex: 0.9,
  browseCategory: 0.8,
  productCategory: 0.8,
  merchant: 0.7,
  catalogProduct: 0.6,
  marketProduct: 0.6,
  staticPage: 0.5,
} as const;

export type SitemapId = number;

/** Core sitemap: static + categories + merchants. */
export const SITEMAP_ID_CORE = 0;

/** Product catalog chunks: 1 … 99 */
export const SITEMAP_ID_PRODUCTS_START = 1;
export const SITEMAP_ID_PRODUCTS_END = 99;

/** Market-scoped product chunks: 100 … */
export const SITEMAP_ID_MARKET_PRODUCTS_START = 100;

/** @deprecated Use getSiteUrl() from @/lib/site-config */
export function getSiteBaseUrl(): string {
  return getSiteUrl();
}

/** Absolute public URL for sitemap entries. */
export function buildPublicUrl(
  pathname: string,
  _opts?: { locale?: string; city?: string },
): string {
  return buildAbsoluteUrl(pathname);
}

/** Homepage browse filters (merchants.category). */
export function getBrowseCategoryPaths(): string[] {
  return SESTA_CATEGORIES.map((c) => `/?category=${encodeURIComponent(c.filter)}`);
}

export function productSitemapId(chunkIndex: number): SitemapId {
  return SITEMAP_ID_PRODUCTS_START + chunkIndex;
}

export function marketProductSitemapId(chunkIndex: number): SitemapId {
  return SITEMAP_ID_MARKET_PRODUCTS_START + chunkIndex;
}

export function parseSitemapId(id: SitemapId): "core" | "products" | "marketProducts" {
  if (id === SITEMAP_ID_CORE) return "core";
  if (id >= SITEMAP_ID_PRODUCTS_START && id <= SITEMAP_ID_PRODUCTS_END) {
    return "products";
  }
  return "marketProducts";
}

export function productChunkIndex(id: SitemapId): number {
  return id - SITEMAP_ID_PRODUCTS_START;
}

export function marketProductChunkIndex(id: SitemapId): number {
  return id - SITEMAP_ID_MARKET_PRODUCTS_START;
}
