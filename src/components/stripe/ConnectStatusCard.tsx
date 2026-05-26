"use client";

/**
 * Merchant Connect onboarding UI — always refetches live status from our API
 * (which calls Stripe), never from a cached DB flag.
 */
import { useCallback, useEffect, useState } from "react";

type ConnectStatus = {
  has_account: boolean;
  status: {
    stripeAccountId: string;
    onboardingComplete: boolean;
    readyToReceivePayments: boolean;
    uiStatus: "pending" | "restricted" | "active";
    transfersStatus: string | null;
    requirementsSummary: string | null;
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

export function ConnectStatusCard() {
  const [data, setData] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/status");
      const json = (await res.json()) as ConnectStatus & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Status failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/connect/create", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Create failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hesap oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  async function openOnboarding() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/connect/onboarding", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Link failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onboarding başlatılamadı");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <p className="text-sm text-gray-500">Stripe durumu yükleniyor…</p>
      </div>
    );
  }

  const ui = data?.status?.uiStatus ?? "pending";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">Online ödeme (Stripe)</h1>
        {data?.has_account && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[ui]}`}>
            {LABEL[ui] ?? ui}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Kart ile ödeme almak için Stripe Express hesabınızı bağlayın. MVP: ödeme anında
        markete aktarılır (destination charge); tam GRANITE muhasebe sistemi sonra gelecek.
      </p>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!data?.has_account ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void createAccount()}
          className="w-full rounded-xl bg-accent-strong py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Stripe hesabı oluştur
        </button>
      ) : (
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Hesap:</span>{" "}
            <code className="text-xs">{data.status?.stripeAccountId}</code>
          </p>
          <p>
            <span className="font-medium">Transferler:</span>{" "}
            {data.status?.transfersStatus ?? "—"}
          </p>
          {data.status?.requirementsSummary && (
            <p className="text-amber-700">{data.status.requirementsSummary}</p>
          )}
          {!data.status?.readyToReceivePayments && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void openOnboarding()}
              className="mt-2 w-full rounded-xl bg-brand-navy py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Stripe onboarding tamamla
            </button>
          )}
          {data.status?.readyToReceivePayments && (
            <p className="font-medium text-green-700">
              Kart ödemeleri aktif — ürün ekleyip vitrinde satabilirsiniz.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
