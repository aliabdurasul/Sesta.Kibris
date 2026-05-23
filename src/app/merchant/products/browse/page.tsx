/**
 * Merchant catalog browser - /merchant/products/browse
 * Task 0.0.19
 */
import { getGlobalCatalog } from "@/lib/catalog/storefront-queries";
import { getMerchantInventory } from "@/lib/catalog/merchant-actions";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { MerchantCatalogBrowser } from "./MerchantCatalogBrowser";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}

export default async function MerchantBrowseCatalogPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.merchantId) return null;

  const sp = await searchParams;
  const page = Number(sp.page ?? "1");

  const [{ products, total, categories }, inventory] = await Promise.all([
    getGlobalCatalog({ search: sp.q, categorySlug: sp.cat, page }),
    getMerchantInventory(session.merchantId),
  ]);

  // Create a Set of product IDs already in inventory for fast lookup
  const existingProductIds = new Set(inventory.map((i) => i.product_id));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/merchant/products" className="text-sm text-gray-400 hover:text-gray-600">
            ← Envanterim
          </Link>
          <span className="text-gray-200">/</span>
          <h2 className="text-xl font-bold text-gray-900">Katalogdan Ekle</h2>
        </div>
        <p className="text-sm text-gray-500">
          Toplam {total} ürün
        </p>
      </div>

      <MerchantCatalogBrowser
        products={products}
        categories={categories}
        existingProductIds={existingProductIds}
        searchParams={{ q: sp.q, cat: sp.cat, page }}
        totalPages={Math.ceil(total / 60)}
      />
    </div>
  );
}
