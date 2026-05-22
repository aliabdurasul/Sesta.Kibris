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
    <section id="browse-markets" className="scroll-mt-2 space-y-3 px-4">
      <h2 className="border-b border-border pb-2 text-[15px] font-bold text-brand-navy">
        {categoryLabel
          ? `Yakınındaki Marketler — ${categoryLabel}`
          : "Yakınındaki Marketler"}
      </h2>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
          Marketler yüklenemiyor.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[1.25rem] bg-brand-white py-10 text-center ring-1 ring-border">
          <p className="text-sm font-semibold text-brand-navy">
            {categoryFilter ? "Bu kategoride market yok" : "Henüz market yok"}
          </p>
          {categoryFilter && (
            <a
              href="/#browse-markets"
              className="mt-2 inline-block text-sm font-semibold text-brand-orange"
            >
              Tümünü göster
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <NearbyStoreCard key={m.id} merchant={m} />
          ))}
        </div>
      )}
    </section>
  );
}
