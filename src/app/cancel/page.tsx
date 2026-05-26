/**
 * Stripe Checkout cancel redirect target.
 */
import Link from "next/link";
import { MarkOrderCanceled } from "@/components/checkout/MarkOrderCanceled";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center bg-app-bg px-4 text-center">
      <MarkOrderCanceled orderId={orderId ?? null} />
      <h1 className="text-xl font-bold text-gray-900">Ödeme iptal edildi</h1>
      <p className="mt-2 text-sm text-gray-600">
        Kart ödemesi tamamlanmadı. Sepetiniz korundu — tekrar deneyebilirsiniz.
      </p>
      {orderId && (
        <p className="mt-2 text-xs text-gray-400">Sipariş referansı: {orderId}</p>
      )}
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Link
          href="/checkout"
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white"
        >
          Tekrar dene
        </Link>
        <Link
          href="/#browse-markets"
          className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-900"
        >
          Alışverişe dön
        </Link>
      </div>
    </div>
  );
}
