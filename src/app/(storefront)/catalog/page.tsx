/**
 * Global Catalog Directory — /catalog
 * Task 0.0.26
 * Lists all active global products and categorizes them.
 * Clicking a product shows which markets have it (via the price comparison helper).
 */
import { getGlobalCatalog, getPriceComparison } from "@/lib/catalog/storefront-queries";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: "Ürün Kataloğu - Sesta Kıbrıs",
  description: "Tüm ürünleri inceleyin, fiyatları karşılaştırın ve size en uygun marketi bulun.",
};

export default async function GlobalCatalogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;

  const { products, categories, total } = await getGlobalCatalog({
    search: q,
    categorySlug: category,
    page,
    pageSize: 48,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Ürün Kataloğu</h1>
        <p className="mt-3 text-lg text-gray-500">
          Binlerce ürünü inceleyin, fiyatları karşılaştırın.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Filters */}
        <div className="w-full shrink-0 md:w-64">
          <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 font-bold text-gray-900">Kategoriler</h2>
            <div className="flex flex-col space-y-1">
              <Link
                href="/catalog"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  !category
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Tüm Ürünler
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/catalog?category=${c.slug}`}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    category === c.slug
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{total}</span> ürün bulundu
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-gray-500 font-medium">Bu kategoride ürün bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/catalog/${product.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-blue-100"
                >
                  <div className="relative aspect-square w-full bg-gray-50">
                    {sanitizeProductImageUrl(product.image_url) ? (
                      <Image
                        src={sanitizeProductImageUrl(product.image_url)!}
                        alt={product.name}
                        fill
                        className="object-contain p-4 transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl text-gray-200">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-600">
                      {product.name}
                    </h3>
                    <div className="mt-1 text-xs text-gray-500">
                      {product.unit} {product.brand && `· ${product.brand}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
