"use server";

/**
 * Server Actions for merchant product management.
 *
 * DB schema (migration 00002_create_products) is the single source of truth.
 * Never send columns that are not present on the products table.
 */
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

const PRODUCT_INSERT_KEYS = [
  "merchant_id",
  "name",
  "description",
  "price",
  "unit",
  "stock_count",
  "is_available",
  "image_url",
  "display_order",
] as const satisfies readonly (keyof ProductInsert)[];

function assertProductInsertPayload(
  payload: Record<string, unknown>,
): asserts payload is ProductInsert {
  for (const key of Object.keys(payload)) {
    if (!PRODUCT_INSERT_KEYS.includes(key as (typeof PRODUCT_INSERT_KEYS)[number])) {
      throw new Error(`[SCHEMA_MISMATCH] Invalid column: ${key}`);
    }
  }
}

export async function createProduct(input: {
  name: string;
  price: number;
  unit: string;
  description?: string;
  stock_count?: number;
  image_url?: string;
  display_order?: number;
}): Promise<{ success: true; id: string }> {
  const session = await requireRole("merchant");

  log.info("product.create.start", {
    merchantId: session.merchantId,
    name: input.name,
    price: input.price,
    unit: input.unit,
  });

  if (!session.merchantId) {
    log.error("product.create.no_merchant", { userId: session.id });
    throw new Error(
      "Merchant kaydı bulunamadı. Lütfen yöneticinizle iletişime geçin.",
    );
  }

  if (!input.name.trim()) throw new Error("Ürün adı zorunludur.");
  if (!input.unit.trim()) throw new Error("Birim zorunludur.");
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("Geçerli bir fiyat giriniz.");
  }

  const payload: ProductInsert = {
    merchant_id: session.merchantId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    price: Number(input.price),
    unit: input.unit.trim(),
    stock_count: input.stock_count ?? null,
    is_available: true,
    image_url: input.image_url?.trim() || null,
    display_order: input.display_order ?? 0,
  };

  assertProductInsertPayload(payload as Record<string, unknown>);

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("products")
    // Payload validated above; cast needed until Supabase Insert inference is regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(payload as any)
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

  revalidatePath("/merchant/products");

  return { success: true, id };
}
