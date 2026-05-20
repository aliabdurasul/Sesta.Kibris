/**
 * Guest / customer order confirmation — /checkout/success?order=uuid
 */
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.order ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="text-xl font-bold text-gray-900">Siparişiniz alındı</h1>
        {orderId && (
          <p className="mt-2 text-sm text-gray-500">
            Sipariş no: #{orderId.slice(-8).toUpperCase()}
          </p>
        )}
        <p className="mt-4 text-sm text-gray-600">
          Market siparişinizi onayladığında hazırlanmaya başlayacak.
        </p>
        <Link
          href="/merchants"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Marketlere dön
        </Link>
      </div>
    </main>
  );
}
