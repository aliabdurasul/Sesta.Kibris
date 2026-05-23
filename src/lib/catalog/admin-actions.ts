/**
 * lib/supabase/admin.ts already exists — this is the catalog-specific
 * server actions helper for the admin catalog module.
 *
 * src/lib/catalog/admin-actions.ts
 * Server-side data fetching utilities for admin catalog pages.
 * Uses the service-role admin client to bypass RLS where needed (e.g. fetching inactive products).
 */

"use server";

import { createAdminServerClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

import { log } from "@/lib/logger";
import type {
  GlobalProduct,
  GlobalProductInsert,
  GlobalProductUpdate,
  ProductCategory,
} from "@/types/catalog";
import {
  catalogProductTag,
  catalogCategoryTag,
  CATALOG_ALL_TAG,
  slugify,
} from "./cache-tags";

// ── Products ──────────────────────────────────────────────────────────────────

export async function adminListProducts(opts?: {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ products: GlobalProduct[]; total: number }> {
  const supabase = createAdminServerClient();
  const page = opts?.page ?? 1;
  const size = opts?.pageSize ?? 50;
  const from = (page - 1) * size;

  let query = supabase
    .from("global_products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + size - 1);

  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }
  if (opts?.categoryId) {
    query = query.eq("category_id", opts.categoryId);
  }
  if (typeof opts?.isActive === "boolean") {
    query = query.eq("is_active", opts.isActive);
  }

  const { data, error, count } = await query;
  if (error) {
    log.error("admin.catalog.list", { reason: error.message });
    return { products: [], total: 0 };
  }
  return { products: (data ?? []) as GlobalProduct[], total: count ?? 0 };
}

export async function adminGetProduct(id: string): Promise<GlobalProduct | null> {
  const supabase = createAdminServerClient();
  const { data, error } = await supabase
    .from("global_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    log.error("admin.catalog.get", { id, reason: error.message });
    return null;
  }
  return data as GlobalProduct | null;
}

/** Admin creates a new global product. slug auto-generated from name+unit. */
export async function adminCreateProduct(
  input: Omit<GlobalProductInsert, "slug" | "created_by">,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadı." };

  const adminSupabase = createAdminServerClient();
  const slug = await generateUniqueSlug(
    `${input.name ?? ""} ${input.unit ?? ""}`,
    adminSupabase,
  );

  const payload: GlobalProductInsert = {
    ...(input as Partial<GlobalProduct>),
    name: input.name!,
    unit: input.unit!,
    slug,
    created_by: user.id,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  };

  const { data, error } = await adminSupabase
    .from("global_products")
    .insert(payload as never)
    .select("id")
    .single();

  if (error) {
    log.error("admin.catalog.create", { reason: error.message });
    return { success: false, error: error.message };
  }

  return { success: true, id: (data as { id: string }).id };
}

/** Admin updates an existing global product. */
export async function adminUpdateProduct(
  id: string,
  update: GlobalProductUpdate,
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminServerClient();
  const { error } = await adminSupabase
    .from("global_products")
    .update(update as never)
    .eq("id", id);

  if (error) {
    log.error("admin.catalog.update", { id, reason: error.message });
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Soft-delete: set is_active = false. Hard delete blocked if order_items reference it. */
export async function adminDeactivateProduct(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  return adminUpdateProduct(id, { is_active: false });
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function adminListCategories(): Promise<ProductCategory[]> {
  const supabase = createAdminServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("display_order");

  if (error) {
    log.error("admin.categories.list", { reason: error.message });
    return [];
  }
  return (data ?? []) as ProductCategory[];
}

export async function adminUpsertCategory(input: {
  id?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  display_order?: number;
  is_active?: boolean;
  icon_url?: string | null;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const adminSupabase = createAdminServerClient();
  if (input.id) {
    const { error } = await adminSupabase
      .from("product_categories")
      .update(input as never)
      .eq("id", input.id);
    if (error) return { success: false, error: error.message };
    return { success: true, id: input.id };
  } else {
    const { data, error } = await adminSupabase
      .from("product_categories")
      .insert(input as never)
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    const id = (data as { id: string }).id;
    return { success: true, id };
  }
}

// ── Merchant count helper ─────────────────────────────────────────────────────

export async function getMerchantCountForProduct(productId: string): Promise<number> {
  const supabase = createAdminServerClient();
  const { count } = await supabase
    .from("merchant_inventory")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  return count ?? 0;
}

// ── Slug generator ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateUniqueSlug(input: string, supabase: any): Promise<string> {
  const base = slugify(input);
  let candidate = base;
  let n = 1;

  while (true) {
    const { data } = await supabase
      .from("global_products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n++}`;
  }
}


