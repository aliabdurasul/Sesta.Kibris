/**
 * Global Product Detail Page — /catalog/[slug]
 * Shows the product and all markets that have it in stock.
 */
import { notFound } from "next/navigation";
import { getProductBySlug, getPriceComparison } from "@/lib/catalog/storefront-queries";
import Link from "next/link";
import Image from "next/image";

/** Guard: only pass valid http/https URLs to next/image. Never throws. */
function safeImage(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };

  return {
    title: `${product.name} Fiyatları ve Marketleri - Sesta Kıbrıs`,
    description: `${product.name} ürününü hangi marketlerin sattığını görün ve fiyatları karşılaştırın.`,
  };
}

export default async function GlobalProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get price comparison across all markets
  const merchants = await getPriceComparison(product.id, ""); // empty currentMerchantId to get all

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      <Link
        href="/catalog"
        className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Kataloğa Dön
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col md:flex-row">
          <div className="relative aspect-square w-full bg-gray-50 md:w-2/5 shrink-0">
            {safeImage(product.image_url) ? (
              <Image
                src={safeImage(product.image_url)!}
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

          <div className="flex flex-1 flex-col p-6 md:p-8">
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
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Satış Yapan Marketler</h2>
        
        {merchants.length === 0 ? (
          <p className="text-gray-500 py-4">Bu ürünü şu an satan aktif market bulunmuyor.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {merchants.map((m) => (
              <div key={m.merchantId} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/market/${m.merchantSlug}`} className="font-semibold text-gray-900 hover:text-blue-600">
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
                      href={`/market/${m.merchantSlug}/product/${product.slug}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Ürüne Git →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
