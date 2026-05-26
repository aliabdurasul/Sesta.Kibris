/**
 * Admin finance MVP — observability only (not GRANITE ledger).
 */
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { unwrapRelated } from "@/lib/stripe/db-helpers";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  await requireRole("admin");
  const admin = createStripeAdminClient();

  const [
    { data: merchants },
    { data: recentPayments },
    { data: failedPayments },
    { data: revenueRows },
  ] = await Promise.all([
    admin
      .from("merchant_stripe_accounts")
      .select(
        "stripe_account_id, merchant_id, merchants(name, slug, accepts_online_payment)",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("id, total_amount, payment_status, commission_amount, created_at, merchants(name)")
      .eq("payment_method", "card")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("orders")
      .select("id, total_amount, payment_status, created_at, merchants(name)")
      .eq("payment_method", "card")
      .eq("payment_status", "failed")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("orders")
      .select("commission_amount")
      .eq("payment_method", "card")
      .eq("payment_status", "paid"),
  ]);

  const platformRevenueKurus = (revenueRows ?? []).reduce(
    (sum, row) => sum + ((row.commission_amount as number) ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Finans (MVP)</h1>
        <p className="text-sm text-gray-500">
          Bağlı marketler ve kart ödemeleri — muhasebe / mutabakat değil.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-2 font-semibold">Platform geliri (tahmini)</h2>
        <p className="text-2xl font-bold text-gray-900">
          ₺{(platformRevenueKurus / 100).toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">
          Ödenmiş kart siparişlerindeki uygulama komisyonu toplamı (%10)
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Bağlı marketler</h2>
        {!merchants?.length ? (
          <p className="text-sm text-gray-400">Henüz bağlı market yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {merchants.map((m) => {
              const merch = unwrapRelated(
                m.merchants as
                  | { name: string; slug: string; accepts_online_payment: boolean }
                  | { name: string; slug: string; accepts_online_payment: boolean }[]
                  | null,
              );
              return (
                <li
                  key={m.stripe_account_id as string}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{merch?.name ?? m.merchant_id}</span>
                  <span className="text-xs text-gray-500">
                    Kart: {merch?.accepts_online_payment ? "Açık" : "Kapalı"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Son kart ödemeleri</h2>
        <ul className="space-y-1 text-sm">
          {(recentPayments ?? []).map((o) => (
            <li key={o.id as string} className="flex justify-between gap-2">
              <span>
                {unwrapRelated(
                  o.merchants as { name: string } | { name: string }[] | null,
                )?.name ?? "—"}
              </span>
              <span className="text-gray-600">
                {o.payment_status as string} · ₺
                {((o.total_amount as number) / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Başarısız ödemeler</h2>
        {!failedPayments?.length ? (
          <p className="text-sm text-gray-400">Kayıt yok.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {failedPayments.map((o) => (
              <li key={o.id as string} className="flex justify-between gap-2">
                <span className="font-mono text-xs">{o.id as string}</span>
                <span>₺{((o.total_amount as number) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/admin/stripe" className="text-sm text-blue-600 hover:underline">
        Stripe webhook logları →
      </Link>
    </div>
  );
}
