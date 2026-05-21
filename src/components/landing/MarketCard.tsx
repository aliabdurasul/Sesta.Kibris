import Link from "next/link";

export interface MarketCardMerchant {
  id: string;
  name: string;
  slug: string;
  category?: string;
  is_open?: boolean;
  address?: string | null;
  rating?: number | null;
  distanceKm?: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  grocery: "Market / Gıda",
  water: "Su",
  gas: "Gaz",
  restaurant: "Restoran",
  cafe: "Kafe",
  local: "Yerel Dükkan",
  pharmacy: "Eczane",
  electronics: "Elektronik",
};

export function MarketCard({ merchant }: { merchant: MarketCardMerchant }) {
  const categoryLabel = merchant.category
    ? (CATEGORY_LABELS[merchant.category] ?? merchant.category)
    : null;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
      <div className="flex gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sesta-navy to-sesta-blue text-2xl text-white">
          🏪
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">
              {merchant.name}
            </h3>
            {merchant.is_open !== undefined && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  merchant.is_open
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {merchant.is_open ? "Açık" : "Kapalı"}
              </span>
            )}
          </div>

          {categoryLabel && (
            <p className="mt-0.5 text-sm text-gray-500">{categoryLabel}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {merchant.rating != null && (
              <span className="font-medium text-amber-600">
                ★ {merchant.rating.toFixed(1)}
              </span>
            )}
            {merchant.distanceKm != null && (
              <span>{merchant.distanceKm.toFixed(1)} km</span>
            )}
            {merchant.address && !merchant.distanceKm && (
              <span className="truncate">{merchant.address}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 px-4 py-3">
        <Link
          href={`/merchants/${merchant.slug}`}
          className="flex w-full items-center justify-center rounded-xl bg-sesta-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sesta-navy/90"
        >
          Mağazayı Ziyaret Et
        </Link>
      </div>
    </article>
  );
}
