/**
 * /market/[slug] — canonical public SEO URL for marketplace stores.
 *
 * Public: product catalog for active merchants (RLS + is_active).
 * Owner: operational dashboard (order queue) at the same URL (noindex).
 */
import { notFound, permanentRedirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { userOwnsMerchant } from "@/lib/merchant/resolve-slug";
import {
  resolveMarketBySlug,
  type MarketDetail,
} from "@/lib/market/resolve-by-slug";
import {
  getMarketInitials,
  resolveMarketDisplay,
} from "@/lib/market/resolve-display";
import { buildMarketMetadata } from "@/lib/market/seo-metadata";
import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/product/ProductGrid";
import { MerchantOrderQueue } from "@/components/merchant/MerchantOrderQueue";
import { MerchantSlugNav } from "@/components/merchant/MerchantSlugNav";
import { MarketJsonLd } from "@/components/market/MarketJsonLd";
import { log } from "@/lib/logger";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

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

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

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
    log.error("market.products.fetch", {
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
  const resolved = await resolveMarketBySlug(slug, { allowInactive: true });
  if (!resolved) {
    return { title: "Market bulunamadı" };
  }

  const session = await getSession();
  const isOwner =
    session?.role === "merchant" &&
    userOwnsMerchant(session.id, resolved.merchant);

  const display = resolveMarketDisplay(resolved.merchant);

  return buildMarketMetadata({
    name: resolved.merchant.name,
    slug: resolved.canonicalSlug,
    category: resolved.merchant.category,
    merchantId: resolved.merchant.id,
    address: resolveMarketDisplay(resolved.merchant).address ?? undefined,
    coverUrl: display.coverUrl,
    noindex: isOwner,
  });
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  const resolved = await resolveMarketBySlug(slug, { allowInactive: true });

  if (!resolved) {
    notFound();
  }

  if (resolved.isLegacyAlias && resolved.canonicalSlug !== slug) {
    permanentRedirect(`/market/${resolved.canonicalSlug}`);
  }

  const merchantForOwner: MarketDetail = resolved.merchant;
  const canonicalSlug = resolved.canonicalSlug;

  const isOwner =
    session?.role === "merchant" &&
    userOwnsMerchant(session.id, merchantForOwner);

  if (isOwner) {
    const orders = await getActiveOrders(merchantForOwner.id);
    const supabase = await createServerClient();
    const { data: courierRows } = await supabase
      .from("couriers")
      .select("id, full_name, is_available")
      .eq("merchant_id", merchantForOwner.id)
      .eq("is_active", true)
      .order("full_name");

    const merchantCouriers = (courierRows ?? []) as {
      id: string;
      full_name: string | null;
      is_available: boolean;
    }[];

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

        <MerchantSlugNav slug={canonicalSlug} />

        {!merchantForOwner.is_onboarded && (
          <Link
            href="/merchant/profile"
            className="mb-4 block rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 ring-1 ring-blue-200 hover:bg-blue-100"
          >
            Mağaza profilini tamamla → Logo, kapak ve çalışma saatleri
          </Link>
        )}

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
          deliveryMode={
            (merchantForOwner.delivery_mode ?? "PLATFORM_COURIER") as
              | "MERCHANT_DELIVERY"
              | "PLATFORM_COURIER"
              | "HYBRID"
          }
          merchantCouriers={merchantCouriers}
          defaultCourierId={merchantForOwner.default_courier_id ?? null}
        />
      </div>
    );
  }

  if (!merchantForOwner.is_active) {
    notFound();
  }

  const products = await getPublicProducts(merchantForOwner.id);
  const display = resolveMarketDisplay(merchantForOwner);

  return (
    <div>
      <MarketJsonLd
        name={merchantForOwner.name}
        slug={canonicalSlug}
        category={merchantForOwner.category}
        merchantId={merchantForOwner.id}
        address={display.address}
        coverUrl={display.coverUrl}
        description={display.description}
      />

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {display.logoUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-100">
                  <Image
                    src={display.logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-bold text-accent-strong">
                  {getMarketInitials(display.name)}
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900">{display.name}</h1>
            </div>
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
          {display.description && (
            <p className="mt-2 text-sm text-gray-600">{display.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {display.deliveryEtaLabel}
            {display.openingHoursLabel !== "Bilgi yok" &&
              ` · ${display.openingHoursLabel}`}
            {display.minimumOrderLabel &&
              ` · Min. sipariş ${display.minimumOrderLabel}`}
            {display.deliveryFeeLabel && ` · Teslimat ${display.deliveryFeeLabel}`}
          </p>
          {display.address && (
            <p className="mt-1 text-sm text-gray-400">{display.address}</p>
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
          merchantSlug={canonicalSlug}
        />
      )}
    </div>
  );
}
