/**
 * Stripe Checkout success redirect target (real marketplace + demo).
 */
import Link from "next/link";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";
import { ClearCartOnPaid } from "@/components/checkout/ClearCartOnPaid";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let orderId: string | null = null;
  let paymentStatus: string | null = null;
  let merchantSlug: string | null = null;

  if (session_id) {
    const admin = createStripeAdminClient();
    const { data } = await admin
      .from("orders")
      .select("id, payment_status, merchant_id, merchants(slug)")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (data) {
      orderId = data.id as string;
      paymentStatus = (data.payment_status as string | null) ?? null;
      const merch = data.merchants as { slug: string } | { slug: string }[] | null;
      merchantSlug = Array.isArray(merch) ? merch[0]?.slug ?? null : merch?.slug ?? null;
    }
  }

  const session = await getSession().catch(() => null);
  const orderHref =
    orderId && session?.role === "customer"
      ? `/customer/orders/${orderId}`
      : orderId
        ? `/order/${orderId}`
        : null;

  const continueHref = merchantSlug
    ? `/market/${merchantSlug}`
    : "/#browse-markets";

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center bg-app-bg px-4 text-center">
      <ClearCartOnPaid paymentStatus={paymentStatus} />
      <p className="mb-4 text-4xl">✓</p>
      <h1 className="text-xl font-bold text-gray-900">Ödeme alındı</h1>
      <p className="mt-2 text-sm text-gray-600">
        {paymentStatus === "paid"
          ? "Siparişiniz ödendi ve işleme alınacak."
          : "Ödemeniz işleniyor — birkaç saniye içinde onaylanır."}
      </p>
      {orderId && (
        <p className="mt-2 text-xs text-gray-400">Sipariş: {orderId}</p>
      )}
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        {orderHref && (
          <Link
            href={orderHref}
            className="rounded-xl bg-accent-strong px-6 py-3 text-sm font-semibold text-white"
          >
            Siparişi gör
          </Link>
        )}
        <Link
          href={continueHref}
          className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-900"
        >
          Alışverişe devam
        </Link>
      </div>
    </div>
  );
}
