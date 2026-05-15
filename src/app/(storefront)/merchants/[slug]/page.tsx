/**
 * Merchant detail page — /merchants/[slug]
 * Shows merchant info + full product catalog grouped by category.
 * Server Component. Public — no auth required.
 * Never crashes: all error states handled gracefully.
 */
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product/ProductGrid";
import { log } from "@/lib/logger";
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
  | "is_open"
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
  try {
    const supabase = await createServerClient();

    const merchantRes = await supabase
      .from("merchants")
      .select(
        "id, name, slug, description, logo_url, average_delivery_minutes, minimum_order_amount, is_active, is_open",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (merchantRes.error) {
      log.error("merchant.detail.fetch", {
        slug,
        reason: merchantRes.error.message,
        code: merchantRes.error.code,
      });
      return null;
    }

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

    if (productsRes.error) {
      log.error("merchant.products.fetch", {
        merchantId: merchant.id,
        slug,
        reason: productsRes.error.message,
      });
    }

    return {
      merchant,
      products: (productsRes.data ?? []) as ProductItem[],
    };
  } catch (err) {
    log.error("merchant.detail.unexpected", {
      slug,
      reason: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
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

function formatPrice(kurus: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(kurus / 100);
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
    ? formatPrice(merchant.minimum_order_amount)
    : "Yok";

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">{merchant.name}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              merchant.is_open
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {merchant.is_open ? "Açık" : "Şu an kapalı"}
          </span>
        </div>
        {merchant.description && (
          <p className="mt-1 text-sm text-gray-500">{merchant.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
          <span>🕐 Tahmini teslimat: {deliveryTime}</span>
          <span>🛒 Min. sipariş: {minOrder}</span>
        </div>
        {!merchant.is_open && (
          <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700 ring-1 ring-amber-200">
            Bu restoran şu an siparişe kapalı. Menüyü inceleyebilirsiniz.
          </div>
        )}
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
