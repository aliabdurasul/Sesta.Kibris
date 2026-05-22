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
  const isOpen = merchant.is_open !== false;

  return (
    <article className="overflow-hidden rounded-[1.25rem] bg-brand-white shadow-[0_4px_16px_rgba(16,24,40,0.06)] ring-1 ring-border transition-shadow active:shadow-md">
      <div className={`h-24 w-full ${thumbClass}`} aria-hidden />

      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[15px] font-bold text-brand-navy">
            {merchant.name}
          </h3>
          {merchant.is_open !== undefined && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isOpen ? "Açık" : "Kapalı"}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-text-muted">
          {categoryLabel} • ★{rating.toFixed(1)}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-secondary">{eta}</span>
          <Link
            href={`/merchants/${merchant.slug}`}
            className="shrink-0 rounded-full bg-brand-navy px-3.5 py-1.5 text-xs font-bold text-white transition-colors active:bg-brand-navy/90"
          >
            Git →
          </Link>
        </div>
      </div>
    </article>
  );
}
