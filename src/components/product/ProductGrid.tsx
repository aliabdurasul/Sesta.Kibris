"use client";

import { ProductCard } from "./ProductCard";
import type { StorefrontProduct } from "@/types/catalog";

interface ProductGridProps {
  products: StorefrontProduct[];
  merchantId: string;
  merchantSlug: string;
  id?: string;
}

/** Mobile-first 2-column grocery grid — equal-height cards. */
export function ProductGrid({
  products,
  merchantId,
  merchantSlug,
  id,
}: ProductGridProps) {
  return (
    <div
      id={id}
      className="grid grid-cols-2 gap-2 sm:gap-2.5"
      role="list"
    >
      {products.map((product) => (
        <div key={product.inventoryId} role="listitem" className="min-h-0">
          <ProductCard
            product={product}
            merchantId={merchantId}
            merchantSlug={merchantSlug}
          />
        </div>
      ))}
    </div>
  );
}
