"use client";

/**
 * Merchant dashboard: Stripe Connect status + enable card payments toggle.
 */
import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { setAcceptsOnlinePayment } from "@/app/merchant/payments/actions";

type ConnectStatus = {
  has_account: boolean;
  status: {
    uiStatus: "pending" | "restricted" | "active";
    readyToReceivePayments: boolean;
    onboardingComplete: boolean;
  } | null;
};

const BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  restricted: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
};

const LABEL: Record<string, string> = {
  pending: "Beklemede",
  restricted: "Kısıtlı",
  active: "Aktif",
};

export function MerchantPaymentsPanel({
  acceptsOnlinePayment,
}: {
  acceptsOnlinePayment: boolean;
}) {
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [cardEnabled, setCardEnabled] = useState(acceptsOnlinePayment);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/status");
      const json = (await res.json()) as ConnectStatus & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Durum alınamadı");
      setConnect(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ready = connect?.status?.readyToReceivePayments ?? false;
  const uiStatus = connect?.status?.uiStatus ?? null;

  async function createAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/connect/create", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Hesap oluşturulamadı");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  async function openOnboarding() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
      });
      const json = (await res.json()) as { url?: string };
      if (!json.url) throw new Error("Onboarding linki alınamadı");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      setBusy(false);
    }
  }

  function onToggle(enabled: boolean) {
    startTransition(async () => {
      const result = await setAcceptsOnlinePayment(enabled);
      if (!result.ok) {
        setError(result.error ?? "Kaydedilemedi");
        return;
      }
      setCardEnabled(enabled);
      setError(null);
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
        <h2 className="font-semibold text-gray-900">Online Ödemeler</h2>
        <p className="mt-1 text-sm text-gray-500">
          Stripe Connect ile kartla ödeme alın. Komisyon platform tarafından otomatik kesilir.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-gray-400">Yükleniyor...</p>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600">Stripe durumu</span>
              {uiStatus ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[uiStatus] ?? BADGE.pending}`}
                >
                  {LABEL[uiStatus] ?? uiStatus}
                </span>
              ) : (
                <span className="text-sm text-gray-400">Bağlı değil</span>
              )}
            </div>

            {!connect?.has_account ? (
              <button
                type="button"
                onClick={() => void createAccount()}
                disabled={busy}
                className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Stripe Bağla
              </button>
            ) : !ready ? (
              <button
                type="button"
                onClick={() => void openOnboarding()}
                disabled={busy}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Onboarding&apos;i Tamamla
              </button>
            ) : (
              <p className="text-sm text-green-700">Ödeme almaya hazırsınız.</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900">Kartla ödeme</p>
            <p className="text-xs text-gray-500">
              Müşteriler checkout&apos;ta kart seçeneğini görür
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={cardEnabled}
            disabled={!ready || pending}
            onClick={() => onToggle(!cardEnabled)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              cardEnabled ? "bg-blue-600" : "bg-gray-300"
            } ${!ready ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span
              className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                cardEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
        {!ready && (
          <p className="mt-2 text-xs text-amber-700">
            Kart ödemelerini açmak için önce Stripe onboarding&apos;i tamamlayın.
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Link href="/connect" className="text-sm text-blue-600 hover:underline">
        Gelişmiş Stripe ayarları →
      </Link>
    </div>
  );
}
