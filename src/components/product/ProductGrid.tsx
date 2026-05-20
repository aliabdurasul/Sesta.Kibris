"use client";

/**
 * Product grid — flat list ordered by display_order (server-side).
 */
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
}

interface ProductGridProps {
  products: Product[];
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
          key={product.id}
          product={product}
          merchantId={merchantId}
          merchantSlug={merchantSlug}
        />
      ))}
    </div>
  );
}
