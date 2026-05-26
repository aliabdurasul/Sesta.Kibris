/**
 * Admin: minimal Stripe Connect observability (MVP).
 */
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { unwrapRelated } from "@/lib/stripe/db-helpers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminStripePage() {
  await requireRole("admin");
  const admin = createStripeAdminClient();

  const [{ data: accounts }, { data: events }, { data: cardOrders }] =
    await Promise.all([
      admin
        .from("merchant_stripe_accounts")
        .select("merchant_id, stripe_account_id, created_at, merchants(name, slug)")
        .order("created_at", { ascending: false }),
      admin
        .from("stripe_webhook_events")
        .select("stripe_event_id, event_type, processed_at, last_error, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("orders")
        .select("id, payment_status, total_amount, created_at, merchants(name)")
        .eq("payment_method", "card")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Stripe MVP</h1>
        <p className="text-sm text-gray-500">
          Operasyonel görünürlük — tam GRANITE muhasebe değil.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Bağlı marketler</h2>
        {!accounts?.length ? (
          <p className="text-sm text-gray-400">Henüz Connect hesabı yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {accounts.map((a) => (
              <li key={a.stripe_account_id} className="flex justify-between gap-2">
                <span>
                  {unwrapRelated(
                    a.merchants as { name: string } | { name: string }[] | null,
                  )?.name ?? a.merchant_id}
                </span>
                <code className="text-xs text-gray-500">{a.stripe_account_id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Son kart siparişleri</h2>
        <ul className="space-y-1 text-sm">
          {(cardOrders ?? []).map((o) => (
            <li key={o.id} className="flex justify-between">
              <span>
                {unwrapRelated(
                  o.merchants as { name: string } | { name: string }[] | null,
                )?.name ?? "—"}
              </span>
              <span>
                {o.payment_status} · ₺{((o.total_amount as number) / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Son webhook olayları</h2>
        <ul className="space-y-1 text-xs font-mono text-gray-600">
          {(events ?? []).map((e) => (
            <li key={e.stripe_event_id}>
              {e.event_type}{" "}
              {e.processed_at ? "✓" : e.last_error ? `✗ ${e.last_error}` : "…"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
