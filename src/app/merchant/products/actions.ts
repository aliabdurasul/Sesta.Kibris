"use server";

/**
 * Server Actions for merchant product management.
 *
 * WHY SERVER ACTION for createProduct (not direct client insert):
 *   - products.unit is NOT NULL in schema — must always be provided
 *   - Browser client inserts bypass this guarantee if form state is inconsistent
 *   - Server action validates before insert and throws a typed error the UI can catch
 *   - merchantId is resolved from the authenticated session — never trusted from client
 *
 * Security:
 *   requireRole("merchant") enforces auth on every call.
 *   merchant_id is always session.merchantId — not a client-supplied value.
 */
import { requireRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export interface CreateProductInput {
  name: string;
  /** Price in smallest currency unit (kuruş). Must be > 0. */
  price: number;
  /** Unit label. Required — DB column is NOT NULL. Defaults to "piece" on client. */
  unit: string;
  description?: string;
  category?: string;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<{ success: true; id: string }> {
  // Auth guard — resolves merchantId from session
  const session = await requireRole("merchant");

  if (!session.merchantId) {
    throw new Error(
      "Merchant kaydı bulunamadı. Lütfen yöneticinizle iletişime geçin.",
    );
  }

  // Validate required fields before hitting DB
  if (!input.name.trim()) {
    throw new Error("Ürün adı zorunludur.");
  }
  if (!input.unit.trim()) {
    throw new Error("Birim zorunludur.");
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("Geçerli bir fiyat giriniz.");
  }

  const supabase = await createServerClient();

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Ürün eklenemedi: ${error.message}`);
  }

  if (!data) {
    throw new Error("Ürün oluşturuldu ancak ID doğrulanamadı.");
  }

  return { success: true, id: (data as { id: string }).id };
}
