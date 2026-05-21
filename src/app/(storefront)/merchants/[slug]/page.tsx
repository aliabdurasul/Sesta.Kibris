/**
 * /merchants/[slug]
 *
 * Public: product catalog for active merchants (RLS + is_active).
 * Owner: operational dashboard (order queue) at the same canonical URL.
 */
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { userOwnsMerchant } from "@/lib/merchant/resolve-slug";
import { ProductGrid } from "@/components/product/ProductGrid";
import { MerchantOrderQueue } from "@/components/merchant/MerchantOrderQueue";
import { MerchantSlugNav } from "@/components/merchant/MerchantSlugNav";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

type MerchantDetail = Pick<
  MerchantRow,
  | "id"
  | "name"
  | "slug"
  | "user_id"
  | "owner_user_id"
  | "category"
  | "address"
  | "phone"
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
  | "is_available"
  | "display_order"
>;

async function getActiveOrders(merchantId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, total_amount, delivery_address, customer_notes, created_at,
       order_items(id, quantity, unit_price, product_name, line_total)`,
    )
    .eq("merchant_id", merchantId)
    .in("status", ["PENDING", "CONFIRMED", "READY"])
    .order("created_at", { ascending: true });

  return (data ?? []) as (Pick<
    OrderRow,
    | "id"
    | "status"
    | "total_amount"
    | "delivery_address"
    | "customer_notes"
    | "created_at"
  > & {
    order_items: Pick<
      OrderItemRow,
      "id" | "quantity" | "unit_price" | "product_name" | "line_total"
    >[];
  })[];
}

async function getMerchantBySlug(
  slug: string,
  options: { allowInactive: boolean },
): Promise<MerchantDetail | null> {
  const supabase = await createServerClient();

  let query = supabase
    .from("merchants")
    .select(
      "id, name, slug, user_id, owner_user_id, category, address, phone, is_active, is_open",
    )
    .eq("slug", slug);

  if (!options.allowInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    log.error("merchant.detail.fetch", {
      slug,
      reason: error.message,
      code: error.code,
    });
    return null;
  }

  return (data as MerchantDetail | null) ?? null;
}

async function getPublicProducts(merchantId: string): Promise<ProductItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, price, image_url, is_available, display_order",
    )
    .eq("merchant_id", merchantId)
    .eq("is_available", true)
    .order("display_order");

  if (error) {
    log.error("merchant.products.fetch", {
      merchantId,
      reason: error.message,
    });
    return [];
  }

  return (data ?? []) as ProductItem[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug, { allowInactive: true });
  return {
    title: merchant
      ? `${merchant.name} — SestaKıbrıs`
      : "Market bulunamadı",
  };
}

export default async function MerchantDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  const merchantForOwner = await getMerchantBySlug(slug, {
    allowInactive: true,
  });

  if (!merchantForOwner) {
    notFound();
  }

  const isOwner =
    session?.role === "merchant" &&
    userOwnsMerchant(session.id, merchantForOwner);

  if (isOwner) {
    const orders = await getActiveOrders(merchantForOwner.id);

    return (
      <div>
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs text-gray-400">Market Paneli</p>
          <h1 className="text-xl font-bold text-gray-900">
            {merchantForOwner.name}
          </h1>
          {!merchantForOwner.is_active && (
            <p className="mt-2 text-sm text-amber-700">
              İşletmeniz henüz herkese açık değil (pasif). Yönetici
              aktifleştirmesini bekleyin.
            </p>
          )}
        </div>

        <MerchantSlugNav slug={slug} />

        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Aktif Siparişler
          {orders.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-700">
              {orders.length}
            </span>
          )}
        </h2>

        <MerchantOrderQueue
          initialOrders={orders}
          merchantId={merchantForOwner.id}
        />
      </div>
    );
  }

  if (!merchantForOwner.is_active) {
    notFound();
  }

  const products = await getPublicProducts(merchantForOwner.id);

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            {merchantForOwner.name}
          </h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              merchantForOwner.is_open
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {merchantForOwner.is_open ? "Açık" : "Şu an kapalı"}
          </span>
        </div>
        {merchantForOwner.address && (
          <p className="mt-1 text-sm text-gray-500">
            {merchantForOwner.address}
          </p>
        )}
        {!merchantForOwner.is_open && (
          <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700 ring-1 ring-amber-200">
            Bu market şu an siparişe kapalı. Menüyü inceleyebilirsiniz.
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p>Bu marketin şu an aktif ürünü bulunmuyor.</p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          merchantId={merchantForOwner.id}
          merchantSlug={merchantForOwner.slug}
        />
      )}
    </div>
  );
}
