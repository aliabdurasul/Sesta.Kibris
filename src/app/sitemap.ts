/**
 * Dynamic sitemap — split across multiple XML files when the catalog grows.
 *
 * URL map (canonical public routes):
 *   /                          homepage
 *   /?category=grocery         browse category (markets)
 *   /catalog                   global catalog index
 *   /catalog?category=sut-yumurta  product category filter
 *   /catalog/[slug]            global product (canonical product URL)
 *   /market/[slug]             merchant / market page
 *   /market/[slug]/product/[productSlug]  product at merchant
 *
 * URLs use NEXT_PUBLIC_SITE_URL (production: https://www.sestakibris.com).
 *
 * Caching: `revalidate` enables ISR (~1h). Purge via redeploy or
 * `revalidatePath('/sitemap.xml')` after bulk catalog changes.
 *
 * Scale: `generateSitemaps()` adds chunked files (5k URLs each) for products.
 */
import type { MetadataRoute } from "next";
import {
  marketProductChunkIndex,
  marketProductSitemapId,
  parseSitemapId,
  productChunkIndex,
  productSitemapId,
  SITEMAP_CHUNK_SIZE,
  SITEMAP_ID_PRODUCTS_END,
} from "@/lib/seo/sitemap-config";
import {
  buildCatalogProductEntries,
  buildCoreSitemapEntries,
  buildMarketProductEntries,
} from "@/lib/seo/sitemap-builders";
import {
  getSitemapCatalogProductsChunk,
  getSitemapCounts,
  getSitemapMarketProductsChunk,
  getSitemapMerchants,
  getSitemapProductCategories,
} from "@/lib/seo/sitemap-queries";

/** ISR: regenerate sitemap at most once per hour on Vercel. */
export const revalidate = 3600;

export async function generateSitemaps() {
  const { products, marketProducts } = await getSitemapCounts();

  const sitemaps: { id: number }[] = [{ id: 0 }];

  const productChunks = Math.ceil(products / SITEMAP_CHUNK_SIZE);
  for (let i = 0; i < productChunks; i++) {
    const id = productSitemapId(i);
    if (id > SITEMAP_ID_PRODUCTS_END) break;
    sitemaps.push({ id });
  }

  const marketChunks = Math.ceil(marketProducts / SITEMAP_CHUNK_SIZE);
  for (let i = 0; i < marketChunks; i++) {
    sitemaps.push({ id: marketProductSitemapId(i) });
  }

  return sitemaps;
}

export default async function sitemap(props: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const { id } = props;
  const kind = parseSitemapId(id);

  if (kind === "core") {
    const [merchants, productCategories] = await Promise.all([
      getSitemapMerchants(),
      getSitemapProductCategories(),
    ]);
    return buildCoreSitemapEntries({ merchants, productCategories });
  }

  if (kind === "products") {
    const products = await getSitemapCatalogProductsChunk(
      productChunkIndex(id),
    );
    return buildCatalogProductEntries(products);
  }

  const marketProducts = await getSitemapMarketProductsChunk(
    marketProductChunkIndex(id),
  );
  return buildMarketProductEntries(marketProducts);
}
