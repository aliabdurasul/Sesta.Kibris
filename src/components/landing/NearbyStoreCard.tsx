import Image from "next/image";
import Link from "next/link";
import { getDeliveryEta } from "@/lib/landing/merchant-visuals";
import { getMarketCoverImage } from "@/lib/landing/market-images";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

export function NearbyStoreCard({ merchant }: { merchant: MarketCardMerchant }) {
  const eta = getDeliveryEta(merchant.category);
  const rating = merchant.rating ?? 4.8;
  const isOpen = merchant.is_open !== false;
  const coverSrc = getMarketCoverImage(merchant.category, merchant.id);

  return (
    <article className="overflow-hidden rounded-[1.125rem] bg-brand-white ring-1 ring-border">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-app-bg">
        <Image
          src={coverSrc}
          alt=""
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover"
          priority={false}
        />
      </div>

      <div className="px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold text-brand-navy">
            {merchant.name}
          </h3>
          {merchant.is_open !== undefined && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isOpen ? "Açık" : "Kapalı"}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-text-muted">
          ★ {rating.toFixed(1)} • {eta}
        </p>

        <div className="mt-2.5 flex justify-end">
          <Link
            href={`/merchants/${merchant.slug}`}
            className="rounded-full border border-border bg-brand-white px-3.5 py-1.5 text-xs font-semibold text-brand-navy transition-colors hover:border-accent hover:text-accent-strong active:bg-accent-soft"
          >
            Git →
          </Link>
        </div>
      </div>
    </article>
  );
}
