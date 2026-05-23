"use client";

/**
 * Product grid — flat list ordered by display_order (server-side).
 */
import { ProductCard } from "./ProductCard";

import type { StorefrontProduct } from "@/types/catalog";

interface ProductGridProps {
  products: StorefrontProduct[];
  merchantId: string;
  merchantSlug: string;
}

export function ProductGrid({
  products,
  merchantId,
  merchantSlug,
}: ProductGridProps) {
  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCard
          key={product.inventoryId}
          product={product}
          merchantId={merchantId}
          merchantSlug={merchantSlug}
        />
      ))}
    </div>
  );
}
