/**
 * Stripe Checkout success redirect target.
 */
import Link from "next/link";
import { createStripeAdminClient } from "@/lib/supabase/stripe-admin";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let orderId: string | null = null;
  let paymentStatus: string | null = null;

  if (session_id) {
    const admin = createStripeAdminClient();
    const { data } = await admin
      .from("orders")
      .select("id, payment_status")
      .eq("stripe_session_id", session_id)
      .maybeSingle();
    if (data) {
      orderId = data.id as string;
      paymentStatus = (data.payment_status as string | null) ?? null;
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center bg-app-bg px-4 text-center">
      <p className="text-4xl mb-4">✓</p>
      <h1 className="text-xl font-bold text-gray-900">Ödeme alındı</h1>
      <p className="mt-2 text-sm text-gray-600">
        {paymentStatus === "paid"
          ? "Siparişiniz ödendi ve işleme alınacak."
          : "Ödemeniz işleniyor — birkaç saniye içinde onaylanır."}
      </p>
      {orderId && (
        <p className="mt-2 text-xs text-gray-400">Sipariş: {orderId}</p>
      )}
      <Link
        href="/storefront"
        className="mt-6 rounded-xl bg-accent-strong px-6 py-3 text-sm font-semibold text-white"
      >
        Vitrine dön
      </Link>
    </div>
  );
}
