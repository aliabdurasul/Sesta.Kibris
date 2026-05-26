"use client";

/**
 * MIN-LAUNCH: merchants only enable/disable card checkout.
 * No Stripe Connect — all payments go to the platform Stripe account.
 */
import { useState, useTransition } from "react";
import { setAcceptsOnlinePayment } from "@/app/merchant/payments/actions";

export function MerchantPaymentsPanel({
  acceptsOnlinePayment,
  paidOrderCount,
  pendingSettlementKurus,
}: {
  acceptsOnlinePayment: boolean;
  paidOrderCount: number;
  pendingSettlementKurus: number;
}) {
  const [enabled, setEnabled] = useState(acceptsOnlinePayment);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onToggle(next: boolean) {
    startTransition(async () => {
      const result = await setAcceptsOnlinePayment(next);
      if (!result.ok) {
        setError(result.error ?? "Kaydedilemedi");
        return;
      }
      setEnabled(next);
      setError(null);
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
        <h2 className="font-semibold text-gray-900">Kartla ödeme</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kendi Stripe hesabınızı bağlamanıza gerek yok. Müşteri ödemeleri
          SestaKıbrıs platform hesabına gelir; hakedişiniz yönetici tarafından
          manuel ödenir.
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-700">
            Online kartla sipariş al
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={pending}
            onClick={() => onToggle(!enabled)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {enabled ? (
          <p className="mt-3 text-xs text-green-700">
            Açık — müşteriler checkout&apos;ta kart seçeneğini görür.
          </p>
        ) : (
          <p className="mt-3 text-xs text-gray-400">
            Kapalı — sadece kapıda ödeme (COD) kullanılır.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
        <h2 className="font-semibold text-gray-900">Hakediş özeti</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Ödenen kart siparişi</dt>
            <dd className="font-medium">{paidOrderCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Bekleyen hakediş</dt>
            <dd className="font-bold text-gray-900">
              ₺{(pendingSettlementKurus / 100).toFixed(2)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-gray-400">
          Ödeme alındıktan sonra yönetici banka/havale ile hakedişi işler.
        </p>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
