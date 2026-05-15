"use client";

/**
 * Product grid with client-side category filtering.
 * Products are pre-fetched server-side; filtering is purely UI state.
 * "Add to cart" button dispatches to cart store (zustand — installed in Stage 1C).
 * For now, shows a placeholder "Sepete Ekle" that will be wired up in TASK-35.
 */
import { useState } from "react";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  sort_order: number | null;
}

interface ProductGridProps {
  products: Product[];
  merchantId: string;
  merchantSlug: string;
}

export function ProductGrid({ products, merchantId, merchantSlug }: ProductGridProps) {
  // Deduplicate categories preserving order
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category)
        .filter((c): c is string => Boolean(c)),
    ),
  );

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visible =
    activeCategory === null
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <div>
      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="mb-4 -mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product list */}
      <div className="space-y-3">
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            merchantId={merchantId}
            merchantSlug={merchantSlug}
          />
        ))}
      </div>
    </div>
  );
}
