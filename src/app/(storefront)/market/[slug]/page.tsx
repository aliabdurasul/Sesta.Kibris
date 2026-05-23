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
import {
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
} from "@/lib/market/whatsapp";
import { buildMarketMetadata } from "@/lib/market/seo-metadata";
import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/product/ProductGrid";
import { MerchantOrderQueue } from "@/components/merchant/MerchantOrderQueue";
import { MerchantSlugNav } from "@/components/merchant/MerchantSlugNav";
import { MarketJsonLd } from "@/components/market/MarketJsonLd";
import { log } from "@/lib/logger";
import { sanitizeImageSrc } from "@/lib/validation/http-url";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

import { getStorefrontProducts } from "@/lib/catalog/storefront-queries";

import type { ActiveOrder } from "@/types/order";

async function getActiveOrders(merchantId: string): Promise<ActiveOrder[]> {
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

  return (data ?? []) as ActiveOrder[];
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

  const products = await getStorefrontProducts(merchantForOwner.id);
  const display = resolveMarketDisplay(merchantForOwner);
  const safeLogoUrl = sanitizeImageSrc(display.logoUrl);
  const whatsappUrl = merchantForOwner.whatsapp_phone
    ? buildWhatsAppUrl(merchantForOwner.whatsapp_phone)
    : null;

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
              {safeLogoUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-100">
                  <Image
                    src={safeLogoUrl}
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
          {whatsappUrl && merchantForOwner.whatsapp_phone && (
            <p className="mt-2.5 border-t border-gray-100 pt-2.5 text-xs text-gray-500">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-[#128C7E]"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-[#25D366]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>
                  {formatWhatsAppDisplay(merchantForOwner.whatsapp_phone)}
                </span>
              </a>
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
          merchantSlug={canonicalSlug}
        />
      )}
    </div>
  );
}
