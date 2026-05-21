"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MARKET_CATEGORIES } from "@/components/landing/CategoryGrid";
import {
  MarketCard,
  type MarketCardMerchant,
} from "@/components/landing/MarketCard";

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

  const categoryLabel = categoryFilter
    ? MARKET_CATEGORIES.find((c) => c.filter === categoryFilter)?.label
    : null;

  return (
    <section id="browse-markets" className="scroll-mt-24 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {categoryLabel ? categoryLabel : "Tüm Marketler"}
          </h2>
          <p className="text-sm text-gray-500">
            {filtered.length} market listeleniyor
          </p>
        </div>
        {categoryFilter && (
          <a
            href="/#browse-markets"
            className="text-sm font-medium text-sesta-blue hover:underline"
          >
            Filtreyi temizle
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          Marketler şu an yüklenemiyor. Lütfen daha sonra tekrar deneyin.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg font-medium text-gray-700">
            {categoryFilter
              ? "Bu kategori için henüz market yok."
              : "Henüz aktif market bulunmuyor."}
          </p>
          <p className="mt-1 text-sm">
            {categoryFilter
              ? "Başka bir kategori deneyin veya tüm marketlere göz atın."
              : "Marketler yönetici tarafından aktifleştirildikten sonra burada görünür."}
          </p>
          {categoryFilter && (
            <a
              href="/#browse-markets"
              className="mt-4 inline-block text-sm font-medium text-sesta-blue underline-offset-4 hover:underline"
            >
              Tüm marketleri göster
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((merchant) => (
            <MarketCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      )}
    </section>
  );
}
