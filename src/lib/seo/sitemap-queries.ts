/**
 * Lean Supabase reads for sitemap generation only.
 * Uses anon server client + explicit public filters (matches storefront RLS).
 */
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { SITEMAP_CHUNK_SIZE } from "./sitemap-config";

export type SitemapMerchant = {
  slug: string;
  updated_at: string | null;
};

export type SitemapCategory = {
  slug: string;
  updated_at: string | null;
};

export type SitemapCatalogProduct = {
  slug: string;
  updated_at: string | null;
};

export type SitemapMarketProduct = {
  merchantSlug: string;
  productSlug: string;
  updated_at: string | null;
};

export type SitemapCounts = {
  products: number;
  marketProducts: number;
};

async function getActiveMerchantIds(): Promise<string[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("id")
    .eq("is_active", true);

  if (error) {
    log.error("sitemap.active_merchants", { reason: error.message });
    return [];
  }
  return (data ?? []).map((m) => (m as { id: string }).id);
}

export async function getSitemapCounts(): Promise<SitemapCounts> {
  const supabase = await createServerClient();

  const productsRes = await supabase
    .from("global_products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (productsRes.error) {
    log.error("sitemap.count.products", { reason: productsRes.error.message });
  }

  const merchantIds = await getActiveMerchantIds();
  let marketProducts = 0;
  if (merchantIds.length > 0) {
    const marketProductsRes = await supabase
      .from("merchant_inventory")
      .select("id", { count: "exact", head: true })
      .in("merchant_id", merchantIds)
      .eq("is_available", true)
      .gt("price", 0);

    if (marketProductsRes.error) {
      log.error("sitemap.count.market_products", {
        reason: marketProductsRes.error.message,
      });
    } else {
      marketProducts = marketProductsRes.count ?? 0;
    }
  }

  return {
    products: productsRes.count ?? 0,
    marketProducts,
  };
}

export async function getSitemapMerchants(): Promise<SitemapMerchant[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("slug, updated_at")
    .eq("is_active", true)
    .not("slug", "is", null)
    .order("slug");

  if (error) {
    log.error("sitemap.merchants", { reason: error.message });
    return [];
  }

  return ((data ?? []) as SitemapMerchant[]).filter((m) =>
    Boolean(m.slug?.trim()),
  );
}

export async function getSitemapProductCategories(): Promise<SitemapCategory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    log.error("sitemap.categories", { reason: error.message });
    return [];
  }

  return ((data ?? []) as SitemapCategory[]).filter((c) =>
    Boolean(c.slug?.trim()),
  );
}

export async function getSitemapCatalogProductsChunk(
  chunkIndex: number,
): Promise<SitemapCatalogProduct[]> {
  const supabase = await createServerClient();
  const from = chunkIndex * SITEMAP_CHUNK_SIZE;
  const to = from + SITEMAP_CHUNK_SIZE - 1;

  const { data, error } = await supabase
    .from("global_products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("slug")
    .range(from, to);

  if (error) {
    log.error("sitemap.products.chunk", { chunkIndex, reason: error.message });
    return [];
  }

  return ((data ?? []) as SitemapCatalogProduct[]).filter((p) =>
    Boolean(p.slug?.trim()),
  );
}

export async function getSitemapMarketProductsChunk(
  chunkIndex: number,
): Promise<SitemapMarketProduct[]> {
  const merchantIds = await getActiveMerchantIds();
  if (merchantIds.length === 0) return [];

  const supabase = await createServerClient();
  const from = chunkIndex * SITEMAP_CHUNK_SIZE;
  const to = from + SITEMAP_CHUNK_SIZE - 1;

  const { data, error } = await supabase
    .from("merchant_inventory")
    .select(
      `
      updated_at,
      merchants!inner ( slug ),
      global_products!inner ( slug, is_active )
    `,
    )
    .in("merchant_id", merchantIds)
    .eq("is_available", true)
    .gt("price", 0)
    .eq("global_products.is_active", true)
    .order("merchant_id")
    .order("product_id")
    .range(from, to);

  if (error) {
    log.error("sitemap.market_products.chunk", {
      chunkIndex,
      reason: error.message,
    });
    return [];
  }

  type InventoryRow = {
    updated_at: string | null;
    merchants: { slug?: string } | null;
    global_products: { slug?: string; is_active?: boolean } | null;
  };

  const rows: SitemapMarketProduct[] = [];
  for (const row of (data ?? []) as InventoryRow[]) {
    const m = row.merchants;
    const p = row.global_products;
    if (!m?.slug?.trim() || !p?.slug?.trim()) continue;
    rows.push({
      merchantSlug: m.slug.trim(),
      productSlug: p.slug.trim(),
      updated_at: row.updated_at as string | null,
    });
  }
  return rows;
}
