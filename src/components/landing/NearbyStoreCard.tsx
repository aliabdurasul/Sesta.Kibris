import Link from "next/link";
import {
  getCategoryTypeLabel,
  getDeliveryEta,
  getStoreThumbnailClass,
} from "@/lib/landing/merchant-visuals";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

export function NearbyStoreCard({ merchant }: { merchant: MarketCardMerchant }) {
  const thumbClass = getStoreThumbnailClass(merchant.category);
  const categoryLabel = getCategoryTypeLabel(merchant.category);
  const eta = getDeliveryEta(merchant.category);
  const rating = merchant.rating ?? 4.8;

  return (
    <article className="flex gap-3 rounded-[1.5rem] bg-brand-white p-3 shadow-[0_8px_28px_rgba(11,42,111,0.07)] ring-1 ring-black/[0.04] transition-shadow active:shadow-lg">
      <div
        className={`h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl ${thumbClass} shadow-inner`}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-text-primary">{merchant.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {merchant.is_open !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    merchant.is_open
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-text-muted"
                  }`}
                >
                  {merchant.is_open ? "Açık" : "Kapalı"}
                </span>
              )}
              <span className="text-[11px] text-text-muted">{categoryLabel}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-brand-navy">★ {rating.toFixed(1)}</p>
          </div>
        </div>

        {merchant.address && (
          <p className="mt-1 line-clamp-1 text-xs text-text-muted">{merchant.address}</p>
        )}
        <p className="mt-1 text-xs font-medium text-brand-orange">{eta} teslimat</p>

        <Link
          href={`/merchants/${merchant.slug}`}
          className="mt-2.5 inline-flex w-full items-center justify-center rounded-xl bg-brand-navy py-2.5 text-sm font-bold text-white transition-colors active:bg-brand-navy/90"
        >
          Mağazaya Git
        </Link>
      </div>
    </article>
  );
}
