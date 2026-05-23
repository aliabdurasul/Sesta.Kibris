"use server";

/**
 * lib/catalog/merchant-actions.ts
 * Server actions for merchant inventory management.
 * Called from merchant panel pages and components.
 */

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import type { MerchantInventoryInsert, MerchantInventoryUpdate, InventoryItemWithProduct } from "@/types/catalog";

// ── Inventory listing ─────────────────────────────────────────────────────────

export async function getMerchantInventory(merchantId: string): Promise<InventoryItemWithProduct[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("merchant_inventory")
    .select(`
      id, merchant_id, product_id, price, stock_count, is_available, display_order, attached_at, updated_at,
      global_product:global_products(
        id, name, slug, description, brand, unit, image_url, category_id, tags, is_active
      )
    `)
    .eq("merchant_id", merchantId)
    .order("display_order")
    .order("attached_at", { ascending: false });

  if (error) {
    log.error("merchant.inventory.list", { merchantId, reason: error.message });
    return [];
  }
  return (data ?? []) as unknown as InventoryItemWithProduct[];
}

// ── Attach product from global catalog ───────────────────────────────────────

export async function attachProductToInventory(input: {
  productId: string;
  price: number; // kuruş
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await requireRole("merchant");
  if (!session.merchantId) return { success: false, error: "Market kaydı bulunamadı." };

  const supabase = await createServerClient();
  const payload: MerchantInventoryInsert = {
    merchant_id: session.merchantId,
    product_id: input.productId,
    price: input.price,
    is_available: false, // starts hidden — merchant must activate
  };

  const { data, error } = await supabase
    .from("merchant_inventory")
    .insert(payload as never)
    .select("id")
    .single();

  if (error) {
    log.error("merchant.inventory.attach", { reason: error.message });
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/products");
  return { success: true, id: (data as { id: string }).id };
}

// ── Update price ──────────────────────────────────────────────────────────────

export async function updateInventoryPrice(
  inventoryId: string,
  priceKurus: number,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole("merchant");
  if (!session.merchantId) return { success: false, error: "Market kaydı bulunamadı." };

  if (!Number.isFinite(priceKurus) || priceKurus <= 0) {
    return { success: false, error: "Geçerli bir fiyat girin." };
  }

  const supabase = await createServerClient();
  const update: MerchantInventoryUpdate = { price: priceKurus };

  const { error } = await supabase
    .from("merchant_inventory")
    .update({ price: priceKurus } as never)
    .eq("id", inventoryId)
    .eq("merchant_id", session.merchantId); // RLS double-check

  if (error) {
    log.error("merchant.inventory.price", { inventoryId, reason: error.message });
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/products");
  return { success: true };
}

// ── Update stock ──────────────────────────────────────────────────────────────

export async function updateInventoryStock(
  inventoryId: string,
  stockCount: number | null,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole("merchant");
  if (!session.merchantId) return { success: false, error: "Market kaydı bulunamadı." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("merchant_inventory")
    .update({ stock_count: stockCount } as never)
    .eq("id", inventoryId)
    .eq("merchant_id", session.merchantId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant/products");
  return { success: true };
}

// ── Toggle availability ───────────────────────────────────────────────────────

export async function toggleInventoryAvailability(
  inventoryId: string,
  isAvailable: boolean,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole("merchant");
  if (!session.merchantId) return { success: false, error: "Market kaydı bulunamadı." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("merchant_inventory")
    .update({ is_available: isAvailable } as never)
    .eq("id", inventoryId)
    .eq("merchant_id", session.merchantId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant/products");
  revalidatePath("/");
  return { success: true };
}

// ── Detach (remove) from inventory ───────────────────────────────────────────

export async function detachFromInventory(
  inventoryId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole("merchant");
  if (!session.merchantId) return { success: false, error: "Market kaydı bulunamadı." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("merchant_inventory")
    .delete()
    .eq("id", inventoryId)
    .eq("merchant_id", session.merchantId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant/products");
  return { success: true };
}

// ── Submit product suggestion ─────────────────────────────────────────────────

export async function submitProductSuggestion(input: {
  name: string;
  unit: string;
  brand?: string;
  description?: string;
  categoryHint?: string;
  merchantNotes?: string;
}): Promise<{ success: boolean; id?: string; isDuplicate?: boolean; error?: string }> {
  const session = await requireRole("merchant");
  if (!session.merchantId) return { success: false, error: "Market kaydı bulunamadı." };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("product_suggestions")
    .insert({
      merchant_id: session.merchantId,
      submitted_by: session.id,
      name: input.name.trim(),
      unit: input.unit.trim(),
      brand: input.brand?.trim() || null,
      description: input.description?.trim() || null,
      category_hint: input.categoryHint?.trim() || null,
      merchant_notes: input.merchantNotes?.trim() || null,
    } as never)
    .select("id, status, similarity_score, duplicate_of")
    .single();

  if (error) {
    if (error.message.includes("SUGGESTION_RATE_LIMIT")) {
      return { success: false, error: "Günlük 5 öneri limitine ulaştınız." };
    }
    log.error("merchant.suggestion.submit", { reason: error.message });
    return { success: false, error: error.message };
  }

  const row = data as { id: string; status: string; similarity_score: number | null };
  return {
    success: true,
    id: row.id,
    isDuplicate: row.status === "DUPLICATE",
  };
}
