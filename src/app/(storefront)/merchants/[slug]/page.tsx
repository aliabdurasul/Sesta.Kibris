/**
 * Merchant detail page — /merchants/[slug]
 * Shows merchant info + full product catalog grouped by category.
 * Server Component. Public — no auth required.
 */
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Database } from "@/types/database";

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type MerchantDetail = Pick<
  MerchantRow,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "logo_url"
  | "average_delivery_minutes"
  | "minimum_order_amount"
  | "is_active"
>;

type ProductItem = Pick<
  ProductRow,
  | "id"
  | "name"
  | "description"
  | "price"
  | "image_url"
  | "category"
  | "is_available"
  | "sort_order"
>;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getMerchantWithProducts(slug: string) {
  const supabase = await createServerClient();

  const merchantRes = await supabase
    .from("merchants")
    .select(
      "id, name, slug, description, logo_url, average_delivery_minutes, minimum_order_amount, is_active",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const merchant = merchantRes.data as MerchantDetail | null;
  if (!merchant) return null;

  const productsRes = await supabase
    .from("products")
    .select(
      "id, name, description, price, image_url, category, is_available, sort_order",
    )
    .eq("merchant_id", merchant.id)
    .eq("is_available", true)
    .order("category")
    .order("sort_order");

  if (productsRes.error)
    throw new Error(`Failed to load products: ${productsRes.error.message}`);

  return {
    merchant,
    products: (productsRes.data ?? []) as ProductItem[],
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await getMerchantWithProducts(slug);
  return {
    title: data
      ? `${data.merchant.name} — SestaKıbrıs`
      : "Restoran bulunamadı",
  };
}

export default async function MerchantDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getMerchantWithProducts(slug);

  if (!data) notFound();

  const { merchant, products } = data;

  const deliveryTime = merchant.average_delivery_minutes
    ? `~${merchant.average_delivery_minutes} dakika`
    : "Belirtilmemiş";

  const minOrder = merchant.minimum_order_amount
    ? `${(merchant.minimum_order_amount / 100).toFixed(0)} ₺`
    : "Yok";

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h1 className="text-xl font-bold text-gray-900">{merchant.name}</h1>
        {merchant.description && (
          <p className="mt-1 text-sm text-gray-500">{merchant.description}</p>
        )}
        <div className="mt-3 flex gap-4 text-xs text-gray-400">
          <span>🕐 Tahmini teslimat: {deliveryTime}</span>
          <span>🛒 Min. sipariş: {minOrder}</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p>Bu restoranın şu an aktif ürünü bulunmuyor.</p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          merchantId={merchant.id}
          merchantSlug={merchant.slug}
        />
      )}
    </div>
  );
}
