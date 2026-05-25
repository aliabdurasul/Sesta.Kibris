"use client";

import Image from "next/image";
import { AddToCartButton } from "./AddToCartButton";
import type { StorefrontProduct } from "@/types/catalog";
import { sanitizeProductImageUrl } from "@/lib/validation/http-url";

interface ProductCardProps {
  product: StorefrontProduct;
  merchantId: string;
  merchantSlug: string;
}

export function ProductCard({
  product,
  merchantId,
  merchantSlug,
}: ProductCardProps) {
  if (!product?.productId) return null;

  const priceDisplay = `₺${(product.price / 100).toFixed(2)}`;
  const safeImageUrl = sanitizeProductImageUrl(product.imageUrl);

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100/80 ${
        !product.isAvailable ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-square w-full bg-gray-50">
        {safeImageUrl ? (
          <Image
            src={safeImageUrl}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 180px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-gray-200">
            🍽️
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-snug text-gray-900">
          {product.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="text-sm font-bold tabular-nums text-gray-900">
            {priceDisplay}
          </span>
          <AddToCartButton
            product={product}
            merchantId={merchantId}
            merchantSlug={merchantSlug}
            compact
          />
        </div>
      </div>
    </article>
  );
}
