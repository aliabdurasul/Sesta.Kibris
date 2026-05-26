/**
 * Admin: Stripe webhook event log (technical).
 * Finans özeti için /admin/finance kullanın.
 */
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { unwrapRelated } from "@/lib/stripe/db-helpers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminStripePage() {
  await requireRole("admin");
  const admin = createStripeAdminClient();

  const [{ data: events }, { data: cardOrders }] = await Promise.all([
    admin
      .from("stripe_webhook_events")
      .select("stripe_event_id, event_type, processed_at, last_error, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("orders")
      .select("id, payment_status, total_amount, paid_at, created_at, merchants(name)")
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
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Stripe webhook logları</h1>
        <p className="text-sm text-gray-500">
          Teknik olay kaydı — platform hesabına gelen ödemeler. Hakediş için{" "}
          <Link href="/admin/finance" className="text-blue-600 hover:underline">
            Finans
          </Link>
          .
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Son kart siparişleri</h2>
        <ul className="space-y-1 text-sm">
          {(cardOrders ?? []).map((o) => (
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
        <h2 className="mb-3 font-semibold">Webhook olayları</h2>
        <ul className="space-y-1 text-xs font-mono text-gray-600">
          {(events ?? []).map((e) => (
            <li key={e.stripe_event_id as string}>
              {e.event_type as string}{" "}
              {e.processed_at ? "✓" : e.last_error ? `✗ ${e.last_error}` : "…"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
