/**
 * Catalog domain types — convenience aliases over Database["public"]["Tables"]
 *
 * Import these in components and server actions instead of the raw Database type.
 * They are derived from the single source of truth in database.ts, so they
 * stay in sync automatically when database.ts is regenerated.
 */

import type { Database, SuggestionStatus } from "./database";

// ── Row types (what you get back from SELECT) ─────────────────────────────────

export type ProductCategory =
  Database["public"]["Tables"]["product_categories"]["Row"];

export type GlobalProduct =
  Database["public"]["Tables"]["global_products"]["Row"];

export type MerchantInventoryItem =
  Database["public"]["Tables"]["merchant_inventory"]["Row"];

export type ProductSuggestion =
  Database["public"]["Tables"]["product_suggestions"]["Row"];

/** Compat view row — read-only. Use GlobalProduct + MerchantInventoryItem for writes. */
export type ProductView = Database["public"]["Tables"]["products"]["Row"];

// ── Insert types ──────────────────────────────────────────────────────────────

export type GlobalProductInsert =
  Database["public"]["Tables"]["global_products"]["Insert"];

export type MerchantInventoryInsert =
  Database["public"]["Tables"]["merchant_inventory"]["Insert"];

export type ProductSuggestionInsert =
  Database["public"]["Tables"]["product_suggestions"]["Insert"];

// ── Update types ──────────────────────────────────────────────────────────────

export type GlobalProductUpdate =
  Database["public"]["Tables"]["global_products"]["Update"];

export type MerchantInventoryUpdate =
  Database["public"]["Tables"]["merchant_inventory"]["Update"];

// ── Re-export enum ────────────────────────────────────────────────────────────

export type { SuggestionStatus };

// ── Composed types (joined query results) ─────────────────────────────────────

/**
 * GlobalProduct enriched with its category — returned by catalog list queries.
 */
export type GlobalProductWithCategory = GlobalProduct & {
  category: Pick<ProductCategory, "id" | "name" | "slug" | "icon_url"> | null;
};

/**
 * MerchantInventoryItem enriched with the global product — returned by
 * merchant product list and storefront queries.
 */
export type InventoryItemWithProduct = MerchantInventoryItem & {
  global_product: GlobalProduct;
};

/**
 * Storefront product card — what the customer sees per merchant.
 * Flat shape for easy rendering.
 */
export interface StorefrontProduct {
  // From merchant_inventory
  inventoryId: string;
  merchantId: string;
  price: number;        // kuruş
  stockCount: number | null;
  isAvailable: boolean;
  displayOrder: number;

  // From global_products
  productId: string;
  name: string;
  description: string | null;
  brand: string | null;
  unit: string;
  slug: string;
  imageUrl: string | null;
  tags: string[];
  categoryId: string | null;
  categoryName: string | null;
}

/**
 * Price comparison entry — one merchant's offer for a product.
 */
export interface PriceComparisonEntry {
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  price: number;        // kuruş
  isAvailable: boolean;
  isCurrentMerchant: boolean;
}

/**
 * Image URL entry within global_products.image_urls JSON array.
 */
export interface ProductImageEntry {
  url: string;
  label: string;
  is_primary: boolean;
}
