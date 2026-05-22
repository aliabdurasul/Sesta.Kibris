import Image from "next/image";
import Link from "next/link";
import { getMarketInitials } from "@/lib/market/resolve-display";
import type { MarketCardMerchant } from "@/lib/merchants/list-public";

export function NearbyStoreCard({ merchant }: { merchant: MarketCardMerchant }) {
  const { display } = merchant;
  const isOpen = display.isOpen;
  const showCompletingBadge = !display.isOnboarded;

  return (
    <article className="overflow-hidden rounded-[1.125rem] bg-brand-white ring-1 ring-border">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-app-bg">
        <Image
          src={display.coverUrl}
          alt=""
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover"
          priority={false}
          unoptimized={display.coverUrl.startsWith("http")}
        />
        {showCompletingBadge && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand-navy ring-1 ring-border">
            Profil tamamlanıyor
          </span>
        )}
      </div>

      <div className="px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          {display.logoUrl ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
              <Image
                src={display.logoUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized={display.logoUrl.startsWith("http")}
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent-strong">
              {getMarketInitials(display.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-[15px] font-semibold text-brand-navy">
                {display.name}
              </h3>
              {merchant.is_open !== undefined && (
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {isOpen ? "Açık" : "Kapalı"}
                </span>
              )}
            </div>

            {display.description && (
              <p className="mt-1 line-clamp-2 text-xs text-brand-navy/80">
                {display.description}
              </p>
            )}

            <p className="mt-0.5 text-xs text-text-muted">
              {merchant.rating != null && (
                <span className="font-medium text-amber-600">
                  ★ {merchant.rating.toFixed(1)} •{" "}
                </span>
              )}
              {display.deliveryEtaLabel}
              {display.openingHoursLabel !== "Bilgi yok" && (
                <span> • {display.openingHoursLabel}</span>
              )}
              {display.minimumOrderLabel && (
                <span> • Min. {display.minimumOrderLabel}</span>
              )}
              {display.deliveryFeeLabel && (
                <span> • Teslimat {display.deliveryFeeLabel}</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex justify-end">
          <Link
            href={`/market/${merchant.slug}`}
            className="rounded-full border border-border bg-brand-white px-3.5 py-1.5 text-xs font-semibold text-brand-navy transition-colors hover:border-accent hover:text-accent-strong active:bg-accent-soft"
          >
            Git →
          </Link>
        </div>
      </div>
    </article>
  );
}
