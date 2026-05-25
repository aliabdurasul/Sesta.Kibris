/**
 * SEO Product Page — /market/[slug]/product/[productSlug]
 * Task 0.0.24 & 0.0.25
 * Shows product details and price comparison.
 */
import { notFound, permanentRedirect } from "next/navigation";
import { resolveMarketBySlug } from "@/lib/market/resolve-by-slug";
import { resolveMarketDisplay } from "@/lib/market/resolve-display";
import { getStorefrontProductBySlug, getPriceComparison } from "@/lib/catalog/storefront-queries";
import { buildMarketMetadata } from "@/lib/market/seo-metadata";
import Image from "next/image";
import Link from "next/link";
import { MerchantCartGuard } from "@/components/cart/MerchantCartGuard";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const resolved = await resolveMarketBySlug(slug, { allowInactive: false });
  if (!resolved) return { title: "Ürün bulunamadı" };

  const product = await getStorefrontProductBySlug(resolved.merchant.id, productSlug);
  if (!product) return { title: "Ürün bulunamadı" };

  return buildMarketMetadata({
    name: `${product.name} - ${resolved.merchant.name}`,
    slug: `${resolved.canonicalSlug}/product/${product.slug}`,
    category: resolved.merchant.category,
    merchantId: resolved.merchant.id,
    address: resolveMarketDisplay(resolved.merchant).address ?? undefined,
    coverUrl: sanitizeProductImageUrl(product.imageUrl) ?? undefined,
  });
}

export default async function StorefrontProductPage({ params }: PageProps) {
  const { slug, productSlug } = await params;

  const resolved = await resolveMarketBySlug(slug, { allowInactive: false });
  if (!resolved) {
    notFound();
  }

  if (resolved.isLegacyAlias && resolved.canonicalSlug !== slug) {
    permanentRedirect(`/market/${resolved.canonicalSlug}/product/${productSlug}`);
  }

  const merchant = resolved.merchant;
  const product = await getStorefrontProductBySlug(merchant.id, productSlug);

  if (!product) {
    notFound();
  }

  const priceComparison = await getPriceComparison(product.productId, merchant.id);
  const otherMerchants = priceComparison.filter(p => !p.isCurrentMerchant);
  const safeImageUrl = sanitizeProductImageUrl(product.imageUrl);

  return (
    <MerchantCartGuard merchantId={merchant.id}>
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/market/${merchant.slug}`}
        className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← {merchant.name} Marketine Dön
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative aspect-square w-full bg-gray-50 md:w-2/5 shrink-0">
            {safeImageUrl ? (
              <Image
                src={safeImageUrl}
                alt={product.name}
                fill
                className="object-contain p-4"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl text-gray-200">
                🍽️
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col p-6 md:p-8">
            <div className="mb-2 flex items-center gap-2">
              {product.categoryName && (
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {product.categoryName}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{product.name}</h1>
            
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-1 font-medium">{product.unit}</span>
              {product.brand && <span>Marka: <span className="font-semibold text-gray-900">{product.brand}</span></span>}
            </div>

            {product.description && (
              <p className="mt-6 text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mt-auto pt-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{merchant.name} Fiyatı</p>
                  <div className="text-3xl font-bold text-gray-900">
                    {(product.price / 100).toFixed(2)} ₺
                  </div>
                </div>
                <AddToCartButton
                  product={product}
                  merchantId={merchant.id}
                  merchantSlug={merchant.slug}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task 0.0.25 Price Comparison */}
      {otherMerchants.length > 0 && (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Diğer Marketlerdeki Fiyatlar</h2>
          <div className="divide-y divide-gray-100">
            {otherMerchants.map((m) => (
              <div key={m.merchantId} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/market/${m.merchantSlug}/product/${product.slug}`} className="font-semibold text-gray-900 hover:text-blue-600">
                    {m.merchantName}
                  </Link>
                  {!m.isAvailable && (
                     <p className="text-xs text-red-500 mt-0.5">Şu an stokta yok</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {(m.price / 100).toFixed(2)} ₺
                  </div>
                  {m.isAvailable && (
                    <Link
                      href={`/market/${m.merchantSlug}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Market'e git →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </MerchantCartGuard>
  );
}
