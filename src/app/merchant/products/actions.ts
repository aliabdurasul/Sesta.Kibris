"use server";

/**
 * Server Actions for merchant product management.
 *
 * RULES FOR "use server" FILES:
 *   - ONLY async function exports are allowed.
 *   - Do NOT export: interfaces, types, constants, runtime config.
 *   - Types used by callers must be defined in a separate non-server file
 *     and imported by both sides.
 *
 * Security:
 *   requireRole("merchant") enforces auth on every call.
 *   merchant_id is resolved from session — never trusted from client.
 */

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

export async function createProduct(input: {
  name: string;
  price: number;
  unit: string;
  description?: string;
  category?: string;
}): Promise<{ success: true; id: string }> {
  // ── Auth guard — resolves merchantId from session ────────────────────────
  const session = await requireRole("merchant");

  log.info("product.create.start", {
    merchantId: session.merchantId,
    name: input.name,
    price: input.price,
    unit: input.unit,
  });

  if (!session.merchantId) {
    log.error("product.create.no_merchant", { userId: session.id });
    throw new Error("Merchant kaydı bulunamadı. Lütfen yöneticinizle iletişime geçin.");
  }

  // ── Validate required fields before hitting DB ───────────────────────────
  if (!input.name.trim()) throw new Error("Ürün adı zorunludur.");
  if (!input.unit.trim()) throw new Error("Birim zorunludur.");
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("Geçerli bir fiyat giriniz.");
  }

  const supabase = await createServerClient();

  // ── Insert ───────────────────────────────────────────────────────────────
  // .single() throws a PostgREST error if the row cannot be read back
  // (e.g. RLS blocks read-after-write), surfacing the exact failure reason.
  // .maybeSingle() would silently return null, masking the error.
  const { data, error } = await supabase
    .from("products")
    .insert({
      merchant_id: session.merchantId,
      name: input.name.trim(),
      price: input.price,
      unit: input.unit.trim(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      is_available: true,
      is_active: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();

  if (error) {
    log.error("product.create.db_fail", {
      merchantId: session.merchantId,
      code: error.code,
      reason: error.message,
    });
    throw new Error(`[DB_INSERT_FAILED] ${error.message} | code=${error.code}`);
  }

  if (!data) {
    throw new Error(
      "[DB_INSERT_FAILED] Insert returned no data — RLS may be blocking read-after-write.",
    );
  }

  const id = (data as { id: string }).id;

  log.info("product.create.ok", {
    merchantId: session.merchantId,
    productId: id,
  });

  // Revalidate the products page so the server-rendered list reflects the insert.
  revalidatePath("/merchant/products");

  return { success: true, id };
}
