"use client";

/**
 * Single product card.
 * Prices are in kuruş (lowest unit) — displayed as ₺.
 *
 * SAFETY: imageUrl is validated before passing to next/image.
 * Invalid URLs (storage keys, base64, etc.) are treated as null → fallback UI.
 */
import Image from "next/image";
import { AddToCartButton } from "./AddToCartButton";
import type { StorefrontProduct } from "@/types/catalog";

/** Returns true only for valid http/https URLs. Never throws. */
function isValidHttpUrl(value?: string | null): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface ProductCardProps {
  product: StorefrontProduct;
  merchantId: string;
  merchantSlug: string;
}

export function ProductCard({ product, merchantId, merchantSlug }: ProductCardProps) {
  // Guard: skip render entirely if product data is invalid
  if (!product?.productId) return null;

  const priceDisplay = `${(product.price / 100).toFixed(2)} ₺`;
  // Normalize imageUrl — only pass valid http/https URLs to next/image
  const safeImageUrl = isValidHttpUrl(product.imageUrl) ? product.imageUrl : null;

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${
        !product.isAvailable ? "opacity-50" : ""
      }`}
    >
      {/* Product image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {safeImageUrl ? (
          <Image
            src={safeImageUrl}
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
