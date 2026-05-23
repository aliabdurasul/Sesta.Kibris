"use client";

/**
 * Single product card.
 * Prices are in kuruş (lowest unit) — displayed as ₺.
 */
import Image from "next/image";
import { AddToCartButton } from "./AddToCartButton";
import type { StorefrontProduct } from "@/types/catalog";

interface ProductCardProps {
  product: StorefrontProduct;
  merchantId: string;
  merchantSlug: string;
}

export function ProductCard({ product, merchantId, merchantSlug }: ProductCardProps) {
  const priceDisplay = `${(product.price / 100).toFixed(2)} ₺`;

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${
        !product.isAvailable ? "opacity-50" : ""
      }`}
    >
      {/* Product image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
            🍽️
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        {product.unit && (
          <span className="mb-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
            {product.unit} {product.brand && `· ${product.brand}`}
          </span>
        )}
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
            {product.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-gray-900">{priceDisplay}</span>
          <AddToCartButton
            product={product}
            merchantId={merchantId}
            merchantSlug={merchantSlug}
          />
        </div>
        {!product.isAvailable && (
          <span className="mt-1 block text-xs text-red-500">Şu an mevcut değil</span>
        )}
      </div>
    </div>
  );
}
