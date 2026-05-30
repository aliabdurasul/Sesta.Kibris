"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolvePromoImageUrl } from "@/lib/storage/promo-banner";
import {
  adminDeletePromo,
  adminSetPromoActive,
} from "@/lib/promos/admin-actions";
import type { HomepagePromoWithMarket } from "@/types/promo";

export function AdminPromoList({ promos }: { promos: HomepagePromoWithMarket[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setActionError(result.error ?? "İşlem başarısız.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100">
        {promos.map((promo) => {
          const thumb = resolvePromoImageUrl(promo.image_url);
          return (
            <li
              key={promo.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      Görsel yok
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {promo.title}
                  </p>
                  {promo.subtitle && (
                    <p className="truncate text-sm text-gray-500">
                      {promo.subtitle}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    → {promo.market_name}{" "}
                    <span className="text-gray-300">·</span> sıra {promo.sort_order}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    promo.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {promo.is_active ? "Aktif" : "Pasif"}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(() => adminSetPromoActive(promo.id, !promo.is_active))
                  }
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {promo.is_active ? "Kapat" : "Aç"}
                </button>
                <Link
                  href={`/admin/promos/${promo.id}/edit`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                >
                  Düzenle
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (
                      !confirm(
                        `"${promo.title}" kampanyasını silmek istediğinize emin misiniz?`,
                      )
                    ) {
                      return;
                    }
                    run(() => adminDeletePromo(promo.id));
                  }}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
