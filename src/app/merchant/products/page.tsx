/**
 * Merchant product management — /merchant/products
 * Lists all products for this merchant. Add/edit/toggle availability.
 */
import { requireRole } from "@/lib/auth";
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
    .select("id, name, description, price, category, is_available, sort_order")
    .eq("merchant_id", merchant.id)
    .order("category")
    .order("sort_order");

  const products = (productsData ?? []) as Pick<
    ProductRow,
    "id" | "name" | "description" | "price" | "category" | "is_available" | "sort_order"
  >[];

  return { merchantId: merchant.id, products };
}

export default async function MerchantProductsPage() {
  const session = await requireRole("merchant");
  const { merchantId, products } = await getMerchantProducts(session.id);

  if (!merchantId) {
    return (
        Market kaydınız bulunamadı.
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Ürün Yönetimi</h2>
      <ProductManager initialProducts={products} merchantId={merchantId} />
    </div>
  );
}
