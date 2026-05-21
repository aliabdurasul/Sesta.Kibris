"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getCategoryLabel } from "@/lib/landing/categories";
import { NearbyStoreCard } from "@/components/landing/NearbyStoreCard";
import type { MarketCardMerchant } from "@/components/landing/MarketCard";

interface MarketBrowseSectionProps {
  merchants: MarketCardMerchant[];
  error: string | null;
}

export function MarketBrowseSection({
  merchants,
  error,
}: MarketBrowseSectionProps) {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const filtered = useMemo(() => {
    if (!categoryFilter) return merchants;
    return merchants.filter((m) => m.category === categoryFilter);
  }, [merchants, categoryFilter]);

  const categoryLabel = getCategoryLabel(categoryFilter);

  return (
    <section id="browse-markets" className="scroll-mt-4 space-y-3 px-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary">
            {categoryLabel ? `Yakınındaki — ${categoryLabel}` : "Yakınındaki marketler"}
          </h2>
          <p className="text-xs text-text-muted">{filtered.length} işletme</p>
        </div>
        {categoryFilter && (
          <a href="/#browse-markets" className="text-xs font-bold text-brand-orange">
            Tümü
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          Marketler yüklenemiyor. Lütfen tekrar deneyin.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[1.5rem] bg-brand-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <p className="font-semibold text-text-primary">
            {categoryFilter ? "Bu kategoride işletme yok" : "Yakında marketler burada"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Farklı bir kategori seç veya daha sonra tekrar dene.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <NearbyStoreCard key={m.id} merchant={m} />
          ))}
        </div>
      )}
    </section>
  );
}
