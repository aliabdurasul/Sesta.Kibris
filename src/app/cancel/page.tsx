/**
 * Stripe Checkout cancel redirect target.
 */
import Link from "next/link";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center bg-app-bg px-4 text-center">
      <h1 className="text-xl font-bold text-gray-900">Ödeme iptal edildi</h1>
      <p className="mt-2 text-sm text-gray-600">
        Kart ödemesi tamamlanmadı. İsterseniz tekrar deneyebilirsiniz.
      </p>
      {order_id && (
        <p className="mt-2 text-xs text-gray-400">Sipariş referansı: {order_id}</p>
      )}
      <Link
        href="/storefront"
        className="mt-6 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Vitrine dön
      </Link>
    </div>
  );
}
