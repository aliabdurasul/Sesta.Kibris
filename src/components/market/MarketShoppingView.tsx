"use client";

import { useMemo, useState } from "react";
import { MerchantCartSwitchModal } from "@/components/cart/MerchantCartSwitchModal";
import { useMerchantCartConflict } from "@/components/cart/useMerchantCartConflict";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { StorefrontProduct } from "@/types/catalog";
import { cn } from "@/lib/ui/cn";

interface Props {
  products: StorefrontProduct[];
  merchantId: string;
  merchantSlug: string;
}

type CategoryChip = { id: string; name: string };

function buildCategories(products: StorefrontProduct[]): CategoryChip[] {
  const map = new Map<string, string>();
  for (const p of products) {
    if (p.categoryId && p.categoryName) {
      map.set(p.categoryId, p.categoryName);
    }
  }
  return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );
}

function filterProducts(
  products: StorefrontProduct[],
  search: string,
  categoryId: string | null,
): StorefrontProduct[] {
  const q = search.trim().toLowerCase();
  return products.filter((p) => {
    if (categoryId && p.categoryId !== categoryId) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase().includes(q) ?? false)
    );
  });
}

function groupByCategory(
  products: StorefrontProduct[],
): { name: string; products: StorefrontProduct[] }[] {
  const groups = new Map<string, StorefrontProduct[]>();
  const uncategorized: StorefrontProduct[] = [];

  for (const p of products) {
    if (!p.categoryName) {
      uncategorized.push(p);
      continue;
    }
    const list = groups.get(p.categoryName) ?? [];
    list.push(p);
    groups.set(p.categoryName, list);
  }

  const sections = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b, "tr"))
    .map(([name, items]) => ({ name, products: items }));

  if (uncategorized.length > 0) {
    sections.push({ name: "Diğer", products: uncategorized });
  }

  return sections;
}

export function MarketShoppingView({
  products,
  merchantId,
  merchantSlug,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const categories = useMemo(() => buildCategories(products), [products]);
  const filtered = useMemo(
    () => filterProducts(products, search, categoryId),
    [products, search, categoryId],
  );

  const showGrouped =
    !search.trim() && categoryId === null && categories.length > 0;
  const sections = useMemo(
    () => (showGrouped ? groupByCategory(filtered) : []),
    [showGrouped, filtered],
  );

  const { open, dismiss, continueSwitch } = useMerchantCartConflict(merchantId);

  return (
    <div className="market-shopping space-y-3">
      <MerchantCartSwitchModal
        open={open}
        onCancel={dismiss}
        onContinue={continueSwitch}
      />

      <div className="sticky top-0 z-10 -mx-1 bg-app-bg/95 px-1 pb-2 pt-0.5 backdrop-blur-sm">
        <label className="sr-only" htmlFor="market-product-search">
          Ürün ara
        </label>
        <input
          id="market-product-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ürün ara…"
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong/20"
          autoComplete="off"
        />

        {categories.length > 0 && (
          <div
            className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Kategoriler"
          >
            <button
              type="button"
              role="tab"
              aria-selected={categoryId === null}
              onClick={() => setCategoryId(null)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                categoryId === null
                  ? "bg-brand-navy text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200",
              )}
            >
              Tümü
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={categoryId === cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  categoryId === cat.id
                    ? "bg-brand-navy text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-gray-100">
          {search || categoryId
            ? "Aramanıza uygun ürün bulunamadı."
            : "Bu marketin şu an aktif ürünü bulunmuyor."}
        </div>
      ) : showGrouped && sections.length > 1 ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.name}>
              <h2 className="mb-2 px-0.5 text-sm font-bold text-gray-800">
                {section.name}
              </h2>
              <ProductGrid
                products={section.products}
                merchantId={merchantId}
                merchantSlug={merchantSlug}
              />
            </section>
          ))}
        </div>
      ) : (
        <ProductGrid
          products={filtered}
          merchantId={merchantId}
          merchantSlug={merchantSlug}
        />
      )}
    </div>
  );
}
