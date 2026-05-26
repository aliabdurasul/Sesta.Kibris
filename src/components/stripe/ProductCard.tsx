"use client";

import { CheckoutButton } from "./CheckoutButton";
import { formatTryFromKurus } from "@/lib/stripe/helpers";

export interface StripeStorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  unit_amount: number;
  merchant_id: string;
  merchants?: { name: string } | null;
}

export function StripeProductCard({ product }: { product: StripeStorefrontProduct }) {
  const merchantName =
    product.merchants && typeof product.merchants === "object"
      ? product.merchants.name
      : "Market";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex aspect-square items-center justify-center bg-gray-50 text-3xl text-gray-200">
        🛒
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-xs text-gray-500">{merchantName}</p>
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-xs text-gray-500">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-bold text-gray-900">
            ₺{formatTryFromKurus(product.unit_amount)}
          </span>
          <CheckoutButton productId={product.id} />
        </div>
      </div>
    </article>
  );
}
