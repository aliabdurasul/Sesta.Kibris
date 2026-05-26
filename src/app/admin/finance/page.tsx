/**
 * Admin finance — platform payments & offline merchant settlement (MIN-LAUNCH).
 */
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { listMerchantSettlementTotals } from "@/lib/stripe/settlement";
import { unwrapRelated } from "@/lib/stripe/db-helpers";
import {
  SettleOrderButton,
  SettleMerchantButton,
} from "@/components/admin/FinanceSettlementActions";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  await requireRole("admin");
  const admin = createStripeAdminClient();

  const [merchantTotals, { data: pendingOrders }, { data: failedPayments }] =
    await Promise.all([
      listMerchantSettlementTotals(),
      admin
        .from("orders")
        .select(
          "id, total_amount, paid_at, created_at, merchant_id, merchants(name)",
        )
        .eq("payment_method", "card")
        .eq("payment_status", "paid")
        .is("merchant_settled_at", null)
        .order("paid_at", { ascending: false })
        .limit(30),
      admin
        .from("orders")
        .select("id, total_amount, created_at, merchants(name)")
        .eq("payment_method", "card")
        .eq("payment_status", "failed")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

  const totalPendingKurus = merchantTotals.reduce(
    (s, m) => s + m.pendingSettlementKurus,
    0,
  );

  const totalPaidOrders = merchantTotals.reduce(
    (s, m) => s + m.paidOrderCount,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Finans</h1>
        <p className="text-sm text-gray-500">
          Platform Stripe hesabı — marketlere manuel hakediş ödemesi
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
          <p className="text-xs text-gray-500">Toplam kart siparişi (ödendi)</p>
          <p className="text-2xl font-bold">{totalPaidOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
          <p className="text-xs text-gray-500">Bekleyen hakediş (tüm marketler)</p>
          <p className="text-2xl font-bold">
            ₺{(totalPendingKurus / 100).toFixed(2)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Market hakedişleri</h2>
        {!merchantTotals.length ? (
          <p className="text-sm text-gray-400">Henüz ödenmiş kart siparişi yok.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {merchantTotals
              .filter((m) => m.pendingSettlementKurus > 0)
              .map((m) => (
                <li
                  key={m.merchantId}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-2"
                >
                  <div>
                    <p className="font-medium">{m.merchantName}</p>
                    <p className="text-xs text-gray-500">
                      {m.paidOrderCount} sipariş · ₺
                      {(m.pendingSettlementKurus / 100).toFixed(2)} bekliyor
                    </p>
                  </div>
                  <SettleMerchantButton merchantId={m.merchantId} />
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Hakediş bekleyen siparişler</h2>
        {!pendingOrders?.length ? (
          <p className="text-sm text-gray-400">Tüm hakedişler kapatılmış.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {pendingOrders.map((o) => (
              <li
                key={o.id as string}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {unwrapRelated(
                    o.merchants as { name: string } | { name: string }[] | null,
                  )?.name ?? "—"}{" "}
                  · ₺{((o.total_amount as number) / 100).toFixed(2)}
                </span>
                <SettleOrderButton orderId={o.id as string} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <h2 className="mb-3 font-semibold">Başarısız ödemeler</h2>
        {!failedPayments?.length ? (
          <p className="text-sm text-gray-400">Kayıt yok.</p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-600">
            {failedPayments.map((o) => (
              <li key={o.id as string} className="flex justify-between">
                <span>
                  {unwrapRelated(
                    o.merchants as { name: string } | { name: string }[] | null,
                  )?.name ?? "—"}
                </span>
                <span>₺{((o.total_amount as number) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/admin/stripe" className="text-sm text-blue-600 hover:underline">
        Webhook logları →
      </Link>
    </div>
  );
}
