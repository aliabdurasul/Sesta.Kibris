"use server";

/**
 * lib/catalog/suggestion-admin-actions.ts
 * Admin server actions for reviewing product suggestions.
 */

import { createAdminServerClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { adminCreateProduct } from "./admin-actions";
import type { ProductSuggestion } from "@/types/catalog";

export async function adminListSuggestions(opts?: {
  status?: string;
  page?: number;
}): Promise<{ suggestions: (ProductSuggestion & { merchant_name?: string })[]; total: number }> {
  const adminSupabase = createAdminServerClient();
  const page = opts?.page ?? 1;
  const size = 50;
  const from = (page - 1) * size;

  let query = adminSupabase
    .from("product_suggestions")
    .select("*, merchants!inner(name)", { count: "exact" })
    .order("created_at", { ascending: true })
    .range(from, from + size - 1);

  if (opts?.status) {
    query = query.eq("status", opts.status);
  } else {
    // Default: PENDING first
    query = query.in("status", ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "DUPLICATE"]);
    query = query.order("status");
  }

  const { data, error, count } = await query;
  if (error) {
    log.error("admin.suggestions.list", { reason: error.message });
    return { suggestions: [], total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestions = (data ?? []).map((row: any) => ({
    ...row,
    merchant_name: row.merchants?.name ?? null,
  }));

  return { suggestions, total: count ?? 0 };
}

export async function adminGetPendingSuggestionCount(): Promise<number> {
  const adminSupabase = createAdminServerClient();
  const { count } = await adminSupabase
    .from("product_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");
  return count ?? 0;
}

/** Admin approves a suggestion — creates global product + auto-attaches to merchant inventory */
export async function adminApproveSuggestion(
  suggestionId: string,
  productData: {
    name: string;
    unit: string;
    brand?: string;
    description?: string;
    category_id?: string;
    tags?: string[];
    adminNotes?: string;
  },
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadı." };

  const adminSupabase = createAdminServerClient();

  // 1. Fetch the suggestion to get merchant_id
  const { data: suggestion, error: fetchErr } = await adminSupabase
    .from("product_suggestions")
    .select("id, merchant_id, from_suggestion_id:id")
    .eq("id", suggestionId)
    .maybeSingle();

  if (fetchErr || !suggestion) {
    return { success: false, error: "Öneri bulunamadı." };
  }

  const s = suggestion as { id: string; merchant_id: string };

  // 2. Create the global product
  const result = await adminCreateProduct({
    name: productData.name,
    unit: productData.unit,
    brand: productData.brand || null,
    description: productData.description || null,
    category_id: productData.category_id || null,
    tags: productData.tags ?? [],
    from_suggestion_id: suggestionId,
  });

  if (!result.success) return { success: false, error: result.error };

  const productId = result.id;

  // 3. Auto-attach to suggesting merchant's inventory (price=1 placeholder, is_available=false)
  await adminSupabase.from("merchant_inventory").insert({
    merchant_id: s.merchant_id,
    product_id: productId,
    price: 1, // merchant must update before activating
    is_available: false,
  } as never);

  // 4. Update suggestion status
  await adminSupabase
    .from("product_suggestions")
    .update({
      status: "APPROVED",
      global_product_id: productId,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: productData.adminNotes || null,
    } as never)
    .eq("id", suggestionId);

  return { success: true, productId };
}

/** Admin rejects a suggestion with a required reason */
export async function adminRejectSuggestion(
  suggestionId: string,
  adminNotes: string,
): Promise<{ success: boolean; error?: string }> {
  if (!adminNotes?.trim() || adminNotes.trim().length < 10) {
    return { success: false, error: "Red gerekçesi en az 10 karakter olmalıdır." };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadı." };

  const adminSupabase = createAdminServerClient();
  const { error } = await adminSupabase
    .from("product_suggestions")
    .update({
      status: "REJECTED",
      admin_notes: adminNotes.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", suggestionId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
