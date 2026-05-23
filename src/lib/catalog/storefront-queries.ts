"use server";

/**
 * lib/catalog/storefront-queries.ts
 * Public storefront data fetching — products per market, global catalog, price comparison.
 * Uses anon/user client (RLS enforced: only active+available products visible).
 */

import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";
import type { StorefrontProduct, PriceComparisonEntry, GlobalProduct, ProductCategory } from "@/types/catalog";

// ── Market product listing ────────────────────────────────────────────────────

export async function getStorefrontProducts(merchantId: string): Promise<StorefrontProduct[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchant_inventory")
    .select(`
      id, merchant_id, product_id, price, stock_count, is_available, display_order,
      global_products!inner(
        id, name, slug, description, brand, unit, image_url, category_id, tags,
        product_categories(name)
      )
    `)
    .eq("merchant_id", merchantId)
    .eq("is_available", true)
    .gt("price", 0)
    .order("display_order")
    .order("id");

  if (error) {
    log.error("storefront.products.fetch", { merchantId, reason: error.message });
    return [];
  }

  return ((data ?? []) as unknown[]).map((row: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const gp = r.global_products;
    return {
      inventoryId: r.id as string,
      merchantId: r.merchant_id as string,
      price: r.price as number,
      stockCount: r.stock_count as number | null,
      isAvailable: r.is_available as boolean,
      displayOrder: r.display_order as number,
      productId: gp.id as string,
      name: gp.name as string,
      description: gp.description as string | null,
      brand: gp.brand as string | null,
      unit: gp.unit as string,
      slug: gp.slug as string,
      imageUrl: sanitizeProductImageUrl(gp.image_url as string | null),
      tags: (gp.tags ?? []) as string[],
      categoryId: gp.category_id as string | null,
      categoryName: (gp.product_categories?.name ?? null) as string | null,
    } satisfies StorefrontProduct;
  });
}

export async function getStorefrontProductBySlug(merchantId: string, productSlug: string): Promise<StorefrontProduct | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchant_inventory")
    .select(`
      id, merchant_id, product_id, price, stock_count, is_available, display_order,
      global_products!inner(
        id, name, slug, description, brand, unit, image_url, category_id, tags,
        product_categories(name)
      )
    `)
    .eq("merchant_id", merchantId)
    .eq("global_products.slug", productSlug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;
  const gp = r.global_products;
  return {
    inventoryId: r.id as string,
    merchantId: r.merchant_id as string,
    price: r.price as number,
    stockCount: r.stock_count as number | null,
    isAvailable: r.is_available as boolean,
    displayOrder: r.display_order as number,
    productId: gp.id as string,
    name: gp.name as string,
    description: gp.description as string | null,
    brand: gp.brand as string | null,
    unit: gp.unit as string,
    slug: gp.slug as string,
    imageUrl: sanitizeProductImageUrl(gp.image_url as string | null),
    tags: (gp.tags ?? []) as string[],
    categoryId: gp.category_id as string | null,
    categoryName: (gp.product_categories?.name ?? null) as string | null,
  } satisfies StorefrontProduct;
}

// ── Price comparison ──────────────────────────────────────────────────────────

export async function getPriceComparison(
  productId: string,
  currentMerchantId: string,
): Promise<PriceComparisonEntry[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchant_inventory")
    .select(`
      price, merchant_id, is_available,
      merchants!inner(name, slug, is_active, is_open)
    `)
    .eq("product_id", productId)
    .eq("is_available", true)
    .gt("price", 0)
    .order("price");

  if (error) {
    log.error("storefront.price_comparison", { productId, reason: error.message });
    return [];
  }

  return ((data ?? []) as unknown[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const m = row.merchants;
      if (!m?.is_active) return null;
      return {
        merchantId: row.merchant_id as string,
        merchantName: m.name as string,
        merchantSlug: m.slug as string,
        price: row.price as number,
        isAvailable: row.is_available as boolean,
        isCurrentMerchant: row.merchant_id === currentMerchantId,
      } satisfies PriceComparisonEntry;
    })
    .filter(Boolean) as PriceComparisonEntry[];
}

// ── Global catalog listing ────────────────────────────────────────────────────

export async function getGlobalCatalog(opts?: {
  categorySlug?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ products: GlobalProduct[]; total: number; categories: ProductCategory[] }> {
  const supabase = await createServerClient();
  const page = opts?.page ?? 1;
  const size = opts?.pageSize ?? 60;
  const from = (page - 1) * size;

  const catPromise = supabase
    .from("product_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  let productQuery = supabase
    .from("global_products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("name")
    .range(from, from + size - 1);

  if (opts?.search) {
    productQuery = productQuery.ilike("name", `%${opts.search}%`);
  }

  if (opts?.categorySlug) {
    // Join through category
    const { data: cat } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (cat) {
      productQuery = productQuery.eq("category_id", (cat as { id: string }).id);
    }
  }

  const [{ data: products, count }, { data: categories }] = await Promise.all([
    productQuery,
    catPromise,
  ]);

  return {
    products: (products ?? []) as GlobalProduct[],
    total: count ?? 0,
    categories: (categories ?? []) as ProductCategory[],
  };
}

// ── Single product by slug ────────────────────────────────────────────────────

export async function getProductBySlug(slug: string): Promise<GlobalProduct | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("global_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    log.error("storefront.product_by_slug", { slug, reason: error.message });
    return null;
  }
  return data as GlobalProduct | null;
}
