/**
 * Merchant product management — /merchant/products
 * Lists all products for this merchant. Add/edit/toggle availability.
 */
import { getSession } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { ProductManager } from "@/components/merchant/ProductManager";

import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

async function getMerchantProducts(userId: string) {
  const supabase = await createServerClient();
  const { data: merchantData } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const merchant = merchantData as Pick<MerchantRow, "id"> | null;
  if (!merchant) return { merchantId: null, products: [] };

  const { data: productsData } = await supabase
    .from("products")
    .select(
      "id, name, description, price, unit, is_available, display_order, stock_count",
    )
    .eq("merchant_id", merchant.id)
    .order("display_order");

  const products = (productsData ?? []) as Pick<
    ProductRow,
    | "id"
    | "name"
    | "description"
    | "price"
    | "unit"
    | "is_available"
    | "display_order"
    | "stock_count"
  >[];


  return { merchantId: merchant.id, products };
}

export default async function MerchantProductsPage() {
  // Layout already enforces requireRole("merchant") — no second check needed.
  const session = await getSession();
  if (!session) return null;
  const { merchantId, products } = await getMerchantProducts(session.id);

  if (!merchantId) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p>Market kaydınız bulunamadı.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Ürün Yönetimi</h2>
      <ProductManager initialProducts={products} merchantId={merchantId} />
    </div>
  );
}
